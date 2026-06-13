package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.LeadVisiteAdminView;
import io.multi.immobilierservice.dto.VisiteCreateRequest;

import java.util.List;

public interface VisiteService {

    /**
     * Demande une visite. La contrainte BD {@code uq_immo_visite_active} empêche
     * qu'un même user ait deux visites actives (DEMANDEE/CONFIRMEE) sur le même
     * bien — anti-spam vendeur.
     */
    Visite demander(String proprieteUuid, VisiteCreateRequest req, Long visiteurUserId);

    List<Visite> findMesVisitesVisiteur(Long userId, int limit, int offset);
    long countMesVisitesVisiteur(Long userId);

    List<Visite> findVisitesSurMesAnnonces(Long vendeurUserId, int limit, int offset);
    long countVisitesSurMesAnnonces(Long vendeurUserId);

    /** Vendeur : DEMANDEE → CONFIRMEE. */
    Visite confirmer(String visiteUuid, Long vendeurUserId);

    /** Vendeur : CONFIRMEE → EFFECTUEE. */
    Visite effectuer(String visiteUuid, Long vendeurUserId, String notesVendeur);

    /** Visiteur OU vendeur : * → ANNULEE. */
    Visite annuler(String visiteUuid, Long requesterUserId, String motif);

    // ── Intermédiation Phase 1 : leads visite back-office ──

    /** Back-office : leads visite par statut (défaut NOUVEAU), enrichis réf/titre propriété. */
    List<LeadVisiteAdminView> findLeadsForAdmin(String statut, int limit, int offset);

    long countLeadsForAdmin(String statut);

    /**
     * Back-office : traite un lead visite (TRAITE|REJETE). 404 si introuvable ;
     * refusé (400) si déjà traité (n'écrase pas traite_par/traite_at).
     */
    Visite traiterLead(String visiteUuid, String action, String noteAdmin, Long adminUserId);
}
