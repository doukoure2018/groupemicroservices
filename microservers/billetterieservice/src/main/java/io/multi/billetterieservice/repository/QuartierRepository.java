package io.multi.billetterieservice.repository;
import io.multi.billetterieservice.domain.Quartier;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des quartiers.
 */
public interface QuartierRepository {

    Quartier save(Quartier quartier);

    Optional<Quartier> update(String quartierUuid, String libelle, Long communeId);

    Optional<Quartier> updateStatus(String quartierUuid, Boolean actif);

    List<Quartier> findAll();

    List<Quartier> findAllActive();

    List<Quartier> findByCommuneUuid(String communeUuid);

    List<Quartier> findActiveByCommuneUuid(String communeUuid);

    List<Quartier> findByVilleUuid(String villeUuid);

    List<Quartier> findByRegionUuid(String regionUuid);

    Optional<Quartier> findByUuid(String quartierUuid);

    boolean existsByLibelleAndCommune(String libelle, String communeUuid);

    boolean existsByLibelleAndCommuneAndNotUuid(String libelle, String communeUuid, String quartierUuid);

    boolean existsByUuid(String quartierUuid);

    Optional<Long> findCommuneIdByUuid(String communeUuid);

    long countAll();

    long countActive();

    long countByCommune(String communeUuid);
}

