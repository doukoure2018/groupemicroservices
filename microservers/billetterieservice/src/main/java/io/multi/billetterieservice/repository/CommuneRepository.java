package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Commune;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des communes.
 */
public interface CommuneRepository {

    Commune save(Commune commune);

    Optional<Commune> update(String communeUuid, String libelle, Long villeId);

    Optional<Commune> updateStatus(String communeUuid, Boolean actif);

    List<Commune> findAll();

    List<Commune> findAllActive();

    List<Commune> findByVilleUuid(String villeUuid);

    List<Commune> findActiveByVilleUuid(String villeUuid);

    List<Commune> findByRegionUuid(String regionUuid);

    Optional<Commune> findByUuid(String communeUuid);

    boolean existsByLibelleAndVille(String libelle, String villeUuid);

    boolean existsByLibelleAndVilleAndNotUuid(String libelle, String villeUuid, String communeUuid);

    boolean existsByUuid(String communeUuid);

    Optional<Long> findVilleIdByUuid(String villeUuid);

    long countAll();

    long countActive();

    long countByVille(String villeUuid);
}
