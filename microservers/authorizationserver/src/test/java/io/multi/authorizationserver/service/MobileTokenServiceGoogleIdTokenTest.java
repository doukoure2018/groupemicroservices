package io.multi.authorizationserver.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Vérifie la sécurité de {@link MobileTokenService#decodeGoogleIdToken(String)}
 * (dette backend-google-idtoken-no-verification). On injecte une JWKSource
 * LOCALE (clé de test) : pas d'appel réseau au JWKS Google, mais la même
 * logique de vérification (signature RS256 + aud + exp + iss + email_verified).
 */
class MobileTokenServiceGoogleIdTokenTest {

    private static final String AUDIENCE =
            "421665850163-webclient.apps.googleusercontent.com";

    private MobileTokenService service;
    private RSAKey signingKey;   // clé de confiance (sa clé publique est dans le JWKS)

    @BeforeEach
    void setUp() throws Exception {
        signingKey = new RSAKeyGenerator(2048).keyID("test-key-1").generate();

        // keyUtils non utilisé par decodeGoogleIdToken → null acceptable ici.
        service = new MobileTokenService(null);
        ReflectionTestUtils.setField(service, "googleAudience", AUDIENCE);
        service.setGoogleKeySource(
                new ImmutableJWKSet<SecurityContext>(new JWKSet(signingKey.toPublicJWK())));
    }

    // ---- helpers ----

    private JWTClaimsSet.Builder validClaims() {
        Date now = new Date();
        return new JWTClaimsSet.Builder()
                .subject("google-sub-123")
                .audience(AUDIENCE)
                .issuer("https://accounts.google.com")
                .issueTime(now)
                .expirationTime(new Date(now.getTime() + 3_600_000)) // +1h
                .claim("email", "user@example.com")
                .claim("email_verified", true)
                .claim("given_name", "Test")
                .claim("family_name", "User");
    }

    private String sign(RSAKey key, JWTClaimsSet claims) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(),
                claims);
        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }

    // ---- cas ----

    @Test
    void tokenValide_estAccepte() throws Exception {
        Map<String, Object> claims = service.decodeGoogleIdToken(sign(signingKey, validClaims().build()));
        assertEquals("user@example.com", claims.get("email"));
        assertEquals("google-sub-123", claims.get("sub"));
    }

    @Test
    void tokenExpire_estRejete() throws Exception {
        Date past = new Date(System.currentTimeMillis() - 3_600_000); // -1h
        String token = sign(signingKey, validClaims()
                .expirationTime(past).build());
        assertThrows(Exception.class, () -> service.decodeGoogleIdToken(token));
    }

    @Test
    void audienceIncorrecte_estRejetee() throws Exception {
        String token = sign(signingKey, validClaims()
                .audience("mauvais-client-id.apps.googleusercontent.com").build());
        assertThrows(Exception.class, () -> service.decodeGoogleIdToken(token));
    }

    @Test
    void signatureInvalide_estRejetee() throws Exception {
        // Signé par une clé inconnue (kid absent du JWKS) → pas de clé pour vérifier.
        RSAKey attacker = new RSAKeyGenerator(2048).keyID("attacker-key").generate();
        String token = sign(attacker, validClaims().build());
        assertThrows(Exception.class, () -> service.decodeGoogleIdToken(token));
    }

    @Test
    void tokenAlgNone_estRejete() {
        // JWT non signé (alg=none) — l'attaque classique.
        String token = new PlainJWT(validClaims().build()).serialize();
        assertThrows(Exception.class, () -> service.decodeGoogleIdToken(token));
    }

    @Test
    void emailNonVerifie_estRejete() throws Exception {
        String token = sign(signingKey, validClaims()
                .claim("email_verified", false).build());
        assertThrows(Exception.class, () -> service.decodeGoogleIdToken(token));
    }

    @Test
    void audienceNonConfiguree_failClosed() throws Exception {
        ReflectionTestUtils.setField(service, "googleAudience", "");
        String token = sign(signingKey, validClaims().build());
        assertThrows(Exception.class, () -> service.decodeGoogleIdToken(token));
    }
}
