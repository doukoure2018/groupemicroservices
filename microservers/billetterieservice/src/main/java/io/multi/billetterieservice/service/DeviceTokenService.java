package io.multi.billetterieservice.service;

import java.util.List;

public interface DeviceTokenService {
    /** Enregistre (ou met à jour) le token FCM/APNs d'un device pour un utilisateur. */
    void register(Long userId, String token, String platform);

    /** Tokens de device actifs d'un utilisateur (pour l'envoi push). */
    List<String> getTokensByUser(Long userId);

    /** Supprime un token (token invalide signalé par FCM, ou logout). */
    void delete(String token);
}
