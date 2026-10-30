package io.multi.billetterieservice.service.paiement.impl;

import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.service.paiement.DemandePaiement;
import io.multi.billetterieservice.service.paiement.EtatPaiement;
import io.multi.billetterieservice.service.paiement.PrestatairePaiement;
import io.multi.billetterieservice.service.paiement.ResultatInitiation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Prestataire CinetPay, qui couvre Orange Money et MTN Mobile Money en Guinée
 * et accepte le franc guinéen, ce que peu d'agrégateurs ouest-africains font.
 *
 * <p>Deux appels suffisent : une initialisation qui renvoie une adresse de
 * paiement, et une vérification qui donne l'état faisant foi.
 *
 * <p>Les noms de champs proviennent de la documentation publique de CinetPay.
 * Celle-ci étant injoignable au moment de l'écriture, ils sont à confirmer dans
 * l'espace marchand avant la première mise en service réelle.
 */
@Component
@Slf4j
public class CinetPayPrestataire implements PrestatairePaiement {

    public static final String CODE = "CINETPAY";

    /** CinetPay refuse tout montant qui n'est pas un multiple de cinq. */
    private static final BigDecimal PAS = new BigDecimal("5");

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String siteId;
    private final String baseUrl;
    private final List<String> modesSupportes;

    public CinetPayPrestataire(
            RestTemplate restTemplate,
            @Value("${paiement.cinetpay.api-key:}") String apiKey,
            @Value("${paiement.cinetpay.site-id:}") String siteId,
            @Value("${paiement.cinetpay.base-url:https://api-checkout.cinetpay.com/v2}") String baseUrl,
            @Value("${paiement.cinetpay.modes:OM,MOMO,CB}") String modes) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.siteId = siteId;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.modesSupportes = Arrays.stream(modes.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (apiKey.isBlank() || siteId.isBlank()) {
            log.warn("CinetPay non configuré (paiement.cinetpay.api-key / site-id vides) : "
                    + "toute tentative de paiement en ligne échouera.");
        }
    }

    @Override
    public String code() {
        return CODE;
    }

    @Override
    public boolean supporte(String codeModeReglement) {
        // Tant que les clés ne sont pas posées, ce prestataire ne revendique
        // aucun mode : les règlements restent traités hors ligne, exactement
        // comme avant l'introduction du paiement. Un environnement non
        // configuré continue donc de fonctionner au lieu de refuser les
        // commandes.
        return estConfigure() && codeModeReglement != null && modesSupportes.contains(codeModeReglement);
    }

    private boolean estConfigure() {
        return !apiKey.isBlank() && !siteId.isBlank();
    }

    @Override
    public BigDecimal normaliserMontant(BigDecimal montant) {
        // Arrondi au multiple de cinq SUPÉRIEUR : mieux vaut encaisser cinq francs
        // de plus que voir la transaction refusée par le prestataire.
        return montant.divide(PAS, 0, RoundingMode.CEILING).multiply(PAS);
    }

    @Override
    public ResultatInitiation initier(DemandePaiement demande) {
        exigerConfiguration();
        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("apikey", apiKey);
        corps.put("site_id", siteId);
        corps.put("transaction_id", demande.reference());
        corps.put("amount", demande.montant().setScale(0, RoundingMode.UNNECESSARY).toPlainString());
        corps.put("currency", demande.devise());
        corps.put("description", demande.description());
        corps.put("notify_url", demande.urlNotification());
        corps.put("return_url", demande.urlRetour());
        corps.put("channels", "ALL");
        corps.put("customer_id", demande.clientEmail());
        corps.put("customer_name", demande.clientNom());
        corps.put("customer_surname", demande.clientPrenom());
        corps.put("customer_email", demande.clientEmail());
        corps.put("customer_phone_number", demande.clientTelephone());

        Map<?, ?> reponse = appeler("/payment", corps, "initiation");
        Map<?, ?> donnees = sousObjet(reponse, "data");
        String url = texte(donnees, "payment_url");
        if (url == null || url.isBlank()) {
            throw new ApiException("CinetPay n'a pas renvoyé d'adresse de paiement : " + texte(reponse, "message"));
        }
        log.info("Paiement CinetPay initié, référence {}", demande.reference());
        return new ResultatInitiation(url, texte(donnees, "payment_token"));
    }

    @Override
    public EtatPaiement verifier(String reference) {
        exigerConfiguration();
        Map<String, Object> corps = new LinkedHashMap<>();
        corps.put("apikey", apiKey);
        corps.put("site_id", siteId);
        corps.put("transaction_id", reference);

        Map<?, ?> reponse = appeler("/payment/check", corps, "vérification");
        String statut = texte(sousObjet(reponse, "data"), "status");
        EtatPaiement etat = switch (statut == null ? "" : statut.toUpperCase()) {
            case "ACCEPTED", "SUCCESS", "COMPLETED" -> EtatPaiement.REUSSI;
            case "REFUSED", "CANCELED", "CANCELLED", "EXPIRED", "FAILED", "INSUFFICIENT_BALANCE" -> EtatPaiement.ECHOUE;
            default -> EtatPaiement.EN_ATTENTE;
        };
        log.info("Vérification CinetPay {} : statut brut « {} » interprété {}", reference, statut, etat);
        return etat;
    }

    // ---- appels et lecture défensive de la réponse ----

    private Map<?, ?> appeler(String chemin, Map<String, Object> corps, String operation) {
        try {
            var entete = new org.springframework.http.HttpHeaders();
            entete.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> reponse = restTemplate.postForEntity(
                    baseUrl + chemin, new org.springframework.http.HttpEntity<>(corps, entete), Map.class);
            Map<?, ?> body = reponse.getBody();
            if (body == null) {
                throw new ApiException("CinetPay a répondu sans contenu lors de l'" + operation);
            }
            return body;
        } catch (RestClientException e) {
            // Ne jamais relayer le message brut au client : il peut contenir la clé d'API.
            log.error("Appel CinetPay en échec ({}) : {}", operation, e.getMessage());
            throw new ApiException("Le service de paiement est momentanément indisponible. Réessayez.");
        }
    }

    private void exigerConfiguration() {
        if (!estConfigure()) {
            throw new ApiException("Le paiement en ligne n'est pas configuré sur cet environnement.");
        }
    }

    private static Map<?, ?> sousObjet(Map<?, ?> source, String cle) {
        Object valeur = source == null ? null : source.get(cle);
        return valeur instanceof Map<?, ?> m ? m : Map.of();
    }

    private static String texte(Map<?, ?> source, String cle) {
        Object valeur = source == null ? null : source.get(cle);
        return valeur == null ? null : String.valueOf(valeur);
    }
}
