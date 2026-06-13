package io.multi.immobilierservice.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Demande de contact entrante sur une propriété.
 *
 * <p>Note conception : les champs {@code nomDemandeur}, {@code telephoneDemandeur},
 * {@code emailDemandeur} sont des <b>snapshots</b> au moment de l'INSERT — figés
 * pour audit/conformité. L'affichage côté vendeur ({@code GET /mes-contacts-recus})
 * re-fetch les infos live via {@code UserClient.getUserById()} pour avoir le
 * numéro à jour si l'acheteur a changé ses coordonnées entre temps. Fallback
 * sur le snapshot si UserClient indisponible (cf. {@code ContactServiceImpl}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    private Long contactId;
    private String contactUuid;
    private Long proprieteId;
    private Long demandeurUserId;
    private String nomDemandeur;          // snapshot
    private String telephoneDemandeur;    // snapshot
    private String emailDemandeur;        // snapshot
    private String message;
    private String typeDemande;           // INFO | VISITE | OFFRE
    private String statut;                // NOUVEAU | TRAITE | CLOS
    private Boolean vuParVendeur;
    private OffsetDateTime createdAt;

    // Audit-log lead back-office (V27) — intermédiation Phase 1.
    private String leadStatut;            // NOUVEAU | TRAITE | REJETE
    private String noteAdmin;
    private Long traitePar;               // user_id admin back-office (nullable)
    private OffsetDateTime traiteAt;
}
