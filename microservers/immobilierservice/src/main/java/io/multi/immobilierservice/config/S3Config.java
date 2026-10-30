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
 * Configuration du client S3 : MinIO en local, OVHcloud Object Storage (ou tout
 * S3) en hébergé. Même SDK, seuls le point d'accès, la région et les clés changent.
 *
 * <p>La région n'est pas décorative : la signature AWS v4 l'inclut. MinIO accepte
 * n'importe quelle valeur, OVH exige la région réelle du bucket (gra, sbg,
 * eu-west-par…) sinon SignatureDoesNotMatch.
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

    /** Région de signature v4 : arbitraire pour MinIO, obligatoire et exacte pour OVH. */
    @Value("${minio.region:us-east-1}")
    private String region;

    /** Accès par chemin (https://hôte/bucket/clé) : requis par MinIO, accepté par OVH. */
    @Value("${minio.path-style:true}")
    private boolean pathStyle;

    @Bean
    public S3Client s3Client() {
        log.info("Initialisation S3Client : endpoint={} region={} pathStyle={}", endpoint, region, pathStyle);
        if (endpoint == null || endpoint.isBlank()) {
            // Depuis le retrait de MinIO des registres publics, le stockage est
            // forcément externe : sans point d'accès, les photos sont inopérantes.
            log.error("minio.endpoint non configuré — le stockage des photos ne fonctionnera pas. "
                    + "Renseigner MINIO_ENDPOINT (cf docs/bascule-object-storage-ovh.md).");
        }
        var constructeur = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .region(Region.of(region))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(pathStyle)
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
                        .build());
        if (endpoint != null && !endpoint.isBlank()) {
            constructeur.endpointOverride(URI.create(endpoint));
        }
        return constructeur.build();
    }
}
