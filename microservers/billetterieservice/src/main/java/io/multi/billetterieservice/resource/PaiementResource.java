package io.multi.billetterieservice.resource;

import io.multi.billetterieservice.domain.Commande;
import io.multi.billetterieservice.domain.Response;
import io.multi.billetterieservice.service.CommandeService;
import io.multi.billetterieservice.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static io.multi.billetterieservice.utils.RequestUtils.getResponse;
import static org.springframework.http.HttpStatus.OK;

/**
 * Retours de paiement en ligne.
 *
 * <p>Deux chemins mènent à la même décision, et c'est voulu : le prestataire
 * notifie le serveur, et le client revient sur le site. Le premier des deux
 * qui arrive confirme la commande, l'autre ne fait rien, la confirmation étant
 * idempotente. Cette redondance évite qu'une notification perdue laisse une
 * commande payée mais jamais confirmée.
 */
@RestController
@RequestMapping("/billetterie/paiements")
@RequiredArgsConstructor
@Slf4j
public class PaiementResource {

    private final CommandeService commandeService;
    private final JwtUtils jwtUtils;

    /**
     * Notification du prestataire. Public par nécessité : l'appelant est une
     * machine tierce, sans jeton. La sécurité ne repose donc pas sur cet appel
     * mais sur la vérification auprès du prestataire, déclenchée derrière.
     *
     * <p>Répond toujours 200, même en cas d'erreur interne : un prestataire qui
     * reçoit une erreur réessaie en boucle, parfois des heures durant. Le
     * rattrapage se fait par la vérification périodique, pas par ses relances.
     */
    @PostMapping("/notification")
    public ResponseEntity<Response> notification(
            @RequestParam(value = "cpm_trans_id", required = false) String referenceParam,
            @RequestBody(required = false) Map<String, Object> corps,
            HttpServletRequest request) {

        String reference = referenceParam != null ? referenceParam : extraireReference(corps);
        if (reference == null || reference.isBlank()) {
            log.warn("Notification de paiement sans référence exploitable");
            return ResponseEntity.ok(getResponse(request, Map.of(), "Référence absente", OK));
        }

        log.info("Notification de paiement reçue pour {}", reference);
        try {
            commandeService.confirmerPaiement(reference);
        } catch (Exception e) {
            log.error("Traitement de la notification {} en échec : {}", reference, e.getMessage());
        }
        return ResponseEntity.ok(getResponse(request, Map.of(), "Notification prise en compte", OK));
    }

    /**
     * Consulté par le client après son retour du prestataire, et pendant
     * l'attente. Déclenche la même vérification que la notification, ce qui
     * permet de confirmer une commande même si la notification n'est jamais
     * arrivée.
     */
    @GetMapping("/{reference}/etat")
    public ResponseEntity<Response> etat(@PathVariable("reference") String reference,
                                         @AuthenticationPrincipal Jwt jwt,
                                         HttpServletRequest request) {
        Long userId = jwtUtils.extractUserId(jwt);
        Commande commande = commandeService.etatPaiement(reference, userId);
        return ResponseEntity.ok(getResponse(request, Map.of("commande", commande),
                "État du paiement récupéré", OK));
    }

    /**
     * Les prestataires n'ont pas tous le même nom de champ pour la référence, ni
     * la même référence : Chap Chap Pay ne renvoie que son identifiant
     * d'opération, jamais le nôtre. La recherche de commande accepte les deux.
     */
    private static String extraireReference(Map<String, Object> corps) {
        if (corps == null) return null;
        for (String cle : new String[]{"cpm_trans_id", "transaction_id", "operation_id",
                                       "reference", "merchant_transaction_id", "order_id"}) {
            Object valeur = corps.get(cle);
            if (valeur != null && !String.valueOf(valeur).isBlank()) return String.valueOf(valeur);
        }
        return null;
    }
}
