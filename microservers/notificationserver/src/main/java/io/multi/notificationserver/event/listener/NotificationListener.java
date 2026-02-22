package io.multi.notificationserver.event.listener;


import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.notificationserver.domain.Data;
import io.multi.notificationserver.domain.Notification;
import io.multi.notificationserver.service.EmailService;
import io.multi.notificationserver.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import static com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationListener {
    private static final String NOTIFICATION_TOPIC = "NOTIFICATION_TOPIC";
    private final EmailService emailService;
    private final SmsService smsService;

    @KafkaListener(topics = NOTIFICATION_TOPIC)
    public void handleNotification(Notification notification) {
        log.info("Received notification: {}", notification.toString());
        var mapper = new ObjectMapper();
        mapper.configure(FAIL_ON_UNKNOWN_PROPERTIES, false);

        switch (notification.getPayload().getEventType()) {
            case RESETPASSWORD -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                emailService.sendPasswordResetHtmlEmail(data.getName(), data.getEmail(), data.getToken());
            }
            case USER_CREATED -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                emailService.sendNewAccountHtmlEmail(data.getName(), data.getEmail(), data.getToken());
            }
            case COMMANDE_CONFIRMEE -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                // Email au transporteur
                if (data.getEmail() != null && !data.getEmail().isBlank()) {
                    emailService.sendBookingConfirmationEmail(
                            data.getName(), data.getEmail(), data.getNumeroCommande(),
                            data.getTrajet(), data.getDateDepart(), data.getHeureDepart(),
                            data.getNombrePlaces(), data.getMontantPaye(), data.getBilletCodes()
                    );
                }
                // Email au passager
                if (data.getUserEmail() != null && !data.getUserEmail().isBlank()
                        && !data.getUserEmail().equals(data.getEmail())) {
                    emailService.sendBookingConfirmationEmail(
                            data.getName(), data.getUserEmail(), data.getNumeroCommande(),
                            data.getTrajet(), data.getDateDepart(), data.getHeureDepart(),
                            data.getNombrePlaces(), data.getMontantPaye(), data.getBilletCodes()
                    );
                }
                // SMS de confirmation
                if (data.getPhone() != null && !data.getPhone().isBlank()) {
                    smsService.sendBookingConfirmationSms(
                            data.getPhone(), data.getName(), data.getNumeroCommande(),
                            data.getTrajet(), data.getDateDepart(), data.getHeureDepart(),
                            data.getNombrePlaces(), data.getMontantPaye(), data.getBilletCodes()
                    );
                }
            }
            case COMMANDE_ANNULEE -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                // Email au transporteur
                if (data.getEmail() != null && !data.getEmail().isBlank()) {
                    emailService.sendBookingCancellationEmail(
                            data.getName(), data.getEmail(), data.getNumeroCommande(),
                            data.getTrajet(), data.getDateDepart(), data.getHeureDepart(),
                            data.getNombrePlaces(), data.getMontantPaye()
                    );
                }
                // Email au passager
                if (data.getUserEmail() != null && !data.getUserEmail().isBlank()
                        && !data.getUserEmail().equals(data.getEmail())) {
                    emailService.sendBookingCancellationEmail(
                            data.getName(), data.getUserEmail(), data.getNumeroCommande(),
                            data.getTrajet(), data.getDateDepart(), data.getHeureDepart(),
                            data.getNombrePlaces(), data.getMontantPaye()
                    );
                }
                // SMS d'annulation
                if (data.getPhone() != null && !data.getPhone().isBlank()) {
                    smsService.sendBookingCancellationSms(
                            data.getPhone(), data.getName(), data.getNumeroCommande(),
                            data.getTrajet(), data.getDateDepart(), data.getMontantPaye()
                    );
                }
            }
            case RAPPEL_J1, RAPPEL_H2 -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                if (data.getUserEmail() != null && !data.getUserEmail().isBlank()) {
                    emailService.sendDepartureReminderEmail(
                            data.getName(), data.getUserEmail(), data.getTrajet(),
                            data.getDateDepart(), data.getHeureDepart(),
                            data.getPointRendezVous(), data.getBilletCodes()
                    );
                }
                if (data.getPhone() != null && !data.getPhone().isBlank()) {
                    smsService.sendDepartureReminderSms(
                            data.getPhone(), data.getName(), data.getTrajet(),
                            data.getDateDepart(), data.getHeureDepart(),
                            data.getPointRendezVous()
                    );
                }
            }
            case REMPLISSAGE_50, REMPLISSAGE_75, REMPLISSAGE_100 -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                if (data.getEmail() != null && !data.getEmail().isBlank()) {
                    emailService.sendRemplissageUpdateEmail(
                            data.getName(), data.getEmail(), data.getTrajet(),
                            data.getDateDepart(), data.getHeureDepart(),
                            data.getNiveauRemplissage()
                    );
                }
            }
            case BILLET_VALIDE -> {
                var data = mapper.convertValue(notification.getPayload().getData(), Data.class);
                if (data.getUserEmail() != null && !data.getUserEmail().isBlank()) {
                    emailService.sendBilletValideEmail(
                            data.getName(), data.getUserEmail(), data.getCodeBillet(),
                            data.getTrajet(), data.getDateDepart()
                    );
                }
            }
            default -> log.warn("Unhandled event type: {}", notification.getPayload().getEventType());
        }
    }
}
