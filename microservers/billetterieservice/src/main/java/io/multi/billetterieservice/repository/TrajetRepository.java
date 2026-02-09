package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Trajet;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité Trajet.
 */
public interface TrajetRepository {

    // ========== LECTURE ==========

    List<Trajet> findAll();

    List<Trajet> findAllActifs();

    Optional<Trajet> findByUuid(String uuid);

    Optional<Trajet> findById(Long id);

    List<Trajet> findByDepart(Long departId);

    List<Trajet> findByDepartUuid(String departUuid);

    List<Trajet> findByArrivee(Long arriveeId);

    List<Trajet> findByArriveeUuid(String arriveeUuid);

    Optional<Trajet> findByDepartAndArrivee(String departUuid, String arriveeUuid);

    List<Trajet> findByVilleDepart(String villeUuid);

    List<Trajet> findByVilleArrivee(String villeUuid);

    List<Trajet> findByVilles(String villeDepartUuid, String villeArriveeUuid);

    List<Trajet> findByUser(Long userId);

    List<Trajet> searchByLibelle(String searchTerm);

    // ========== VÉRIFICATION ==========

    boolean existsByDepartAndArrivee(String departUuid, String arriveeUuid);

    boolean existsByDepartAndArriveeExcludingUuid(String departUuid, String arriveeUuid, String excludeUuid);

    boolean hasOffres(String uuid);

    // ========== ÉCRITURE ==========

    Trajet save(Trajet trajet);

    Trajet update(Trajet trajet);

    int updateActif(String uuid, boolean actif);

    Trajet updateMontants(String uuid, BigDecimal montantBase, BigDecimal montantBagages);

    int deleteByUuid(String uuid);

    // ========== COMPTAGE ==========

    long count();

    long countActifs();

    long countByDepart(String departUuid);

    long countByArrivee(String arriveeUuid);
}