package io.multi.billetterieservice.scheduled;

import io.multi.billetterieservice.event.Event;
import io.multi.billetterieservice.event.EventType;
import io.multi.billetterieservice.event.Notification;
import io.multi.billetterieservice.query.ScheduledNotificationQuery;
import io.multi.billetterieservice.service.DeviceTokenService;
import io.multi.billetterieservice.service.FcmSender;
import io.multi.billetterieservice.service.InAppNotificationService;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.springframework.kafka.support.KafkaHeaders.TOPIC;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledNotificationService {

    private static final String NOTIFICATION_TOPIC = "NOTIFICATION_TOPIC";

    private final JdbcClient jdbcClient;
    private final InAppNotificationService inAppNotificationService;
    private final KafkaTemplate<String, Notification> kafkaTemplate;
    private final UserClient userClient;
    private final DeviceTokenService deviceTokenService;
    private final FcmSender fcmSender;

    /** Délai (heures) après l'arrivée estimée avant d'envoyer la demande d'avis. Défaut 24h. */
    @Value("${billetterie.avis.delai-heures:24}")
    private int avisDelaiHeures;

    /** Paliers de remplissage notifiés aux passagers, en ordre décroissant. */
    private static final int[] SEUILS_REMPLISSAGE = {100, 80, 50, 20};

    /**
     * Alerte les passagers aux paliers de remplissage (20/50/80/100 %).
     * Anti-rafale : chaque passager ne reçoit qu'UNE alerte (in-app + push FCM +
     * email/SMS) par franchissement — celle du palier le plus élevé atteint et
     * non encore notifié. Un passager qui réserve tard (ex. offre déjà à 85 %)
     * reçoit uniquement le palier 80, pas 20+50+80. L'idempotence s'appuie sur
     * les notifications in-app (existsByReference) : un palier — ou un palier
     * supérieur — déjà notifié n'est jamais renvoyé, même si le taux redescend
     * (annulation) puis remonte.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes (à 100 %, le départ est imminent)
    public void checkRemplissage() {
        var offres = jdbcClient.sql(ScheduledNotificationQuery.FIND_OFFRES_AT_REMPLISSAGE)
                .param("seuil", SEUILS_REMPLISSAGE[SEUILS_REMPLISSAGE.length - 1])
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("offre_id"),
                        rs.getString("offre_uuid"),
                        rs.getInt("niveau_remplissage"),
                        rs.getObject("date_depart", LocalDate.class),
                        rs.getObject("heure_depart", LocalTime.class),
                        rs.getString("ville_depart_libelle"),
                        rs.getString("ville_arrivee_libelle")
                })
                .list();

        for (var offre : offres) {
            Long offreId = (Long) offre[0];
            String offreUuid = (String) offre[1];
            int remplissage = (int) offre[2];
            String trajet = offre[5] + " → " + offre[6];

            // Palier courant = plus haut seuil atteint par l'offre
            int palier = 0;
            for (int seuil : SEUILS_REMPLISSAGE) {
                if (remplissage >= seuil) {
                    palier = seuil;
                    break;
                }
            }
            if (palier == 0) continue;

            var commandes = jdbcClient.sql(ScheduledNotificationQuery.FIND_COMMANDES_BY_OFFRE_ID)
                    .param("offreId", offreId)
                    .query((rs, rowNum) -> new Object[]{
                            rs.getLong("commande_id"),
                            rs.getLong("user_id"),
                            rs.getString("numero_commande"),
                            rs.getString("billet_codes"),
                            rs.getString("passager_noms"),
                            rs.getString("passager_phone")
                    })
                    .list();

            for (var cmd : commandes) {
                Long userId = (Long) cmd[1];
                String passagerNoms = cmd[4] != null ? (String) cmd[4] : "";
                String passagerPhone = cmd[5] != null ? (String) cmd[5] : "";

                // Déjà notifié de ce palier OU d'un palier supérieur → rien à faire
                boolean dejaNotifie = false;
                for (int seuil : SEUILS_REMPLISSAGE) {
                    if (seuil < palier) break;
                    if (inAppNotificationService.existsByReference(userId, offreId, "OFFRE", "REMPLISSAGE_" + seuil)) {
                        dejaNotifie = true;
                        break;
                    }
                }
                if (dejaNotifie) continue;

                String categorie = "REMPLISSAGE_" + palier;
                String titre = titreRemplissage(palier, remplissage);
                String message = messageRemplissage(palier, remplissage, trajet);

                inAppNotificationService.createNotification(userId, "IN_APP", categorie,
                        titre, message, false, offreId, "OFFRE");

                // Push système (FCM/APNs), même garde d'idempotence que l'in-app
                fcmSender.sendToTokens(
                        deviceTokenService.getTokensByUser(userId),
                        titre, message,
                        Map.of("categorie", categorie, "offreUuid", offreUuid));

                // Kafka → email + SMS
                String userEmail = getUserEmail(userId);
                var data = new HashMap<String, String>();
                data.put("name", passagerNoms);
                data.put("email", userEmail);
                data.put("userEmail", userEmail);
                data.put("phone", passagerPhone);
                data.put("trajet", trajet);
                data.put("dateDepart", offre[3].toString());
                data.put("heureDepart", offre[4].toString());
                data.put("niveauRemplissage", String.valueOf(remplissage));
                sendKafkaNotification(eventTypeRemplissage(palier), data);
            }
        }
    }

    private String titreRemplissage(int palier, int remplissage) {
        return palier == 100
                ? "Véhicule complet - Départ imminent"
                : "Remplissage à " + remplissage + "%";
    }

    private String messageRemplissage(int palier, int remplissage, String trajet) {
        return switch (palier) {
            case 100 -> "Votre véhicule pour " + trajet + " est complet. Préparez-vous, le départ approche!";
            case 80 -> "Votre véhicule pour " + trajet + " est rempli à " + remplissage + "%. Le départ approche, préparez-vous!";
            case 50 -> "Votre véhicule pour " + trajet + " est rempli à " + remplissage + "%. Pensez à vous préparer.";
            default -> "Votre véhicule pour " + trajet + " est rempli à " + remplissage + "%. Les réservations avancent.";
        };
    }

    private EventType eventTypeRemplissage(int palier) {
        return switch (palier) {
            case 100 -> EventType.REMPLISSAGE_100;
            case 80 -> EventType.REMPLISSAGE_80;
            case 50 -> EventType.REMPLISSAGE_50;
            default -> EventType.REMPLISSAGE_20;
        };
    }

    @Scheduled(cron = "0 0 18 * * *") // Every day at 18:00
    public void checkDepartDemain() {
        log.info("Vérification des départs de demain (rappel J-1)");

        var offres = jdbcClient.sql(ScheduledNotificationQuery.FIND_OFFRES_DEPART_DEMAIN)
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("offre_id"),
                        rs.getString("offre_uuid"),
                        rs.getObject("date_depart", LocalDate.class),
                        rs.getObject("heure_depart", LocalTime.class),
                        rs.getString("ville_depart_libelle"),
                        rs.getString("ville_arrivee_libelle"),
                        rs.getString("site_depart"),
                        rs.getString("point_rencontre")
                })
                .list();

        for (var offre : offres) {
            Long offreId = (Long) offre[0];
            String trajet = offre[4] + " → " + offre[5];
            String heureDepart = offre[3].toString();
            String siteDepart = (String) offre[6];
            String pointRendezVous = offre[7] != null ? (String) offre[7] : siteDepart;

            var commandes = jdbcClient.sql(ScheduledNotificationQuery.FIND_COMMANDES_BY_OFFRE_ID)
                    .param("offreId", offreId)
                    .query((rs, rowNum) -> new Object[]{
                            rs.getLong("commande_id"),
                            rs.getLong("user_id"),
                            rs.getString("numero_commande"),
                            rs.getString("billet_codes"),
                            rs.getString("passager_noms"),
                            rs.getString("passager_phone")
                    })
                    .list();

            for (var cmd : commandes) {
                Long userId = (Long) cmd[1];
                String numeroCommande = (String) cmd[2];
                String billetCodes = cmd[3] != null ? (String) cmd[3] : "";
                String passagerNoms = cmd[4] != null ? (String) cmd[4] : "";
                String passagerPhone = cmd[5] != null ? (String) cmd[5] : "";

                if (inAppNotificationService.existsByReference(userId, offreId, "OFFRE", "RAPPEL_J1")) {
                    continue;
                }

                String titre = "Rappel: Voyage demain!";
                String message = "Votre voyage " + trajet + " part demain à " + heureDepart
                        + ". RDV: " + pointRendezVous + ". Arrivez 30 min avant.";

                inAppNotificationService.createNotification(userId, "IN_APP", "RAPPEL_J1",
                        titre, message, false, offreId, "OFFRE");

                String userEmail = getUserEmail(userId);
                var data = new HashMap<String, String>();
                data.put("numeroCommande", numeroCommande);
                data.put("name", passagerNoms);
                data.put("userEmail", userEmail);
                data.put("phone", passagerPhone);
                data.put("trajet", trajet);
                data.put("dateDepart", offre[2].toString());
                data.put("heureDepart", heureDepart);
                data.put("pointRendezVous", pointRendezVous);
                data.put("billetCodes", billetCodes);
                sendKafkaNotification(EventType.RAPPEL_J1, data);
            }
        }
    }

    @Scheduled(fixedRate = 1800000) // 30 minutes
    public void checkDepartProche() {
        var offres = jdbcClient.sql(ScheduledNotificationQuery.FIND_OFFRES_DEPART_PROCHE)
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("offre_id"),
                        rs.getString("offre_uuid"),
                        rs.getObject("heure_depart", LocalTime.class),
                        rs.getString("ville_depart_libelle"),
                        rs.getString("ville_arrivee_libelle"),
                        rs.getString("site_depart"),
                        rs.getString("point_rencontre")
                })
                .list();

        for (var offre : offres) {
            Long offreId = (Long) offre[0];
            String trajet = offre[3] + " → " + offre[4];
            String heureDepart = offre[2].toString();
            String pointRendezVous = offre[6] != null ? (String) offre[6] : (String) offre[5];

            var commandes = jdbcClient.sql(ScheduledNotificationQuery.FIND_COMMANDES_BY_OFFRE_ID)
                    .param("offreId", offreId)
                    .query((rs, rowNum) -> new Object[]{
                            rs.getLong("commande_id"),
                            rs.getLong("user_id"),
                            rs.getString("numero_commande"),
                            rs.getString("billet_codes"),
                            rs.getString("passager_noms"),
                            rs.getString("passager_phone")
                    })
                    .list();

            for (var cmd : commandes) {
                Long userId = (Long) cmd[1];
                String numeroCommande = (String) cmd[2];
                String billetCodes = cmd[3] != null ? (String) cmd[3] : "";
                String passagerNoms = cmd[4] != null ? (String) cmd[4] : "";
                String passagerPhone = cmd[5] != null ? (String) cmd[5] : "";

                if (inAppNotificationService.existsByReference(userId, offreId, "OFFRE", "RAPPEL_H2")) {
                    continue;
                }

                String titre = "Départ dans moins de 2h!";
                String message = "Votre voyage " + trajet + " part à " + heureDepart
                        + ". Rendez-vous maintenant à " + pointRendezVous + ".";

                inAppNotificationService.createNotification(userId, "IN_APP", "RAPPEL_H2",
                        titre, message, false, offreId, "OFFRE");

                String userEmail = getUserEmail(userId);
                var data = new HashMap<String, String>();
                data.put("numeroCommande", numeroCommande);
                data.put("name", passagerNoms);
                data.put("userEmail", userEmail);
                data.put("phone", passagerPhone);
                data.put("trajet", trajet);
                data.put("dateDepart", LocalDate.now().toString());
                data.put("heureDepart", heureDepart);
                data.put("pointRendezVous", pointRendezVous);
                data.put("billetCodes", billetCodes);
                sendKafkaNotification(EventType.RAPPEL_H2, data);
            }
        }
    }

    /**
     * Demande d'avis post-voyage (Étape 8 du parcours client).
     * Crée une notification in-app "DEMANDE_AVIS" pour chaque commande dont le
     * voyage est terminé depuis >= delaiHeures, non annulée, sans avis ni
     * demande déjà envoyée. Le commandeUuid est stocké en metadata pour que le
     * mobile ouvre directement l'écran de notation au tap.
     * S'exécute toutes les 30 min (et au démarrage du service).
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes
    public void checkDemandeAvis() {
        var commandes = jdbcClient.sql(ScheduledNotificationQuery.FIND_COMMANDES_FOR_AVIS_REQUEST)
                .param("delaiHeures", avisDelaiHeures)
                .query((rs, rowNum) -> new Object[]{
                        rs.getLong("commande_id"),
                        rs.getString("commande_uuid"),
                        rs.getLong("user_id"),
                        rs.getString("ville_depart_libelle"),
                        rs.getString("ville_arrivee_libelle")
                })
                .list();

        for (var cmd : commandes) {
            Long commandeId = (Long) cmd[0];
            String commandeUuid = (String) cmd[1];
            Long userId = (Long) cmd[2];
            String trajet = cmd[3] + " → " + cmd[4];

            String titre = "Comment s'est passé votre voyage ?";
            String message = "Votre voyage " + trajet + " est terminé. "
                    + "Donnez votre avis pour aider les autres voyageurs !";
            String metadata = "{\"commandeUuid\":\"" + commandeUuid + "\"}";

            inAppNotificationService.createNotification(userId, "IN_APP", "DEMANDE_AVIS",
                    titre, message, false, commandeId, "COMMANDE", metadata);

            // Push système (FCM/APNs) en plus de l'in-app, si l'user a des devices.
            fcmSender.sendToTokens(
                    deviceTokenService.getTokensByUser(userId),
                    titre, message,
                    Map.of("categorie", "DEMANDE_AVIS", "commandeUuid", commandeUuid));
        }

        if (!commandes.isEmpty()) {
            log.info("Demandes d'avis créées: {} (délai={}h)", commandes.size(), avisDelaiHeures);
        }
    }

    private String getUserEmail(Long userId) {
        try {
            User user = userClient.getUserById(userId);
            return user != null && user.getEmail() != null ? user.getEmail() : "";
        } catch (Exception e) {
            log.warn("Impossible de récupérer l'email utilisateur {}: {}", userId, e.getMessage());
            return "";
        }
    }

    private void sendKafkaNotification(EventType eventType, Map<String, String> data) {
        CompletableFuture.runAsync(() -> {
            try {
                var event = new Event(eventType, data);
                var message = MessageBuilder.withPayload(new Notification(event))
                        .setHeader(TOPIC, NOTIFICATION_TOPIC)
                        .build();
                kafkaTemplate.send(message);
            } catch (Exception ex) {
                log.warn("Kafka notification non envoyée pour {}: {}", eventType, ex.getMessage());
            }
        });
    }
}
