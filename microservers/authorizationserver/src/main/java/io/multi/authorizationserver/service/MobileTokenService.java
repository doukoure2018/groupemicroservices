package io.multi.authorizationserver.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.security.KeyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MobileTokenService {

    /** Endpoint JWKS des clés publiques de signature des idToken Google. */
    private static final String GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    /** Issuers valides d'un idToken Google (les 2 formes sont émises). */
    private static final Set<String> GOOGLE_ISSUERS =
            Set.of("accounts.google.com", "https://accounts.google.com");

    private final KeyUtils keyUtils;
    private final RefreshTokenStore refreshTokenStore;

    @Value("${oauth.issuer:http://localhost:8090}")
    private String issuer;

    /**
     * Audience attendue (= Web Client ID SIRA passé en serverClientId par le
     * mobile). Injectée via google.oauth.audience (→ GOOGLE_OAUTH_AUDIENCE ou
     * GOOGLE_CLIENT_ID). Vide = fail-closed : aucun idToken accepté.
     */
    @Value("${google.oauth.audience:}")
    private String googleAudience;

    // Processor JWT Google (signature RS256 via JWKS + exp/aud), construit
    // paresseusement et caché. Remplaçable en test via setGoogleKeySource().
    private volatile JWKSource<SecurityContext> googleKeySource;
    private volatile ConfigurableJWTProcessor<SecurityContext> googleJwtProcessor;

    /** Test-only : injecte une source de clés locale (pas d'appel réseau JWKS). */
    void setGoogleKeySource(JWKSource<SecurityContext> source) {
        this.googleKeySource = source;
        this.googleJwtProcessor = null; // force la reconstruction du processor
    }

    /**
     * Generate access_token, refresh_token, and id_token for a user
     */
    public Map<String, Object> generateTokens(User user) throws Exception {
        Instant now = Instant.now();

        String accessToken = generateAccessToken(user, now);
        String refreshToken = generateRefreshToken(user, now);
        String idToken = generateIdToken(user, now);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "success");
        result.put("access_token", accessToken);
        result.put("refresh_token", refreshToken);
        result.put("id_token", idToken);
        result.put("token_type", "Bearer");
        result.put("expires_in", 3600); // 1 hour in seconds

        return result;
    }

    /**
     * Refresh tokens using a refresh token
     */
    public Map<String, Object> refreshTokens(String refreshToken) throws Exception {
        // Verify the refresh token
        SignedJWT signedJWT = SignedJWT.parse(refreshToken);
        JWSVerifier verifier = new RSASSAVerifier(keyUtils.getRSAKeyPair().toRSAPublicKey());

        if (!signedJWT.verify(verifier)) {
            throw new RuntimeException("Invalid refresh token signature");
        }

        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        // Check expiration
        if (claims.getExpirationTime() != null && claims.getExpirationTime().before(new Date())) {
            throw new RuntimeException("Refresh token expired");
        }

        // Check token type
        String tokenType = (String) claims.getClaim("token_type");
        if (!"refresh".equals(tokenType)) {
            throw new RuntimeException("Invalid token type");
        }

        // Rotation + révocation : le jti doit être ACTIF en BD (non révoqué,
        // non expiré). Sinon (logout, rotation déjà consommée, password-change,
        // user supprimé, jti inconnu) → refus.
        String jti = claims.getJWTID();
        if (!refreshTokenStore.isActive(jti)) {
            throw new RuntimeException("Refresh token revoked or unknown");
        }
        // Rotation : révoque l'ancien jti ; generateTokens émet un nouveau jti.
        refreshTokenStore.revoke(jti);

        // Reconstruct a minimal User for token generation
        User user = User.builder()
                .userId(Long.parseLong(claims.getClaim("user_id").toString()))
                .userUuid(claims.getSubject())
                .email((String) claims.getClaim("email"))
                .firstName((String) claims.getClaim("given_name"))
                .lastName((String) claims.getClaim("family_name"))
                .role((String) claims.getClaim("role"))
                .authorities((String) claims.getClaim("authorities"))
                .build();

        return generateTokens(user);
    }

    /** Révoque le refresh token fourni (logout). Vérifie signature + type. */
    public void revokeRefreshToken(String refreshToken) throws Exception {
        JWTClaimsSet claims = verifyRefreshToken(refreshToken);
        refreshTokenStore.revoke(claims.getJWTID());
    }

    /** Révoque TOUS les refresh tokens de l'utilisateur (logout-all). */
    public void revokeAllSessions(String refreshToken) throws Exception {
        JWTClaimsSet claims = verifyRefreshToken(refreshToken);
        Long userId = Long.parseLong(claims.getClaim("user_id").toString());
        refreshTokenStore.revokeAllForUser(userId);
    }

    /** Vérifie signature + type=refresh d'un refresh token, retourne ses claims. */
    private JWTClaimsSet verifyRefreshToken(String refreshToken) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(refreshToken);
        JWSVerifier verifier = new RSASSAVerifier(keyUtils.getRSAKeyPair().toRSAPublicKey());
        if (!signedJWT.verify(verifier)) {
            throw new RuntimeException("Invalid refresh token signature");
        }
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
        if (!"refresh".equals(claims.getClaim("token_type"))) {
            throw new RuntimeException("Invalid token type");
        }
        return claims;
    }

    /**
     * Vérifie ET décode un idToken Google reçu du mobile (POST /api/auth/google).
     *
     * Vérifications (échec → exception → 401 côté controller) :
     *   1. Signature RS256 contre le JWKS public Google (clés tournantes).
     *      Rejette de facto les tokens forgés et alg=none (pas de clé RS256).
     *   2. Expiration (exp) — via le claims verifier nimbus.
     *   3. Audience (aud) == Web Client ID SIRA (google.oauth.audience).
     *   4. Issuer (iss) ∈ {accounts.google.com, https://accounts.google.com}.
     *   5. email_verified == true (refuse les emails Google non vérifiés).
     *
     * NE PLUS jamais faire un simple SignedJWT.parse() sans vérif : un idToken
     * accepté = émission de tokens app, donc usurpation possible (cf dette
     * backend-google-idtoken-no-verification).
     */
    public Map<String, Object> decodeGoogleIdToken(String idToken) throws Exception {
        if (googleAudience == null || googleAudience.isBlank()) {
            // Fail-closed : tant que l'audience (Web Client ID) n'est pas
            // configurée, on refuse — pas de vérification possible.
            throw new SecurityException(
                    "google.oauth.audience non configuré — idToken Google refusé");
        }

        // 1+2+3 : signature (JWKS Google) + exp + aud + claims requis.
        JWTClaimsSet claims;
        try {
            claims = googleJwtProcessor().process(idToken, null);
        } catch (Exception e) {
            throw new SecurityException("idToken Google invalide : " + e.getMessage(), e);
        }

        // 4 : issuer.
        if (claims.getIssuer() == null || !GOOGLE_ISSUERS.contains(claims.getIssuer())) {
            throw new SecurityException("idToken Google : issuer invalide (" + claims.getIssuer() + ")");
        }

        // 5 : email vérifié par Google.
        Object emailVerified = claims.getClaim("email_verified");
        boolean verified = Boolean.TRUE.equals(emailVerified)
                || "true".equalsIgnoreCase(String.valueOf(emailVerified));
        if (!verified) {
            throw new SecurityException("idToken Google : email_verified != true");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sub", claims.getSubject());
        result.put("email", claims.getStringClaim("email"));
        result.put("given_name", claims.getStringClaim("given_name"));
        result.put("family_name", claims.getStringClaim("family_name"));
        result.put("picture", claims.getStringClaim("picture"));
        result.put("name", claims.getStringClaim("name"));

        return result;
    }

    /** Processor JWT Google paresseux et caché (clé source + verifier aud/exp). */
    private ConfigurableJWTProcessor<SecurityContext> googleJwtProcessor() throws Exception {
        ConfigurableJWTProcessor<SecurityContext> proc = googleJwtProcessor;
        if (proc == null) {
            synchronized (this) {
                proc = googleJwtProcessor;
                if (proc == null) {
                    DefaultJWTProcessor<SecurityContext> p = new DefaultJWTProcessor<>();
                    p.setJWSKeySelector(new JWSVerificationKeySelector<>(
                            JWSAlgorithm.RS256, googleKeySource()));
                    // Vérifie aud ∈ audiences acceptées + présence sub/email/exp
                    // + exp non dépassé. iss vérifié manuellement (2 valeurs OK).
                    // google.oauth.audience est une LISTE séparée par virgules :
                    // l'aud d'un idToken Google = le Client ID de la PLATEFORME
                    // qui l'a émis (Web sur Android via serverClientId, mais iOS
                    // Client ID sur iOS). On accepte donc tous nos client IDs.
                    Set<String> acceptedAudiences = Arrays.stream(googleAudience.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toSet());
                    p.setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>(
                            acceptedAudiences,
                            null,
                            new HashSet<>(Arrays.asList("sub", "email", "exp")),
                            null));
                    googleJwtProcessor = p;
                    proc = p;
                }
            }
        }
        return proc;
    }

    /** Source de clés Google (RemoteJWKSet en prod, override local en test). */
    private JWKSource<SecurityContext> googleKeySource() throws Exception {
        JWKSource<SecurityContext> src = googleKeySource;
        if (src == null) {
            synchronized (this) {
                src = googleKeySource;
                if (src == null) {
                    src = new RemoteJWKSet<>(new URL(GOOGLE_CERTS_URL));
                    googleKeySource = src;
                }
            }
        }
        return src;
    }

    private String generateAccessToken(User user, Instant now) throws Exception {
        JWSSigner signer = new RSASSASigner(keyUtils.getRSAKeyPair().toRSAPrivateKey());

        String authorities = (user.getRole() != null ? user.getRole() : "") +
                (user.getAuthorities() != null ? "," + user.getAuthorities() : "");

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(user.getUserUuid())
                .audience("mobile-app-client")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(1, ChronoUnit.HOURS)))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", "openid profile email")
                .claim("authorities", authorities)
                .claim("user_id", user.getUserId())
                .claim("user_uuid", user.getUserUuid())
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(keyUtils.getRSAKeyPair().getKeyID())
                        .type(JOSEObjectType.JWT)
                        .build(),
                claimsSet
        );
        signedJWT.sign(signer);
        return signedJWT.serialize();
    }

    private String generateRefreshToken(User user, Instant now) throws Exception {
        JWSSigner signer = new RSASSASigner(keyUtils.getRSAKeyPair().toRSAPrivateKey());

        // Refresh token 90 jours (rétention longue durée, fenêtre glissante).
        // jti tracké en BD (refresh_token) → rotation + révocation possibles
        // (RefreshTokenStore). Cf dette backend-refresh-token-rotation-revocation.
        Instant expiresAt = now.plus(90, ChronoUnit.DAYS);
        String jti = UUID.randomUUID().toString();
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(user.getUserUuid())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiresAt))
                .jwtID(jti)
                .claim("token_type", "refresh")
                .claim("user_id", user.getUserId())
                .claim("email", user.getEmail())
                .claim("given_name", user.getFirstName())
                .claim("family_name", user.getLastName())
                .claim("role", user.getRole())
                .claim("authorities", user.getAuthorities())
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(keyUtils.getRSAKeyPair().getKeyID())
                        .type(JOSEObjectType.JWT)
                        .build(),
                claimsSet
        );
        signedJWT.sign(signer);
        // Persiste le jti (état serveur pour rotation/révocation).
        refreshTokenStore.save(jti, user.getUserId(), expiresAt);
        return signedJWT.serialize();
    }

    private String generateIdToken(User user, Instant now) throws Exception {
        JWSSigner signer = new RSASSASigner(keyUtils.getRSAKeyPair().toRSAPrivateKey());

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(user.getUserId() != null ? user.getUserId().toString() : user.getUserUuid())
                .audience("mobile-app-client")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(30, ChronoUnit.MINUTES)))
                .jwtID(UUID.randomUUID().toString())
                .claim("name", (user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : ""))
                .claim("given_name", user.getFirstName())
                .claim("family_name", user.getLastName())
                .claim("email", user.getEmail())
                .claim("preferred_username", user.getEmail())
                .claim("authorities", (user.getRole() != null ? user.getRole() : "") +
                        (user.getAuthorities() != null ? "," + user.getAuthorities() : ""))
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(keyUtils.getRSAKeyPair().getKeyID())
                        .type(JOSEObjectType.JWT)
                        .build(),
                claimsSet
        );
        signedJWT.sign(signer);
        return signedJWT.serialize();
    }
}
