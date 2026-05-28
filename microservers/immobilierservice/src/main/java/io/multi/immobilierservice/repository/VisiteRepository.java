package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Visite;

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
}
