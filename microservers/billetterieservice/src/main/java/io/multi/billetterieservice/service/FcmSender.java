package io.multi.billetterieservice.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Envoie des notifications push via Firebase (FCM/APNs).
 * Tolère l'absence de configuration Firebase (bean null) → no-op silencieux.
 * Nettoie les tokens devenus invalides (device désinstallé / token périmé).
 */
@Service
@Slf4j
public class FcmSender {

    private final ObjectProvider<FirebaseMessaging> messagingProvider;
    private final DeviceTokenService deviceTokenService;

    public FcmSender(ObjectProvider<FirebaseMessaging> messagingProvider,
                     DeviceTokenService deviceTokenService) {
        this.messagingProvider = messagingProvider;
        this.deviceTokenService = deviceTokenService;
    }

    /**
     * Envoie la même push à tous les tokens fournis (1 par device de l'user).
     * data : payload exploité par le mobile au tap (ex categorie, commandeUuid).
     */
    public void sendToTokens(List<String> tokens, String title, String body,
                             Map<String, String> data) {
        FirebaseMessaging messaging = messagingProvider.getIfAvailable();
        if (messaging == null || tokens == null || tokens.isEmpty()) {
            return; // FCM non configuré ou aucun device
        }
        int sent = 0;
        for (String token : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(token)
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putAllData(data)
                        .build();
                messaging.send(message);
                sent++;
            } catch (FirebaseMessagingException e) {
                MessagingErrorCode code = e.getMessagingErrorCode();
                if (code == MessagingErrorCode.UNREGISTERED
                        || code == MessagingErrorCode.INVALID_ARGUMENT) {
                    // Token mort → on le purge pour ne plus jamais l'utiliser.
                    deviceTokenService.delete(token);
                    log.info("Token FCM invalide purgé ({})", code);
                } else {
                    log.warn("Échec envoi push FCM : {}", e.getMessage());
                }
            }
        }
        if (sent > 0) {
            log.info("Push FCM envoyées : {}/{}", sent, tokens.size());
        }
    }
}
