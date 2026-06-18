package io.multi.billetterieservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.util.Base64;

/**
 * Initialise le Firebase Admin SDK pour l'envoi des push FCM/APNs.
 *
 * Le compte de service (clé privée) est fourni en base64 via la variable
 * d'env FCM_SERVICE_ACCOUNT_B64 (jamais commité, posé en secret serveur).
 * Si absent / invalide, le bean est null → l'envoi push est désactivé
 * proprement (les notifications in-app continuent de fonctionner).
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${fcm.service-account-b64:}")
    private String serviceAccountB64;

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (serviceAccountB64 == null || serviceAccountB64.isBlank()) {
            log.warn("FCM désactivé : FCM_SERVICE_ACCOUNT_B64 absent. Push non envoyées (in-app OK).");
            return null;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(serviceAccountB64.trim());
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(new ByteArrayInputStream(decoded)))
                    .build();
            FirebaseApp app = FirebaseApp.getApps().isEmpty()
                    ? FirebaseApp.initializeApp(options)
                    : FirebaseApp.getInstance();
            log.info("Firebase initialisé — envoi push FCM actif.");
            return FirebaseMessaging.getInstance(app);
        } catch (Exception e) {
            log.error("Échec init Firebase, push désactivées : {}", e.getMessage());
            return null;
        }
    }
}
