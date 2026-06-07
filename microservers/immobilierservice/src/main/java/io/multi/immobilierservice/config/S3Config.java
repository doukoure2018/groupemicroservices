package io.multi.immobilierservice.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;
import java.time.Duration;

/**
 * Configuration du client S3 (compatible MinIO).
 * Utilise l'AWS SDK v2 pour rester portable vers un vrai S3 / Google Cloud Storage / etc.
 */
@Configuration
@Slf4j
public class S3Config {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        log.info("Initialisation S3Client : endpoint={}", endpoint);
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .region(Region.US_EAST_1) // arbitraire pour MinIO (requis par le SDK)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true) // OBLIGATOIRE pour MinIO
                        .build())
                // Borne le temps d'appel S3 : sans ça, si MinIO est down/lent,
                // le SDK retry-backoff peut bloquer le thread HTTP immo ~1-5 min
                // (defaults agressifs : baseDelay=100ms × backoff exponentiel ×
                // numRetries=3+). Cas réel détecté T18 2026-05-31 : MinIO arrêté
                // → upload mobile en spinner infini, gateway timeout 504.
                //
                // - apiCallTimeout 15s : hard cap TOTAL (englobe tous les retries
                //   internes du SDK — l'opération entière s'avorte à 15s).
                // - apiCallAttemptTimeout 8s : par tentative individuelle (donc
                //   ≤1 retry possible avant de hit le total à 15s).
                //
                // Résultat : si MinIO down, immo répond 5xx au mobile en ≤15s
                // au lieu de hang. Le mobile peut afficher dialog retry (cf
                // PhotoUploadService) et l'utilisateur peut réessayer.
                // Ferme dette backend-minio-no-short-timeout-debt.
                //
                // Note : on n'override pas RetryPolicy car c'est déprécié SDK v2.
                // Le hard cap apiCallTimeout suffit à borner les retries du SDK.
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallTimeout(Duration.ofSeconds(15))
                        .apiCallAttemptTimeout(Duration.ofSeconds(8))
                        .build())
                .build();
    }
}
