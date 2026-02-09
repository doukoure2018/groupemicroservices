package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Localisation;
import io.multi.billetterieservice.mapper.LocalisationRowMapper;
import io.multi.billetterieservice.query.LocalisationQuery;
import io.multi.billetterieservice.repository.LocalisationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository pour la gestion des localisations.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class LocalisationRepositoryImpl implements LocalisationRepository {

    private final JdbcClient jdbcClient;
    private final LocalisationRowMapper localisationRowMapper;

    @Override
    public Localisation save(Localisation localisation) {
        log.debug("Création d'une nouvelle localisation: {}", localisation.getAdresseComplete());

        return jdbcClient.sql(LocalisationQuery.INSERT_LOCALISATION)
                .param("quartierId", localisation.getQuartierId())
                .param("adresseComplete", localisation.getAdresseComplete())
                .param("latitude", localisation.getLatitude())
                .param("longitude", localisation.getLongitude())
                .param("description", localisation.getDescription())
                .query(localisationRowMapper)
                .single();
    }

    @Override
    public Optional<Localisation> update(String localisationUuid, Long quartierId, String adresseComplete,
                                         BigDecimal latitude, BigDecimal longitude, String description) {
        log.debug("Mise à jour de la localisation UUID: {}", localisationUuid);

        return jdbcClient.sql(LocalisationQuery.UPDATE_LOCALISATION)
                .param("localisationUuid", localisationUuid)
                .param("quartierId", quartierId)
                .param("adresseComplete", adresseComplete)
                .param("latitude", latitude)
                .param("longitude", longitude)
                .param("description", description)
                .query(localisationRowMapper)
                .optional();
    }

    @Override
    public boolean delete(String localisationUuid) {
        log.debug("Suppression de la localisation UUID: {}", localisationUuid);

        int rowsAffected = jdbcClient.sql(LocalisationQuery.DELETE_LOCALISATION)
                .param("localisationUuid", localisationUuid)
                .update();

        return rowsAffected > 0;
    }

    @Override
    public List<Localisation> findAll() {
        log.debug("Récupération de toutes les localisations");

        return jdbcClient.sql(LocalisationQuery.FIND_ALL_LOCALISATIONS)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public List<Localisation> findAllWithQuartier() {
        log.debug("Récupération des localisations avec quartier");

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATIONS_WITH_QUARTIER)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public List<Localisation> findAllWithoutQuartier() {
        log.debug("Récupération des localisations sans quartier");

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATIONS_WITHOUT_QUARTIER)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public List<Localisation> findByQuartierUuid(String quartierUuid) {
        log.debug("Récupération des localisations du quartier UUID: {}", quartierUuid);

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATIONS_BY_QUARTIER_UUID)
                .param("quartierUuid", quartierUuid)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public List<Localisation> findByCommuneUuid(String communeUuid) {
        log.debug("Récupération des localisations de la commune UUID: {}", communeUuid);

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATIONS_BY_COMMUNE_UUID)
                .param("communeUuid", communeUuid)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public List<Localisation> findByVilleUuid(String villeUuid) {
        log.debug("Récupération des localisations de la ville UUID: {}", villeUuid);

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATIONS_BY_VILLE_UUID)
                .param("villeUuid", villeUuid)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public List<Localisation> findByRegionUuid(String regionUuid) {
        log.debug("Récupération des localisations de la région UUID: {}", regionUuid);

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATIONS_BY_REGION_UUID)
                .param("regionUuid", regionUuid)
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public Optional<Localisation> findByUuid(String localisationUuid) {
        log.debug("Recherche de la localisation par UUID: {}", localisationUuid);

        return jdbcClient.sql(LocalisationQuery.FIND_LOCALISATION_BY_UUID)
                .param("localisationUuid", localisationUuid)
                .query(localisationRowMapper)
                .optional();
    }

    @Override
    public List<Localisation> searchByAddress(String searchTerm) {
        log.debug("Recherche des localisations par adresse: {}", searchTerm);

        return jdbcClient.sql(LocalisationQuery.SEARCH_LOCALISATIONS_BY_ADDRESS)
                .param("searchTerm", "%" + searchTerm + "%")
                .query(localisationRowMapper)
                .list();
    }

    @Override
    public boolean existsByUuid(String localisationUuid) {
        log.debug("Vérification de l'existence de la localisation par UUID: {}", localisationUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(LocalisationQuery.EXISTS_BY_UUID)
                        .param("localisationUuid", localisationUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByAdresse(String adresseComplete) {
        log.debug("Vérification de l'existence de l'adresse: {}", adresseComplete);

        return Boolean.TRUE.equals(
                jdbcClient.sql(LocalisationQuery.EXISTS_BY_ADRESSE)
                        .param("adresseComplete", adresseComplete)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByAdresseAndNotUuid(String adresseComplete, String localisationUuid) {
        log.debug("Vérification de l'existence de l'adresse: {} pour une autre localisation que: {}",
                adresseComplete, localisationUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(LocalisationQuery.EXISTS_BY_ADRESSE_AND_NOT_UUID)
                        .param("adresseComplete", adresseComplete)
                        .param("localisationUuid", localisationUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public Optional<Long> findQuartierIdByUuid(String quartierUuid) {
        log.debug("Recherche de l'ID du quartier par UUID: {}", quartierUuid);

        return jdbcClient.sql(LocalisationQuery.FIND_QUARTIER_ID_BY_UUID)
                .param("quartierUuid", quartierUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public long countAll() {
        Long count = jdbcClient.sql(LocalisationQuery.COUNT_ALL_LOCALISATIONS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countWithQuartier() {
        Long count = jdbcClient.sql(LocalisationQuery.COUNT_LOCALISATIONS_WITH_QUARTIER)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countWithoutQuartier() {
        Long count = jdbcClient.sql(LocalisationQuery.COUNT_LOCALISATIONS_WITHOUT_QUARTIER)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countWithCoordinates() {
        Long count = jdbcClient.sql(LocalisationQuery.COUNT_LOCALISATIONS_WITH_COORDINATES)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByQuartier(String quartierUuid) {
        Long count = jdbcClient.sql(LocalisationQuery.COUNT_LOCALISATIONS_BY_QUARTIER)
                .param("quartierUuid", quartierUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}
