package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.dto.LeadAdminView;

import java.util.List;
import java.util.Optional;

public interface ContactRepository {

    Contact save(Contact contact);

    Optional<Contact> findByUuid(String contactUuid);

    /** Contacts reçus par un vendeur (toutes ses propriétés). */
    List<Contact> findRecusByVendeur(Long vendeurUserId, int limit, int offset);

    long countRecusByVendeur(Long vendeurUserId);

    /** Contacts envoyés par un user (côté acheteur). */
    List<Contact> findEnvoyesByUser(Long userId, int limit, int offset);

    long countEnvoyesByUser(Long userId);

    Optional<Contact> markVu(String contactUuid);

    /** user_id du vendeur (owner) — sert au check d'autorisation pour markVu. */
    Optional<Long> findVendeurUserId(String contactUuid);

    // ── Intermédiation Phase 1 : leads back-office ──

    /** Leads contact par lead_statut (enrichis réf/titre propriété), paginés. */
    List<LeadAdminView> findLeadsForAdmin(String statut, int limit, int offset);

    long countLeadsForAdmin(String statut);

    /** Mark-traité conditionnel (seulement si NOUVEAU). Empty si déjà traité. */
    Optional<Contact> traiterLead(String contactUuid, String leadStatut, Long adminUserId, String noteAdmin);
}
