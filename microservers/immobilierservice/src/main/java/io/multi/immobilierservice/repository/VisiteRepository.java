package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.LeadVisiteAdminView;

import java.util.List;
import java.util.Optional;

public interface VisiteRepository {

    Visite save(Visite visite);

    Optional<Visite> findByUuid(String visiteUuid);

    List<Visite> findByVisiteur(Long visiteurUserId, int limit, int offset);
    long countByVisiteur(Long visiteurUserId);

    List<Visite> findByVendeur(Long vendeurUserId, int limit, int offset);
    long countByVendeur(Long vendeurUserId);

    Optional<Visite> confirmer(String visiteUuid);
    Optional<Visite> effectuer(String visiteUuid, String notesVendeur);
    Optional<Visite> annuler(String visiteUuid, String motif);

    /** Owner du bien (pour autoriser les actions vendeur). */
    Optional<Long> findOwnerUserId(String visiteUuid);

    // ── Intermédiation Phase 1 : leads visite back-office ──

    List<LeadVisiteAdminView> findLeadsForAdmin(String statut, int limit, int offset);

    long countLeadsForAdmin(String statut);

    /** Mark-traité conditionnel (seulement si NOUVEAU). Empty si déjà traité. */
    Optional<Visite> traiterLead(String visiteUuid, String leadStatut, Long adminUserId, String noteAdmin);
}
