package io.multi.immobilierservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * <b>Auth obligatoire</b> sur l'endpoint POST /immo/proprietes/{uuid}/contact.
 *
 * <p>Décision (Phase 10a) : JWT requis, pas d'accès anonyme. Sans cela,
 * un bot peut bombarder 24/7 n'importe quel vendeur, transformant la
 * plateforme en passerelle de spam. Le rate-limit IP + captcha qui
 * permettraient l'anonyme sont hors scope pour l'instant.
 *
 * <p>Conséquence : <b>aucun champ téléphone/email/nom</b> dans ce DTO.
 * Le service les déduit du JWT via {@code UserClient.getUserById()} —
 * pas de spoofing possible.
 */
@Data
public class ContactCreateRequest {

    @NotBlank
    @Size(max = 2000)
    private String message;

    @Pattern(regexp = "INFO|VISITE|OFFRE",
            message = "typeDemande doit être INFO, VISITE ou OFFRE")
    private String typeDemande = "INFO";
}
