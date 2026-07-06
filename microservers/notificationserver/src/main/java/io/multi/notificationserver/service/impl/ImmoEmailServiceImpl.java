package io.multi.notificationserver.service.impl;

import io.multi.notificationserver.event.immo.ImmoEventType;
import io.multi.notificationserver.exception.ApiException;
import io.multi.notificationserver.service.ImmoEmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImmoEmailServiceImpl implements ImmoEmailService {

    private final TemplateEngine templateEngine;
    private final JavaMailSender mailSender;

    @Value("${mail.from.email}")
    private String fromEmail;

    @Value("${mail.from.name}")
    private String fromName;

    /**
     * Flag dev/prod : si false, on log et on ne tente pas d'envoyer.
     * Phase 11a/b : false en dev → pas de mails parasites pendant l'itération.
     * Phase 11c : passer à true pour valider le bout-en-bout Gmail SMTP avec mail réel.
     */
    @Value("${immo.email.send-enabled:false}")
    private boolean sendEnabled;

    /** URL absolue du frontend (utilisée par les templates pour générer les liens CTA). */
    @Value("${immo.email.ui-url:http://localhost:4202}")
    private String uiUrl;

    @Override
    public void handle(ImmoEventType type, Map<String, Object> data) {
        try {
            String html = renderPreview(type, data);
            String to = (String) data.get(destinataireKey(type));
            if (to == null || to.isBlank()) {
                log.warn("ImmoEmail {} skip : destinataire absent dans data (clé={})",
                        type, destinataireKey(type));
                return;
            }
            String subject = subjectFor(type, data);
            if (!sendEnabled) {
                log.info("[STUB DEV] Email immo NON envoyé (immo.email.send-enabled=false) : "
                        + "type={} to={} subject={}", type, to, subject);
                return;
            }
            sendEmail(to, subject, html);
            log.info("Email immo envoyé : type={} to={}", type, to);
        } catch (Exception e) {
            // Erreur de rendu Thymeleaf (variable manquante) OU envoi SMTP : on log,
            // on ne propage pas — le consumer Kafka enchaîne sur le message suivant.
            log.error("Échec envoi email immo type={} : {}", type, e.getMessage(), e);
        }
    }

    @Override
    public String renderPreview(ImmoEventType type, Map<String, Object> data) {
        Context ctx = new Context();
        data.forEach(ctx::setVariable);
        // uiUrl injecté systématiquement pour les liens CTA dans tous les templates.
        ctx.setVariable("uiUrl", uiUrl);
        return templateEngine.process(templateFor(type), ctx);
    }

    private String templateFor(ImmoEventType type) {
        return switch (type) {
            case IMMO_CONTACT_RECU       -> "email/immo/contact-recu";
            case IMMO_VISITE_DEMANDEE    -> "email/immo/visite-demandee";
            case IMMO_VISITE_CONFIRMEE   -> "email/immo/visite-confirmee";
            case IMMO_ANNONCE_VALIDEE    -> "email/immo/annonce-validee";
            case IMMO_ANNONCE_REJETEE    -> "email/immo/annonce-rejetee";
            case IMMO_RAPPEL_EXPIRATION  -> "email/immo/rappel-expiration";
            case IMMO_SIGNALEMENT_SEUIL  -> "email/immo/signalement-seuil";
            case IMMO_AGENCE_APPROUVEE   -> "email/immo/agence-approuvee";
            case IMMO_AGENCE_REJETEE     -> "email/immo/agence-rejetee";
            case IMMO_DEMANDE_BESOIN     -> "email/immo/demande-besoin";
        };
    }

    /** Quelle clé du payload contient l'email destinataire ? Varie selon l'event. */
    private String destinataireKey(ImmoEventType type) {
        return switch (type) {
            // Intermédiation Phase 1 : les leads contact/visite vont au back-office, PAS au vendeur.
            case IMMO_CONTACT_RECU,
                 IMMO_VISITE_DEMANDEE     -> "backofficeEmail";
            case IMMO_ANNONCE_VALIDEE,
                 IMMO_ANNONCE_REJETEE,
                 IMMO_RAPPEL_EXPIRATION  -> "vendeurEmail";      // destinataire = propriétaire / vendeur
            case IMMO_VISITE_CONFIRMEE   -> "visiteurEmail";
            case IMMO_SIGNALEMENT_SEUIL  -> "adminEmail";
            case IMMO_AGENCE_APPROUVEE,
                 IMMO_AGENCE_REJETEE,
                 IMMO_DEMANDE_BESOIN     -> "agenceEmail";
        };
    }

    private String subjectFor(ImmoEventType type, Map<String, Object> data) {
        String ref = (String) data.getOrDefault("proprieteReference", "");
        return switch (type) {
            case IMMO_CONTACT_RECU       -> "[Lead] Nouveau contact — " + ref;
            case IMMO_VISITE_DEMANDEE    -> "[Lead] Demande de visite — " + ref;
            case IMMO_VISITE_CONFIRMEE   -> "Votre visite est confirmée — " + ref;
            case IMMO_ANNONCE_VALIDEE    -> "Votre annonce " + ref + " est publiée";
            case IMMO_ANNONCE_REJETEE    -> "Votre annonce " + ref + " a été refusée";
            case IMMO_RAPPEL_EXPIRATION  -> "Votre annonce " + ref + " expire bientôt";
            case IMMO_SIGNALEMENT_SEUIL  -> "[Modération] Annonce " + ref + " : seuil de signalements atteint";
            case IMMO_AGENCE_APPROUVEE   -> "Votre agence " + data.getOrDefault("agenceNom", "") + " est validée ✓";
            case IMMO_AGENCE_REJETEE     -> "Votre dossier agence " + data.getOrDefault("agenceNom", "") + " a été refusé";
            case IMMO_DEMANDE_BESOIN     -> "[Demande client] " + data.getOrDefault("typeBienLibelle", "Bien")
                    + " — " + data.getOrDefault("communeLibelle", "") + " (" + data.getOrDefault("reference", "") + ")";
        };
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new ApiException("Failed to send email: " + ex.getMessage());
        }
    }
}
