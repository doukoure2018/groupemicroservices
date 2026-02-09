package io.multi.authorizationserver.security;

import com.nimbusds.jose.jwk.RSAKey;
import io.multi.authorizationserver.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Slf4j
@Component
public class KeyUtils {
    private static final String RSA = "RSA";

    @Value("${key.private}")
    private String privateKeyPath;

    @Value("${key.public}")
    private String publicKeyPath;

    public RSAKey getRSAKeyPair() {
        try {
            // Try loading from file path first
            File privateKeyFile = new File(privateKeyPath);
            File publicKeyFile = new File(publicKeyPath);

            if (privateKeyFile.exists() && publicKeyFile.exists()) {
                log.info("Loading RSA keys from file paths: {}, {}", privateKeyPath, publicKeyPath);
                return loadKeysFromPEM(privateKeyFile, publicKeyFile);
            }

            // Fallback to in-memory generation
            log.warn("Keys not found at specified paths. Using in-memory generated keys.");
            return generateInMemoryKeys();
        } catch (Exception e) {
            log.error("Key loading failed: {}. Falling back to in-memory keys.", e.getMessage());
            return generateInMemoryKeys();
        }
    }

    private RSAKey loadKeysFromPEM(File privateKeyFile, File publicKeyFile) {
        try {
            KeyFactory keyFactory = KeyFactory.getInstance(RSA);

            // Read private key PEM content
            String privateKeyContent = new String(Files.readAllBytes(privateKeyFile.toPath()));
            String privateKeyBase64 = privateKeyContent
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyBase64);
            PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
            RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(privateKeySpec);

            // Read public key PEM content
            String publicKeyContent = new String(Files.readAllBytes(publicKeyFile.toPath()));
            String publicKeyBase64 = publicKeyContent
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(publicKeyBytes);
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(publicKeySpec);

            log.info("Successfully loaded RSA keys from files");
            return buildRSAKey(publicKey, privateKey);
        } catch (Exception e) {
            log.error("Failed to load keys from PEM files: {}", e.getMessage());
            throw new RuntimeException("Error loading PEM keys", e);
        }
    }

    private RSAKey generateInMemoryKeys() {
        try {
            log.warn("Generating in-memory RSA keys");
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA);
            keyPairGenerator.initialize(2048);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            return buildRSAKey(
                    (RSAPublicKey) keyPair.getPublic(),
                    (RSAPrivateKey) keyPair.getPrivate()
            );
        } catch (Exception e) {
            log.error("Failed to generate in-memory keys: {}", e.getMessage());
            throw new ApiException("Failed to generate in-memory keys: " + e.getMessage());
        }
    }

    private RSAKey buildRSAKey(RSAPublicKey publicKey, RSAPrivateKey privateKey) {
        String keyId = "8ba198c1-3987-405b-bdc6-0187bb4c2cf8"; // Fixed UUID for key consistency
        log.info("Using key ID: {}", keyId);
        return new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(keyId)
                .build();
    }
}