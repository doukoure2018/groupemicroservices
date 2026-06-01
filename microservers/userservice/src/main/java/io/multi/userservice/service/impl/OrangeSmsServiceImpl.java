package io.multi.userservice.service.impl;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.userservice.model.TokenResponse;
import io.multi.userservice.service.OrangeSmsService;
import kong.unirest.core.HttpResponse;
import kong.unirest.core.Unirest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OrangeSmsServiceImpl implements OrangeSmsService {

    @Value("${orange.api.oauth.url}")
    private String oauthUrl;

    @Value("${orange.api.sms.url}")
    private String smsApiUrl;

    @Value("${orange.api.client.credentials}")
    private String clientCredentials;

    @Value("${orange.api.sender.address}")
    private String senderAddress;

    @Value("${orange.api.sms.balance.url}")
    private String smsBalanceUrl;

    private final ObjectMapper objectMapper;

    // Constructor injection for ObjectMapper for better testability
    public OrangeSmsServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public int getSmsBalance(String token) {
        try {
            log.info("💰 Retrieving SMS balance from Orange API...");

            HttpResponse<String> response = Unirest.get(smsBalanceUrl)
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .asString();

            if (response.getStatus() == 200) {
                log.info("✅ Retrieved SMS balance successfully");
                int balance = extractAvailableUnits(response.getBody());
                log.info("💰 Current SMS balance: {} units", balance);
                return balance;
            } else {
                log.warn("⚠️ Failed to retrieve SMS balance. Status: {}, Response: {}",
                        response.getStatus(), response.getBody());
                return -1;
            }
        } catch (Exception e) {
            log.error("❌ Error retrieving SMS balance: {}", e.getMessage(), e);
            throw new RuntimeException("Error retrieving SMS balance", e);
        }
    }

    private int extractAvailableUnits(String responseBody) throws IOException {
        JsonNode jsonNode = objectMapper.readTree(responseBody);

        if (jsonNode.isArray() && jsonNode.size() > 0) {
            JsonNode firstContract = jsonNode.get(0);
            if (firstContract.has("availableUnits")) {
                return firstContract.get("availableUnits").asInt();
            } else {
                throw new IllegalArgumentException("No 'availableUnits' field found in response");
            }
        } else {
            throw new IllegalArgumentException("Invalid response format or empty array");
        }
    }

    @Override
    public TokenResponse getOAuthToken() {
        try {
            log.info("🔑 Requesting OAuth token from Orange API...");

            HttpResponse<String> response = Unirest.post(oauthUrl)
                    .header("Authorization", clientCredentials)
                    .header("Accept", "application/json")
                    .field("grant_type", "client_credentials")
                    .asString();

            if (response.getStatus() == 200) {
                String tokenValue = extractToken(response.getBody());
                Long expiresIn = null;

                // Essayer d'extraire expires_in
                try {
                    JsonNode jsonNode = objectMapper.readTree(response.getBody());
                    if (jsonNode.has("expires_in")) {
                        expiresIn = jsonNode.get("expires_in").asLong();
                    }
                } catch (Exception e) {
                    log.debug("Could not extract expires_in from response");
                }

                log.info("✅ OAuth token obtained successfully");

                // Utiliser le Builder pour créer TokenResponse
                return TokenResponse.builder()
                        .token(tokenValue)
                        .status(200L)  // Toujours définir le status
                        .expiresIn(expiresIn)
                        .tokenType("Bearer")
                        .issuedAt(LocalDateTime.now())
                        .expiresAt(expiresIn != null ? LocalDateTime.now().plusSeconds(expiresIn) : null)
                        .build();

            } else {
                log.error("❌ Failed to get OAuth token. Status: {}, Response: {}",
                        response.getStatus(), response.getBody());

                // Même en cas d'échec, retourner un TokenResponse avec le status d'erreur
                return TokenResponse.builder()
                        .status((long) response.getStatus())
                        .build();
            }
        } catch (Exception e) {
            log.error("❌ Error getting OAuth token from Orange API: {}", e.getMessage(), e);

            // En cas d'exception, retourner un TokenResponse avec status 0
            return TokenResponse.builder()
                    .status(0L)
                    .build();
        }
    }

    // Ajouter cette méthode dans TokenResponse.java


    private String extractToken(String responseBody) throws IOException {
        JsonNode jsonNode = objectMapper.readTree(responseBody);

        if (jsonNode.has("access_token")) {
            return jsonNode.get("access_token").asText();
        } else {
            throw new IllegalArgumentException("No 'access_token' field found in response");
        }
    }

    @Override
    public void sendSms(String token, String recipient, String senderName, String message) {
        try {
            log.info("📱 Starting SMS send process...");
            log.info("📞 Original recipient: '{}'", recipient);

            // ✅ NETTOYER le numéro pour éviter le double +224
            String cleanedRecipient = cleanPhoneNumber(recipient);
            log.info("🔧 Cleaned recipient: '{}'", cleanedRecipient);

            String escapedMessage = escapeMessage(message);
            log.info("💬 Message prepared (length: {})", message.length());

            // Construire le body avec le numéro nettoyé
            String requestBody = constructSmsRequestBody(cleanedRecipient, senderName, escapedMessage);
            log.debug("📤 SMS request body: {}", requestBody);

            HttpResponse<String> response = Unirest.post(smsApiUrl)
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .asString();

            if (response.getStatus() == 201) {
                log.info("✅ SMS sent successfully to: {}", cleanedRecipient);
            } else {
                log.warn("⚠️ Failed to send SMS. Status: {}, Response: {}",
                        response.getStatus(), response.getBody());
                throw new RuntimeException("SMS sending failed with status: " + response.getStatus());
            }
        } catch (Exception e) {
            log.error("❌ Error sending SMS to {}: {}", recipient, e.getMessage(), e);
            throw new RuntimeException("Error sending SMS", e);
        }
    }

    /**
     * Nettoie le numéro de téléphone pour éviter le double préfixe +224
     */
    private String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number cannot be empty");
        }

        log.debug("🔧 Cleaning phone number: '{}'", phoneNumber);

        // Nettoyer (enlever espaces, tirets, etc.)
        String cleaned = phoneNumber.replaceAll("[^\\d+]", "");

        // Cas 1: Déjà au format correct +224XXXXXXXXX (13 caractères)
        if (cleaned.startsWith("+224") && cleaned.length() == 13) {
            log.debug("✅ Phone number already in correct format: '{}'", cleaned);
            return cleaned;
        }

        // Cas 2: Format 224XXXXXXXXX (12 caractères) - ajouter le +
        if (cleaned.startsWith("224") && cleaned.length() == 12) {
            String result = "+" + cleaned;
            log.debug("✅ Added + prefix: '{}' -> '{}'", cleaned, result);
            return result;
        }

        // Cas 3: Format XXXXXXXXX (9 caractères) - ajouter +224
        if (cleaned.length() == 9 && (cleaned.startsWith("6") || cleaned.startsWith("7"))) {
            String result = "+224" + cleaned;
            log.debug("✅ Added +224 prefix: '{}' -> '{}'", cleaned, result);
            return result;
        }

        // Cas d'erreur : format non reconnu
        log.warn("⚠️ Unrecognized phone number format: '{}' (length: {})", phoneNumber, cleaned.length());
        return cleaned; // Retourner tel quel et laisser Orange gérer l'erreur
    }

    private String escapeMessage(String message) {
        if (message == null) return "";
        // Escaping only the double quotes
        return message.replace("\"", "\\\"");
    }

    private String constructSmsRequestBody(String cleanedRecipient, String senderName, String message) {
        try {
            log.debug("🔨 Constructing SMS request body...");
            log.debug("📞 Using recipient: '{}'", cleanedRecipient);
            log.debug("👤 Sender name: '{}'", senderName);
            log.debug("📧 Raw sender address: '{}'", senderAddress);

            // Format senderAddress selon la nature de la valeur :
            //   tel:+224622459305 → laissé tel quel (déjà formaté E.164)
            //   +224622459305    → préfixé en tel:+224622459305
            //   224622459305     → préfixé en tel:224622459305
            //   YIGUI, SIRA...   → Sender ID alphanumérique, envoyé sans préfixe tel:
            String cleanedSenderAddress;
            if (senderAddress.startsWith("tel:")) {
                cleanedSenderAddress = senderAddress;
            } else if (senderAddress.startsWith("+") || senderAddress.matches("^\\d.*")) {
                cleanedSenderAddress = "tel:" + senderAddress;
            } else {
                cleanedSenderAddress = senderAddress;
            }
            log.debug("🔧 Cleaned sender address: '{}'", cleanedSenderAddress);

            // Create the body of the request
            Map<String, Object> outboundSmsMessageRequest = new HashMap<>();

            // ✅ UTILISER le numéro nettoyé tel quel (pas de +224 ajouté)
            outboundSmsMessageRequest.put("address", List.of("tel:" + cleanedRecipient));
            outboundSmsMessageRequest.put("senderAddress", cleanedSenderAddress); // ← LIGNE CORRIGÉE
            outboundSmsMessageRequest.put("senderName", senderName);

            // Create the message part
            Map<String, String> outboundSmsTextMessage = new HashMap<>();
            outboundSmsTextMessage.put("message", message);

            // Combine into a final structure
            outboundSmsMessageRequest.put("outboundSMSTextMessage", outboundSmsTextMessage);

            // Wrap everything into the outer request object
            Map<String, Object> finalRequestBody = new HashMap<>();
            finalRequestBody.put("outboundSMSMessageRequest", outboundSmsMessageRequest);

            // Convert to JSON
            String jsonBody = objectMapper.writeValueAsString(finalRequestBody);
            log.debug("✅ SMS request body constructed successfully");

            return jsonBody;

        } catch (Exception e) {
            log.error("❌ Error constructing SMS request body: {}", e.getMessage(), e);
            throw new RuntimeException("Error constructing SMS request body", e);
        }
    }


    /**
     * Vérifie si le solde SMS est suffisant pour envoyer un message
     */
    public boolean checkSMSBalance() {
        try {
            TokenResponse tokenResponse = getOAuthToken();
            int balance = getSmsBalance(tokenResponse.getToken());

            if (balance > 0) {
                log.info("✅ SMS balance check passed: {} units available", balance);
                return true;
            } else {
                log.warn("⚠️ Insufficient SMS balance: {} units", balance);
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Error checking SMS balance: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Méthode helper pour envoyer un SMS avec gestion complète des erreurs
     */
    public boolean sendSMSWithFullHandling(String phoneNumber, String message) {
        try {
            log.info("📱 Initiating SMS send to: '{}'", phoneNumber);

            // Étape 1: Nettoyer le numéro
            String cleanedNumber = cleanPhoneNumber(phoneNumber);

            // Étape 2: Vérifier le solde
            if (!checkSMSBalance()) {
                log.error("❌ Cannot send SMS - insufficient balance");
                return false;
            }

            // Étape 3: Obtenir le token
            TokenResponse tokenResponse = getOAuthToken();

            // Étape 4: Envoyer le SMS
            sendSms(tokenResponse.getToken(), cleanedNumber, "SecureCanal", message);

            log.info("✅ SMS sent successfully to: {}", cleanedNumber);
            return true;

        } catch (Exception e) {
            log.error("❌ Failed to send SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }
}
