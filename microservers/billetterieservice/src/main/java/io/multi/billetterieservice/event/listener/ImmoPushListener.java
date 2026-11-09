package io.multi.billetterieservice.event.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.billetterieservice.event.immo.ImmoEvent;
import io.multi.billetterieservice.event.immo.ImmoNotification;
import io.multi.billetterieservice.service.FcmSender;
import io.multi.billetterieservice.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Ce que le téléphone apprend du logement. Le service immobilier publie ses
 * événements pour le courriel et le SMS ; ici on en tire, pour l'utilisateur
 * visé, une notification in-app, la même liste que celle des voyages, et une
 * notification poussée. Le tap ouvre l'écran utile : la fiche du bien, les
 * demandes, ou mes annonces. Les événements sans destinataire ou que l'on ne
 * sait pas raconter sont ignorés sans bruit.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ImmoPushListener {

    private static final String IMMO_NOTIFICATION_TOPIC = "IMMO_NOTIFICATION_TOPIC";
    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("EEE d MMM", Locale.FRENCH);

    private final InAppNotificationService inAppNotificationService;
    private final FcmSender fcmSender;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = IMMO_NOTIFICATION_TOPIC, groupId = "billetterie-immo-push", containerFactory = "immoKafkaListenerContainerFactory")
    public void handle(ImmoNotification notification) {
        ImmoEvent event = notification == null ? null : notification.getPayload();
        if (event == null || event.getEventType() == null) return;
        Map<String, Object> d = event.getData() == null ? Map.of() : event.getData();
        Long userId = asLong(d.get("destinataireUserId"));
        if (userId == null) {
            log.debug("Événement immo {} sans destinataire : pas de notification", event.getEventType());
            return;
        }
        Texte texte = texte(event.getEventType(), d);
        if (texte == null) return;

        Map<String, String> donnees = new HashMap<>();
        donnees.put("categorie", event.getEventType());
        donnees.put("univers", "loger");
        donnees.put("ecran", texte.ecran);
        for (String cle : new String[]{"proprieteUuid", "visiteUuid", "contactUuid", "demandeUuid"}) {
            Object v = d.get(cle);
            if (v != null && !String.valueOf(v).isBlank()) donnees.put(cle, String.valueOf(v));
        }

        try {
            inAppNotificationService.createNotification(userId, "IN_APP", event.getEventType(), texte.titre, texte.message,
                    false, null, "IMMO", objectMapper.writeValueAsString(donnees));
        } catch (Exception e) {
            log.error("Notification in-app immo {} non écrite pour l'utilisateur {} : {}", event.getEventType(), userId, e.getMessage());
        }
        try {
            fcmSender.sendToUser(userId, event.getEventType(), texte.titre, texte.message, donnees);
        } catch (Exception e) {
            log.warn("Push immo {} non envoyée à l'utilisateur {} : {}", event.getEventType(), userId, e.getMessage());
        }
    }

    private record Texte(String titre, String message, String ecran) {}

    /** Les mots de chaque événement, courts, le bien nommé entre guillemets ; null si l'on ne sait pas le dire. */
    private static Texte texte(String type, Map<String, Object> d) {
        String bien = texte(d.get("proprieteTitre"), "votre bien");
        return switch (type) {
            case "IMMO_VISITE_CONFIRMEE" -> new Texte("Visite confirmée",
                    "Votre visite de « " + bien + " » est confirmée " + quand(d.get("dateVisite"), d.get("heureVisite")) + ".", "demandes");
            case "IMMO_VISITE_DEMANDEE" -> new Texte("Demande de visite",
                    texte(d.get("visiteurNom"), "Un visiteur") + " souhaite visiter « " + bien + " » " + quand(d.get("dateVisite"), d.get("heureVisite")) + ".", "bien");
            case "IMMO_CONTACT_RECU" -> new Texte("Nouveau contact",
                    texte(d.get("visiteurNom"), "Un visiteur") + " s'intéresse à « " + bien + " »" + apercu(d.get("message")) + ".", "bien");
            case "IMMO_ANNONCE_VALIDEE" -> new Texte("Annonce en ligne",
                    "« " + bien + " » est publiée et visible dans la recherche.", "mes-annonces");
            case "IMMO_ANNONCE_REJETEE" -> new Texte("Annonce refusée",
                    "« " + bien + " » n'a pas été publiée" + (d.get("motif") == null || String.valueOf(d.get("motif")).isBlank() ? "" : " : " + d.get("motif")) + ".", "mes-annonces");
            case "IMMO_RAPPEL_EXPIRATION" -> new Texte("Annonce bientôt expirée",
                    "« " + bien + " » expire dans " + texte(d.get("joursRestants"), "quelques") + " jours. Renouvelez-la depuis Mes annonces.", "mes-annonces");
            default -> null;
        };
    }

    private static String texte(Object v, String defaut) {
        return v == null || String.valueOf(v).isBlank() ? defaut : String.valueOf(v);
    }

    private static String apercu(Object message) {
        if (message == null || String.valueOf(message).isBlank()) return "";
        String m = String.valueOf(message).trim();
        return " : « " + (m.length() > 80 ? m.substring(0, 77) + "…" : m) + " »";
    }

    /** « le lun. 10 nov. à 10:00 », ou juste le jour, ou rien si la date est illisible. */
    private static String quand(Object date, Object heure) {
        try {
            String jour = JOUR.format(LocalDate.parse(String.valueOf(date)));
            String h = heure == null ? "" : String.valueOf(heure);
            return "le " + jour + (h.isBlank() ? "" : " à " + (h.length() >= 5 ? h.substring(0, 5) : h));
        } catch (Exception e) {
            return "prochainement";
        }
    }

    private static Long asLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
