package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Localisation;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des localisations.
 */
public interface LocalisationRepository {

    Localisation save(Localisation localisation);

    Optional<Localisation> update(String localisationUuid, Long quartierId, String adresseComplete,
                                  BigDecimal latitude, BigDecimal longitude, String description);

    boolean delete(String localisationUuid);

    List<Localisation> findAll();

    List<Localisation> findAllWithQuartier();

    List<Localisation> findAllWithoutQuartier();

    List<Localisation> findByQuartierUuid(String quartierUuid);

    List<Localisation> findByCommuneUuid(String communeUuid);

    List<Localisation> findByVilleUuid(String villeUuid);

    List<Localisation> findByRegionUuid(String regionUuid);

    Optional<Localisation> findByUuid(String localisationUuid);

    List<Localisation> searchByAddress(String searchTerm);

    boolean existsByUuid(String localisationUuid);

    boolean existsByAdresse(String adresseComplete);

    boolean existsByAdresseAndNotUuid(String adresseComplete, String localisationUuid);

    Optional<Long> findQuartierIdByUuid(String quartierUuid);

    long countAll();

    long countWithQuartier();

    long countWithoutQuartier();

    long countWithCoordinates();

    long countByQuartier(String quartierUuid);
}