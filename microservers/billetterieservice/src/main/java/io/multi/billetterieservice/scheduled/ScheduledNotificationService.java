package io.multi.billetterieservice.scheduled;

import io.multi.billetterieservice.event.Event;
import io.multi.billetterieservice.event.EventType;
import io.multi.billetterieservice.event.Notification;
import io.multi.billetterieservice.query.ScheduledNotificationQuery;
import io.multi.billetterieservice.service.InAppNotificationService;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Scheduled(fixedRate = 900000) // 15 minutes
    public void checkRemplissage() {
        for (int seuil : new int[]{50, 75, 100}) {
            checkRemplissageAtSeuil(seuil);
        }
    }

    private void checkRemplissageAtSeuil(int seuil) {
        String categorie = "REMPLISSAGE_" + seuil;
        EventType eventType = switch (seuil) {
            case 50 -> EventType.REMPLISSAGE_50;
            case 75 -> EventType.REMPLISSAGE_75;
            default -> EventType.REMPLISSAGE_100;
        };

        var offres = jdbcClient.sql(ScheduledNotificationQuery.FIND_OFFRES_AT_REMPLISSAGE)
                .param("seuil", seuil)
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
            String trajet = offre[5] + " → " + offre[6];
            int remplissage = (int) offre[2];

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

                if (inAppNotificationService.existsByReference(offreId, "OFFRE", categorie)) {
                    continue;
                }

                String titre = seuil == 100
                        ? "Véhicule complet - Départ imminent"
                        : "Remplissage à " + remplissage + "%";
                String message = seuil == 100
                        ? "Votre véhicule pour " + trajet + " est complet. Préparez-vous, le départ approche!"
                        : "Votre véhicule pour " + trajet + " est rempli à " + remplissage + "%.";

                inAppNotificationService.createNotification(userId, "IN_APP", categorie,
                        titre, message, false, offreId, "OFFRE");

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
                sendKafkaNotification(eventType, data);
            }
        }
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

                if (inAppNotificationService.existsByReference(offreId, "OFFRE", "RAPPEL_J1")) {
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

                if (inAppNotificationService.existsByReference(offreId, "OFFRE", "RAPPEL_H2")) {
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
