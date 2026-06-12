package io.multi.notificationserver.service.impl;

import io.multi.notificationserver.event.immo.ImmoEventType;
import io.multi.notificationserver.service.ImmoSmsService;
import io.multi.notificationserver.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class ImmoSmsServiceImpl implements ImmoSmsService {

    /** Events ayant droit au canal payant SMS. Le reste = email-only.
     *  Intermédiation Phase 1 : CONTACT_RECU + VISITE_DEMANDEE → SMS back-office. */
    private static final Set<ImmoEventType> SMS_ELIGIBLE = Set.of(
            ImmoEventType.IMMO_CONTACT_RECU,
            ImmoEventType.IMMO_VISITE_DEMANDEE,
            ImmoEventType.IMMO_VISITE_CONFIRMEE
    );

    private final SmsService smsService;

    /**
     * Flag dev/prod. False par défaut en dev → STUB log + skip envoi réel.
     * True en prod (config) ou via CLI override pour tester un envoi réel.
     */
    @Value("${immo.sms.send-enabled:false}")
    private boolean sendEnabled;

    @Override
    public void handle(ImmoEventType type, Map<String, Object> data) {
        if (!SMS_ELIGIBLE.contains(type)) {
            // Event non éligible (CONTACT_RECU et VISITE_CONFIRMEE seulement).
            return;
        }

        boolean smsEnabled = Boolean.TRUE.equals(data.get("smsEnabled"));
        if (!smsEnabled) {
            log.info("SMS skip {} : désactivé par préférence user (smsEnabled=false dans payload)", type);
            return;
        }

        String phone = (String) data.get(phoneKey(type));
        if (phone == null || phone.isBlank()) {
            log.info("SMS skip {} : phone absent dans payload (clé={})", type, phoneKey(type));
            return;
        }

        String message = buildMessage(type, data);
        // Filet de sécurité — devrait être no-op pour les messages 12b (rédigés courts).
        String safe = SmsService.truncate160(message);
        if (safe.length() < message.length()) {
            log.warn("SMS {} TRONQUÉ de {} à 160 chars — raccourcir la rédaction du template",
                    type, message.length());
        }

        if (!sendEnabled) {
            log.info("[STUB DEV] SMS NON envoyé (immo.sms.send-enabled=false) : "
                    + "type={} to={} chars={} preview=\"{}\"",
                    type, phone, safe.length(), safe);
            return;
        }
        boolean sent = smsService.sendSms(phone, safe);
        if (sent) {
            log.info("SMS immo envoyé : type={} to={}", type, phone);
        } else {
            log.warn("SMS immo échec envoi : type={} to={}", type, phone);
        }
    }

    /** Quelle clé du payload contient le téléphone destinataire ? Varie selon l'event. */
    private String phoneKey(ImmoEventType type) {
        return switch (type) {
            // Intermédiation Phase 1 : leads contact/visite → téléphone back-office.
            case IMMO_CONTACT_RECU,
                 IMMO_VISITE_DEMANDEE   -> "backofficeTelephone";
            case IMMO_VISITE_CONFIRMEE  -> "visiteurTelephone";
            default -> throw new IllegalStateException("Pas de phoneKey pour " + type);
        };
    }

    /** Messages SMS courts (< 160 chars en pratique, troncature en filet). */
    private String buildMessage(ImmoEventType type, Map<String, Object> data) {
        String ref = (String) data.getOrDefault("proprieteReference", "");
        return switch (type) {
            case IMMO_CONTACT_RECU -> "YIGUI Immo - Nouveau lead CONTACT sur " + ref
                    + ". Details par email.";
            case IMMO_VISITE_DEMANDEE -> {
                String date = (String) data.getOrDefault("dateVisite", "");
                yield "YIGUI Immo - Lead VISITE sur " + ref
                        + (date.isBlank() ? "" : " (" + date + ")") + ". Details par email.";
            }
            case IMMO_VISITE_CONFIRMEE -> {
                String date = (String) data.getOrDefault("dateVisite", "");
                String heure = (String) data.getOrDefault("heureVisite", "");
                String vendeurTel = (String) data.getOrDefault("vendeurTelephone", "");
                yield "YIGUI Immo - Visite " + ref + " confirmee le " + date
                        + (heure.isBlank() ? "" : " a " + heure)
                        + (vendeurTel.isBlank() ? "." : ". Vendeur: " + vendeurTel + ".");
            }
            default -> throw new IllegalStateException("Pas de message pour " + type);
        };
    }
}
