package io.multi.immobilierservice.dto;

import io.multi.immobilierservice.domain.Contact;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Représentation enrichie d'un {@link Contact} pour affichage côté vendeur.
 *
 * <p>Pattern <b>snapshot + live</b> :
 * <ul>
 *   <li>Le snapshot ({@code nomSnapshot}, etc.) reflète l'état au moment de
 *       la création du contact — conservé pour audit/traçabilité même si
 *       l'acheteur change ses infos.</li>
 *   <li>Les champs "live" ({@code nomLive}, etc.) sont re-fetchés via
 *       {@code UserClient} au moment du GET pour permettre au vendeur
 *       d'appeler avec les coordonnées actuelles de l'acheteur.</li>
 *   <li>Si UserClient échoue (réseau, service down), les champs live sont
 *       null et le client doit afficher le snapshot.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactView {

    // ---- Identité contact ----
    private Long contactId;
    private String contactUuid;
    private Long proprieteId;
    private Long demandeurUserId;

    // ---- Contenu ----
    private String message;
    private String typeDemande;
    private String statut;
    private Boolean vuParVendeur;
    private OffsetDateTime createdAt;

    // ---- Snapshot (audit) ----
    private String nomSnapshot;
    private String telephoneSnapshot;
    private String emailSnapshot;

    // ---- Live (affichage) — peut être null si UserClient indisponible ----
    private String nomLive;
    private String telephoneLive;
    private String emailLive;

    public static ContactView fromContact(Contact c) {
        return ContactView.builder()
                .contactId(c.getContactId())
                .contactUuid(c.getContactUuid())
                .proprieteId(c.getProprieteId())
                .demandeurUserId(c.getDemandeurUserId())
                .message(c.getMessage())
                .typeDemande(c.getTypeDemande())
                .statut(c.getStatut())
                .vuParVendeur(c.getVuParVendeur())
                .createdAt(c.getCreatedAt())
                .nomSnapshot(c.getNomDemandeur())
                .telephoneSnapshot(c.getTelephoneDemandeur())
                .emailSnapshot(c.getEmailDemandeur())
                .build();
    }
}
