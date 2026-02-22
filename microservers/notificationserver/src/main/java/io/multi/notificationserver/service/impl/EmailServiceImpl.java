package io.multi.notificationserver.service.impl;

import io.multi.notificationserver.exception.ApiException;
import io.multi.notificationserver.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

import static io.multi.notificationserver.utils.EmailUtils.getResetPasswordUrl;
import static io.multi.notificationserver.utils.EmailUtils.getVerificationUrl;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    public static final String NEW_USER_ACCOUNT_VERIFICATION = "New Account Verification";
    public static final String ACCOUNT_VERIFICATION_TEMPLATE = "newaccount";
    public static final String PASSWORD_RESET_TEMPLATE = "resetpassword";
    public static final String PASSWORD_RESET_REQUEST = "Reset Password Request";
    public static final String NEW_TICKET_TEMPLATE = "newticket";
    public static final String NEW_COMMENT_TEMPLATE = "newcomment";
    public static final String NEW_FILE_TEMPLATE = "newfile";
    public static final String NEW_TICKET_REQUEST = "New Support Ticket";

    public static final String STOCK_VALIDATION_TEMPLATE = "stock_validation";
    public static final String STOCK_REJECTION_TEMPLATE = "stock_rejection";
    public static final String BOOKING_CONFIRMATION_TEMPLATE = "bookingconfirmation";
    public static final String BOOKING_CONFIRMATION_SUBJECT = "Confirmation de votre réservation";
    public static final String BOOKING_CANCELLATION_TEMPLATE = "bookingcancellation";
    public static final String BOOKING_CANCELLATION_SUBJECT = "Annulation de votre réservation";
    public static final String DEPARTURE_REMINDER_TEMPLATE = "rappeldepart";
    public static final String DEPARTURE_REMINDER_SUBJECT = "Rappel de votre départ";
    public static final String REMPLISSAGE_UPDATE_TEMPLATE = "remplissageupdate";
    public static final String REMPLISSAGE_UPDATE_SUBJECT = "Mise à jour remplissage";
    public static final String BILLET_VALIDE_TEMPLATE = "billetvalide";
    public static final String BILLET_VALIDE_SUBJECT = "Billet validé";

    private final TemplateEngine templateEngine;
    private final JavaMailSender mailSender;

    @Value("${mail.from.email}")
    private String fromEmail;

    @Value("${mail.from.name}")
    private String fromName;

    @Value("${verify.email.host}")
    private String host;

    @Override
    @Async
    public void sendNewAccountHtmlEmail(String name, String to, String token) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "url", getVerificationUrl(host, token)
            ));
            var htmlContent = templateEngine.process(ACCOUNT_VERIFICATION_TEMPLATE, context);

            sendEmail(to, NEW_USER_ACCOUNT_VERIFICATION, htmlContent);
            log.info("Account verification email sent to: {}", to);
        } catch (Exception exception) {
            log.error("Error sending account verification email: {}", exception.getMessage(), exception);
            throw new ApiException("Unable to send email");
        }
    }

    @Override
    @Async
    public void sendPasswordResetHtmlEmail(String name, String to, String token) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "url", getResetPasswordUrl(host, token)
            ));
            var htmlContent = templateEngine.process(PASSWORD_RESET_TEMPLATE, context);

            sendEmail(to, PASSWORD_RESET_REQUEST, htmlContent);
            log.info("Password reset email sent to: {}", to);
        } catch (Exception exception) {
            log.error("Error sending password reset email: {}", exception.getMessage(), exception);
            throw new ApiException("Unable to send email");
        }
    }



    @Override
    public void sendNewTicketHtmlEmail(String name, String email, String ticketTitle, String ticketNumber, String priority) {
        // TODO: Implement when needed
    }

    @Override
    public void sendNewFilesHtmlEmail(String name, String email, String files, String ticketTitle, String ticketNumber, String priority, String date) {
        // TODO: Implement when needed
    }

    @Override
    @Async
    public void sendBookingConfirmationEmail(String name, String email, String numeroCommande, String trajet, String dateDepart, String heureDepart, String nombrePlaces, String montantPaye, String billetCodes) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "numeroCommande", numeroCommande,
                    "trajet", trajet,
                    "dateDepart", dateDepart,
                    "heureDepart", heureDepart,
                    "nombrePlaces", nombrePlaces,
                    "montantPaye", montantPaye,
                    "billetCodes", billetCodes
            ));
            var htmlContent = templateEngine.process(BOOKING_CONFIRMATION_TEMPLATE, context);

            sendEmail(email, BOOKING_CONFIRMATION_SUBJECT + " - " + numeroCommande, htmlContent);
            log.info("Booking confirmation email sent to: {} for order: {}", email, numeroCommande);
        } catch (Exception exception) {
            log.error("Error sending booking confirmation email: {}", exception.getMessage(), exception);
        }
    }

    @Override
    @Async
    public void sendBookingCancellationEmail(String name, String email, String numeroCommande, String trajet, String dateDepart, String heureDepart, String nombrePlaces, String montantPaye) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "numeroCommande", numeroCommande,
                    "trajet", trajet,
                    "dateDepart", dateDepart,
                    "heureDepart", heureDepart,
                    "nombrePlaces", nombrePlaces,
                    "montantPaye", montantPaye
            ));
            var htmlContent = templateEngine.process(BOOKING_CANCELLATION_TEMPLATE, context);

            sendEmail(email, BOOKING_CANCELLATION_SUBJECT + " - " + numeroCommande, htmlContent);
            log.info("Booking cancellation email sent to: {} for order: {}", email, numeroCommande);
        } catch (Exception exception) {
            log.error("Error sending booking cancellation email: {}", exception.getMessage(), exception);
        }
    }

    @Override
    @Async
    public void sendDepartureReminderEmail(String name, String email, String trajet, String dateDepart, String heureDepart, String pointRendezVous, String billetCodes) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "trajet", trajet,
                    "dateDepart", dateDepart,
                    "heureDepart", heureDepart,
                    "pointRendezVous", pointRendezVous != null ? pointRendezVous : "",
                    "billetCodes", billetCodes != null ? billetCodes : ""
            ));
            var htmlContent = templateEngine.process(DEPARTURE_REMINDER_TEMPLATE, context);

            sendEmail(email, DEPARTURE_REMINDER_SUBJECT + " - " + trajet, htmlContent);
            log.info("Departure reminder email sent to: {} for trip: {}", email, trajet);
        } catch (Exception exception) {
            log.error("Error sending departure reminder email: {}", exception.getMessage(), exception);
        }
    }

    @Override
    @Async
    public void sendRemplissageUpdateEmail(String name, String email, String trajet, String dateDepart, String heureDepart, String niveauRemplissage) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "trajet", trajet,
                    "dateDepart", dateDepart,
                    "heureDepart", heureDepart,
                    "niveauRemplissage", niveauRemplissage
            ));
            var htmlContent = templateEngine.process(REMPLISSAGE_UPDATE_TEMPLATE, context);

            sendEmail(email, REMPLISSAGE_UPDATE_SUBJECT + " - " + trajet + " (" + niveauRemplissage + "%)", htmlContent);
            log.info("Remplissage update email sent to: {} for trip: {}", email, trajet);
        } catch (Exception exception) {
            log.error("Error sending remplissage update email: {}", exception.getMessage(), exception);
        }
    }

    @Override
    @Async
    public void sendBilletValideEmail(String name, String email, String codeBillet, String trajet, String dateDepart) {
        try {
            var context = new Context();
            context.setVariables(Map.of(
                    "name", name,
                    "codeBillet", codeBillet,
                    "trajet", trajet,
                    "dateDepart", dateDepart
            ));
            var htmlContent = templateEngine.process(BILLET_VALIDE_TEMPLATE, context);

            sendEmail(email, BILLET_VALIDE_SUBJECT + " - " + codeBillet, htmlContent);
            log.info("Billet valide email sent to: {} for billet: {}", email, codeBillet);
        } catch (Exception exception) {
            log.error("Error sending billet valide email: {}", exception.getMessage(), exception);
        }
    }

    /**
     * Core method to send email using JavaMailSender (Gmail SMTP)
     */
    private void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);
        } catch (Exception ex) {
            log.error("Error sending email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new ApiException("Failed to send email");
        }
    }
}
