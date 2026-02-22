package io.multi.notificationserver.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.notificationserver.model.TokenResponse;
import io.multi.notificationserver.service.SmsService;
import kong.unirest.core.HttpResponse;
import kong.unirest.core.Unirest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OrangeSmsServiceImpl implements SmsService {

    @Value("${orange.api.oauth.url}")
    private String oauthUrl;

    @Value("${orange.api.sms.url}")
    private String smsApiUrl;

    @Value("${orange.api.client.credentials}")
    private String clientCredentials;

    @Value("${orange.api.sender.address}")
    private String senderAddress;

    @Value("${sms.sender.name:YIGUI}")
    private String senderName;

    private final ObjectMapper objectMapper;

    public OrangeSmsServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean sendSms(String phoneNumber, String message) {
        try {
            log.info("Envoi SMS vers: {}", phoneNumber);

            String cleanedNumber = cleanPhoneNumber(phoneNumber);

            TokenResponse tokenResponse = getOAuthToken();
            if (!tokenResponse.isSuccess()) {
                log.error("Impossible d'obtenir le token Orange API");
                return false;
            }

            String requestBody = constructSmsRequestBody(cleanedNumber, senderName, escapeMessage(message));

            HttpResponse<String> response = Unirest.post(smsApiUrl)
                    .header("Authorization", "Bearer " + tokenResponse.getToken())
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .asString();

            if (response.getStatus() == 201) {
                log.info("SMS envoye avec succes a: {}", cleanedNumber);
                return true;
            } else {
                log.warn("Echec envoi SMS. Status: {}, Response: {}", response.getStatus(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("Erreur envoi SMS a {}: {}", phoneNumber, e.getMessage());
            return false;
        }
    }

    @Override
    @Async
    public void sendBookingConfirmationSms(String phone, String name, String numeroCommande,
                                            String trajet, String dateDepart, String heureDepart,
                                            String nombrePlaces, String montantPaye, String billetCodes) {
        try {
            String message = "YIGUI - Reservation confirmee!\n"
                    + "Commande: " + numeroCommande + "\n"
                    + "Trajet: " + trajet + "\n"
                    + "Depart: " + dateDepart + " a " + heureDepart + "\n"
                    + "Passagers: " + nombrePlaces + "\n"
                    + "Montant: " + montantPaye + " GNF\n"
                    + "Billet(s): " + billetCodes + "\n"
                    + "Presentez votre code au chauffeur.";

            boolean sent = sendSms(phone, message);
            if (sent) {
                log.info("SMS de confirmation envoye a {} pour commande {}", phone, numeroCommande);
            } else {
                log.warn("Echec envoi SMS de confirmation a {} pour commande {}", phone, numeroCommande);
            }
        } catch (Exception e) {
            log.error("Erreur envoi SMS de confirmation: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendBookingCancellationSms(String phone, String name, String numeroCommande,
                                            String trajet, String dateDepart, String montantPaye) {
        try {
            String message = "YIGUI - Commande annulee\n"
                    + "Commande: " + numeroCommande + "\n"
                    + "Trajet: " + trajet + "\n"
                    + "Date: " + dateDepart + "\n"
                    + "Montant: " + montantPaye + " GNF\n"
                    + "Contactez-nous pour tout remboursement.";

            boolean sent = sendSms(phone, message);
            if (sent) {
                log.info("SMS d'annulation envoye a {} pour commande {}", phone, numeroCommande);
            } else {
                log.warn("Echec envoi SMS d'annulation a {} pour commande {}", phone, numeroCommande);
            }
        } catch (Exception e) {
            log.error("Erreur envoi SMS d'annulation: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDepartureReminderSms(String phone, String name, String trajet, String dateDepart, String heureDepart, String pointRendezVous) {
        try {
            String message = "YIGUI - Rappel depart!\n"
                    + "Trajet: " + trajet + "\n"
                    + "Depart: " + dateDepart + " a " + heureDepart + "\n"
                    + (pointRendezVous != null && !pointRendezVous.isBlank() ? "RDV: " + pointRendezVous + "\n" : "")
                    + "Presentez votre code billet au chauffeur.";

            boolean sent = sendSms(phone, message);
            if (sent) {
                log.info("SMS de rappel depart envoye a {} pour trajet {}", phone, trajet);
            } else {
                log.warn("Echec envoi SMS de rappel depart a {} pour trajet {}", phone, trajet);
            }
        } catch (Exception e) {
            log.error("Erreur envoi SMS de rappel depart: {}", e.getMessage());
        }
    }

    private TokenResponse getOAuthToken() {
        try {
            HttpResponse<String> response = Unirest.post(oauthUrl)
                    .header("Authorization", clientCredentials)
                    .header("Accept", "application/json")
                    .field("grant_type", "client_credentials")
                    .asString();

            if (response.getStatus() == 200) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                String tokenValue = jsonNode.get("access_token").asText();
                Long expiresIn = jsonNode.has("expires_in") ? jsonNode.get("expires_in").asLong() : null;

                return TokenResponse.builder()
                        .token(tokenValue)
                        .status(200L)
                        .expiresIn(expiresIn)
                        .tokenType("Bearer")
                        .issuedAt(LocalDateTime.now())
                        .expiresAt(expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null)
                        .build();
            } else {
                log.error("Echec token Orange API. Status: {}", response.getStatus());
                return TokenResponse.builder().status((long) response.getStatus()).build();
            }
        } catch (Exception e) {
            log.error("Erreur token Orange API: {}", e.getMessage());
            return TokenResponse.builder().status(0L).build();
        }
    }

    private String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        String cleaned = phoneNumber.replaceAll("[^\\d+]", "");

        if (cleaned.startsWith("+224") && cleaned.length() == 13) {
            return cleaned;
        }
        if (cleaned.startsWith("224") && cleaned.length() == 12) {
            return "+" + cleaned;
        }
        if (cleaned.length() == 9 && (cleaned.startsWith("6") || cleaned.startsWith("7"))) {
            return "+224" + cleaned;
        }

        return cleaned;
    }

    private String escapeMessage(String message) {
        if (message == null) return "";
        return message.replace("\"", "\\\"");
    }

    private String constructSmsRequestBody(String recipient, String senderName, String message) {
        try {
            String cleanedSenderAddress = senderAddress.startsWith("tel:") ? senderAddress : "tel:" + senderAddress;

            Map<String, Object> outboundSmsMessageRequest = new HashMap<>();
            outboundSmsMessageRequest.put("address", List.of("tel:" + recipient));
            outboundSmsMessageRequest.put("senderAddress", cleanedSenderAddress);
            outboundSmsMessageRequest.put("senderName", senderName);

            Map<String, String> outboundSmsTextMessage = new HashMap<>();
            outboundSmsTextMessage.put("message", message);
            outboundSmsMessageRequest.put("outboundSMSTextMessage", outboundSmsTextMessage);

            Map<String, Object> finalRequestBody = new HashMap<>();
            finalRequestBody.put("outboundSMSMessageRequest", outboundSmsMessageRequest);

            return objectMapper.writeValueAsString(finalRequestBody);
        } catch (Exception e) {
            log.error("Erreur construction body SMS: {}", e.getMessage());
            throw new RuntimeException("Error constructing SMS request body", e);
        }
    }
}
