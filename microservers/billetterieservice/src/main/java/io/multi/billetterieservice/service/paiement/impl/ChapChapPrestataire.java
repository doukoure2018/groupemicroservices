package io.multi.billetterieservice.service.paiement.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.service.paiement.DemandePaiement;
import io.multi.billetterieservice.service.paiement.EtatPaiement;
import io.multi.billetterieservice.service.paiement.PrestatairePaiement;
import io.multi.billetterieservice.service.paiement.ResultatInitiation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chap Chap Pay, agrégateur guinéen agréé par la Banque Centrale. Il couvre
 * Orange Money et MTN comme CinetPay, mais aussi Kulu, Soutra Money et Akiba,
 * que les agrégateurs régionaux ignorent.
 *
 * <p>Deux différences avec CinetPay commandent ce code. Le prestataire attribue
 * un identifiant d'opération qui lui est propre et n'accepte que celui-là pour
 * répondre à une interrogation de statut : il faut donc le conserver, c'est le
 * rôle de {@code paiements.reference_prestataire}. Et les appels sont signés en
 * HMAC-SHA256 sur le corps JSON <strong>brut, exactement tel qu'il part sur le
 * réseau</strong> ; re-sérialiser le même objet produirait une autre chaîne et
 * donc une signature refusée. D'où la construction manuelle du corps, envoyé
 * tel quel.
 */
@Component
@Slf4j
public class ChapChapPrestataire implements PrestatairePaiement {

    public static final String CODE = "CHAPCHAP";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${paiement.chapchap.api-key:}")
    private String apiKey;

    @Value("${paiement.chapchap.encryption-password:}")
    private String encryptionPassword;

    @Value("${paiement.chapchap.base-url:https://chapchappay.com/api}")
    private String baseUrl;

    @Value("${paiement.chapchap.modes:}")
    private String modes;

    /** Les frais sont retenus sur l'encaissement ; « add » est refusé pour ce marchand. */
    @Value("${paiement.chapchap.fee-handling:deduct}")
    private String feeHandling;

    @Value("${paiement.chapchap.min-amount:1000}")
    private BigDecimal montantMin;

    @Value("${paiement.chapchap.max-amount:5000000}")
    private BigDecimal montantMax;

    @Override
    public String code() {
        return CODE;
    }

    /**
     * Tant que les clés manquent, ce prestataire ne traite rien : un
     * environnement non configuré garde les règlements hors ligne au lieu de
     * refuser toute commande.
     */
    @Override
    public boolean supporte(String codeModeReglement) {
        if (apiKey == null || apiKey.isBlank() || encryptionPassword == null || encryptionPassword.isBlank()) {
            return false;
        }
        if (codeModeReglement == null || modes == null || modes.isBlank()) {
            return false;
        }
        return Arrays.stream(modes.split(","))
                .map(String::trim)
                .anyMatch(m -> m.equalsIgnoreCase(codeModeReglement));
    }

    /**
     * Le franc guinéen n'a pas de subdivision : on arrondit au supérieur pour ne
     * jamais encaisser moins que le prix affiché. Les bornes du prestataire sont
     * vérifiées ici plutôt qu'au refus de l'appel, pour que le message soit
     * compréhensible.
     */
    @Override
    public BigDecimal normaliserMontant(BigDecimal montant) {
        BigDecimal arrondi = montant.setScale(0, RoundingMode.UP);
        if (arrondi.compareTo(montantMin) < 0) {
            throw new ApiException("Le montant minimum accepté est de " + montantMin.toPlainString() + " GNF.");
        }
        if (arrondi.compareTo(montantMax) > 0) {
            throw new ApiException("Le montant maximum accepté est de " + montantMax.toPlainString() + " GNF.");
        }
        return arrondi;
    }

    @Override
    public ResultatInitiation initier(DemandePaiement demande) {
        exigerConfiguration();

        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("amount", demande.montant().setScale(0, RoundingMode.UNNECESSARY).longValueExact());
        corps.put("order_id", demande.reference());
        corps.put("description", demande.description());
        corps.put("return_url", demande.urlRetour());
        // Un paiement abandonné ramène le client sur la même page que le retour
        // normal : elle sait déjà distinguer encaissé, refusé et toujours en
        // attente, et le fait en interrogeant le prestataire.
        corps.put("cancel_url", demande.urlRetour());
        corps.put("notify_url", demande.urlNotification());
        corps.put("fee_handling", feeHandling);
        corps.put("options", Map.of("auto-redirect", true));

        String json = serialiser(corps);
        Map<?, ?> reponse = appeler(HttpMethod.POST, "/ecommerce/create", json, signer(json), "initiation");

        String url = texte(reponse, "payment_url");
        String operationId = texte(reponse, "operation_id");
        if (url == null || url.isBlank()) {
            throw new ApiException("Chap Chap Pay n'a pas renvoyé d'adresse de paiement.");
        }
        if (operationId == null || operationId.isBlank()) {
            // Sans cet identifiant, plus aucune vérification n'est possible :
            // mieux vaut échouer tout de suite, la transaction étant annulée par
            // le retour en arrière de la transaction appelante.
            throw new ApiException("Chap Chap Pay n'a pas renvoyé d'identifiant d'opération.");
        }
        log.info("Paiement Chap Chap Pay initié, commande {}, opération {}", demande.reference(), operationId);
        return new ResultatInitiation(url, operationId);
    }

    /**
     * Le prestataire n'interroge que par son propre identifiant d'opération.
     * Notre référence ne lui dit rien.
     */
    @Override
    public EtatPaiement verifier(String reference, String referencePrestataire) {
        exigerConfiguration();
        if (referencePrestataire == null || referencePrestataire.isBlank()) {
            throw new ApiException("Aucun identifiant d'opération connu pour la référence " + reference);
        }

        Map<?, ?> reponse = appeler(HttpMethod.GET, "/ecommerce/" + referencePrestataire, null, null, "vérification");

        // Le statut n'est pas une chaîne mais un objet : { code, description,
        // payment_method, operation_start_datetime }. Lire « status » tel quel
        // donnerait la représentation textuelle de la map entière, et tout
        // paiement réussi passerait pour une attente.
        Object brut = reponse.get("status");
        String statut = brut instanceof Map<?, ?> m ? texte(m, "code") : texte(reponse, "status");

        EtatPaiement etat = switch (statut == null ? "" : statut.toLowerCase()) {
            // « completed » est l'alias renvoyé en production pour un succès.
            case "success", "completed", "paid" -> EtatPaiement.REUSSI;
            case "failed", "error", "cancel", "canceled", "cancelled", "expired" -> EtatPaiement.ECHOUE;
            // « new », « created », « pending », « processing » : rien n'est joué.
            default -> EtatPaiement.EN_ATTENTE;
        };
        log.info("Vérification Chap Chap Pay {} : statut brut « {} » interprété {}", referencePrestataire, statut, etat);
        return etat;
    }

    // ---------------------------------------------------------------------

    private void exigerConfiguration() {
        if (apiKey == null || apiKey.isBlank() || encryptionPassword == null || encryptionPassword.isBlank()) {
            throw new ApiException("Le paiement en ligne n'est pas configuré.");
        }
    }

    /** Corps JSON figé : c'est cette chaîne exacte qui est signée puis envoyée. */
    private String serialiser(Map<String, Object> corps) {
        try {
            return mapper.writeValueAsString(corps);
        } catch (Exception e) {
            throw new ApiException("Chap Chap Pay : corps de requête illisible.");
        }
    }

    /** HMAC-SHA256 du corps brut, clé étant le mot de passe de chiffrement, hexadécimal minuscule. */
    private String signer(String donnees) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(encryptionPassword.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(donnees.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(Character.forDigit((b >> 4) & 0xF, 16));
                hex.append(Character.forDigit(b & 0xF, 16));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new ApiException("Chap Chap Pay : échec du calcul de signature.");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<?, ?> appeler(HttpMethod methode, String chemin, String corps, String signature, String operation) {
        try {
            HttpHeaders entete = new HttpHeaders();
            entete.set("CCP-Api-Key", apiKey);
            entete.setAccept(List.of(MediaType.APPLICATION_JSON));
            if (signature != null) {
                entete.set("CCP-HMAC-Signature", signature);
            }
            if (corps != null) {
                entete.setContentType(MediaType.APPLICATION_JSON);
            }

            ResponseEntity<Map> reponse = restTemplate.exchange(
                    baseUrl + chemin, methode, new HttpEntity<>(corps, entete), Map.class);
            Map<?, ?> body = reponse.getBody();
            if (body == null) {
                throw new ApiException("Chap Chap Pay a répondu sans contenu lors de l'" + operation);
            }
            // Certaines réponses enveloppent la charge utile dans « data ».
            Object data = body.get("data");
            return data instanceof Map<?, ?> m ? m : body;
        } catch (RestClientException e) {
            // Ne jamais relayer le message brut au client : il peut contenir la clé.
            log.error("Appel Chap Chap Pay en échec ({}) : {}", operation, e.getMessage());
            throw new ApiException("Le service de paiement est momentanément indisponible. Réessayez.");
        }
    }

    private static String texte(Map<?, ?> source, String cle) {
        if (source == null) return null;
        Object valeur = source.get(cle);
        return valeur == null ? null : String.valueOf(valeur);
    }
}
