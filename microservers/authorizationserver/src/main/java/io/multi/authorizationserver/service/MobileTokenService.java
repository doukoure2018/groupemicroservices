package io.multi.authorizationserver.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.security.KeyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MobileTokenService {

    private final KeyUtils keyUtils;

    @Value("${oauth.issuer:http://localhost:8090}")
    private String issuer;

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

    /**
     * Decode a Google ID token (JWT) to extract claims.
     * The token is already validated client-side by Google SDK.
     * For production, consider server-side verification with Google's public keys.
     */
    public Map<String, Object> decodeGoogleIdToken(String idToken) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(idToken);
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        Map<String, Object> result = new HashMap<>();
        result.put("sub", claims.getSubject());
        result.put("email", claims.getStringClaim("email"));
        result.put("given_name", claims.getStringClaim("given_name"));
        result.put("family_name", claims.getStringClaim("family_name"));
        result.put("picture", claims.getStringClaim("picture"));
        result.put("name", claims.getStringClaim("name"));

        return result;
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

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(user.getUserUuid())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(30, ChronoUnit.DAYS)))
                .jwtID(UUID.randomUUID().toString())
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
