package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Billet;
import io.multi.billetterieservice.event.Event;
import io.multi.billetterieservice.event.EventType;
import io.multi.billetterieservice.event.Notification;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.query.BilletQuery;
import io.multi.billetterieservice.service.BilletService;
import io.multi.billetterieservice.service.InAppNotificationService;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

import static org.springframework.kafka.support.KafkaHeaders.TOPIC;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BilletServiceImpl implements BilletService {

    private static final String NOTIFICATION_TOPIC = "NOTIFICATION_TOPIC";

    private final JdbcClient jdbcClient;
    private final InAppNotificationService inAppNotificationService;
    private final KafkaTemplate<String, Notification> kafkaTemplate;
    private final UserClient userClient;

    @Override
    public Billet validateBillet(String codeBillet, Long validePar) {
        log.info("Validation du billet: {} par userId: {}", codeBillet, validePar);

        // 1. Chercher le billet avec infos trajet
        var result = jdbcClient.sql(BilletQuery.FIND_BY_CODE_BILLET)
                .param("codeBillet", codeBillet)
                .query((rs, rowNum) -> new Object[]{
                        Billet.builder()
                                .billetId(rs.getLong("billet_id"))
                                .billetUuid(rs.getString("billet_uuid"))
                                .commandeId(rs.getLong("commande_id"))
                                .codeBillet(rs.getString("code_billet"))
                                .numeroSiege(rs.getString("numero_siege"))
                                .nomPassager(rs.getString("nom_passager"))
                                .telephonePassager(rs.getString("telephone_passager"))
                                .pieceIdentite(rs.getString("piece_identite"))
                                .statut(rs.getString("statut"))
                                .dateValidation(rs.getObject("date_validation", OffsetDateTime.class))
                                .qrCodeData(rs.getString("qr_code_data"))
                                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                                .build(),
                        rs.getLong("user_id"),
                        rs.getString("ville_depart_libelle"),
                        rs.getString("ville_arrivee_libelle"),
                        rs.getObject("date_depart", LocalDate.class)
                })
                .optional()
                .orElseThrow(() -> new ApiException("Billet non trouvé: " + codeBillet));

        Billet billet = (Billet) result[0];
        Long userId = (Long) result[1];
        String villeDepart = (String) result[2];
        String villeArrivee = (String) result[3];
        LocalDate dateDepart = (LocalDate) result[4];

        // 2. Vérifier le statut
        if ("UTILISE".equals(billet.getStatut())) {
            throw new ApiException("Ce billet a déjà été utilisé");
        }
        if ("ANNULE".equals(billet.getStatut())) {
            throw new ApiException("Ce billet a été annulé");
        }
        if (!"VALIDE".equals(billet.getStatut())) {
            throw new ApiException("Billet non valide (statut: " + billet.getStatut() + ")");
        }

        // 3. Valider le billet
        int updated = jdbcClient.sql(BilletQuery.VALIDATE_BILLET)
                .param("billetId", billet.getBilletId())
                .param("validePar", validePar)
                .update();

        if (updated == 0) {
            throw new ApiException("Impossible de valider le billet");
        }

        log.info("Billet {} validé avec succès pour {}", codeBillet, billet.getNomPassager());

        billet.setStatut("UTILISE");
        billet.setDateValidation(OffsetDateTime.now());

        // 4. Notification in-app
        String trajet = villeDepart + " \u2192 " + villeArrivee;
        inAppNotificationService.createNotification(userId, "IN_APP", "BILLET_VALIDE",
                "Billet validé", "Votre billet " + codeBillet + " pour " + trajet + " a été validé. Bon voyage!",
                false, billet.getBilletId(), "BILLET");

        // 5. Notification Kafka (email)
        try {
            String userEmail = "";
            try {
                User user = userClient.getUserById(userId);
                if (user != null && user.getEmail() != null) {
                    userEmail = user.getEmail();
                }
            } catch (Exception e) {
                log.warn("Impossible de récupérer l'email utilisateur {}: {}", userId, e.getMessage());
            }

            var data = new HashMap<String, String>();
            data.put("name", billet.getNomPassager());
            data.put("userEmail", userEmail);
            data.put("phone", billet.getTelephonePassager() != null ? billet.getTelephonePassager() : "");
            data.put("codeBillet", codeBillet);
            data.put("trajet", trajet);
            data.put("dateDepart", dateDepart != null ? dateDepart.toString() : "");

            var event = new Event(EventType.BILLET_VALIDE, data);
            var message = MessageBuilder.withPayload(new Notification(event))
                    .setHeader(TOPIC, NOTIFICATION_TOPIC)
                    .build();

            CompletableFuture.runAsync(() -> {
                try {
                    kafkaTemplate.send(message);
                    log.info("Notification Kafka BILLET_VALIDE envoyée pour: {}", codeBillet);
                } catch (Exception ex) {
                    log.error("Kafka notification non envoyée pour billet {}: {}", codeBillet, ex.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Erreur préparation notification billet validé: {}", e.getMessage());
        }

        return billet;
    }
}
