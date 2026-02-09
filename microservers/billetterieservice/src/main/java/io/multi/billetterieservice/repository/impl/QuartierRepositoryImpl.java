package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Quartier;
import io.multi.billetterieservice.mapper.QuartierRowMapper;
import io.multi.billetterieservice.query.QuartierQuery;
import io.multi.billetterieservice.repository.QuartierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository pour la gestion des quartiers.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class QuartierRepositoryImpl implements QuartierRepository {

    private final JdbcClient jdbcClient;
    private final QuartierRowMapper quartierRowMapper;

    @Override
    public Quartier save(Quartier quartier) {
        log.debug("Création d'un nouveau quartier: {} dans la commune ID: {}", quartier.getLibelle(), quartier.getCommuneId());

        return jdbcClient.sql(QuartierQuery.INSERT_QUARTIER)
                .param("communeId", quartier.getCommuneId())
                .param("libelle", quartier.getLibelle())
                .param("actif", quartier.getActif() != null ? quartier.getActif() : true)
                .query(quartierRowMapper)
                .single();
    }

    @Override
    public Optional<Quartier> update(String quartierUuid, String libelle, Long communeId) {
        log.debug("Mise à jour du quartier UUID: {}", quartierUuid);

        return jdbcClient.sql(QuartierQuery.UPDATE_QUARTIER)
                .param("quartierUuid", quartierUuid)
                .param("libelle", libelle)
                .param("communeId", communeId)
                .query(quartierRowMapper)
                .optional();
    }

    @Override
    public Optional<Quartier> updateStatus(String quartierUuid, Boolean actif) {
        log.debug("Mise à jour du statut du quartier UUID: {} -> actif: {}", quartierUuid, actif);

        return jdbcClient.sql(QuartierQuery.UPDATE_QUARTIER_STATUS)
                .param("quartierUuid", quartierUuid)
                .param("actif", actif)
                .query(quartierRowMapper)
                .optional();
    }

    @Override
    public List<Quartier> findAll() {
        log.debug("Récupération de tous les quartiers");

        return jdbcClient.sql(QuartierQuery.FIND_ALL_QUARTIERS)
                .query(quartierRowMapper)
                .list();
    }

    @Override
    public List<Quartier> findAllActive() {
        log.debug("Récupération de tous les quartiers actifs");

        return jdbcClient.sql(QuartierQuery.FIND_ALL_ACTIVE_QUARTIERS)
                .query(quartierRowMapper)
                .list();
    }

    @Override
    public List<Quartier> findByCommuneUuid(String communeUuid) {
        log.debug("Récupération des quartiers de la commune UUID: {}", communeUuid);

        return jdbcClient.sql(QuartierQuery.FIND_QUARTIERS_BY_COMMUNE_UUID)
                .param("communeUuid", communeUuid)
                .query(quartierRowMapper)
                .list();
    }

    @Override
    public List<Quartier> findActiveByCommuneUuid(String communeUuid) {
        log.debug("Récupération des quartiers actifs de la commune UUID: {}", communeUuid);

        return jdbcClient.sql(QuartierQuery.FIND_ACTIVE_QUARTIERS_BY_COMMUNE_UUID)
                .param("communeUuid", communeUuid)
                .query(quartierRowMapper)
                .list();
    }

    @Override
    public List<Quartier> findByVilleUuid(String villeUuid) {
        log.debug("Récupération des quartiers de la ville UUID: {}", villeUuid);

        return jdbcClient.sql(QuartierQuery.FIND_QUARTIERS_BY_VILLE_UUID)
                .param("villeUuid", villeUuid)
                .query(quartierRowMapper)
                .list();
    }

    @Override
    public List<Quartier> findByRegionUuid(String regionUuid) {
        log.debug("Récupération des quartiers de la région UUID: {}", regionUuid);

        return jdbcClient.sql(QuartierQuery.FIND_QUARTIERS_BY_REGION_UUID)
                .param("regionUuid", regionUuid)
                .query(quartierRowMapper)
                .list();
    }

    @Override
    public Optional<Quartier> findByUuid(String quartierUuid) {
        log.debug("Recherche du quartier par UUID: {}", quartierUuid);

        return jdbcClient.sql(QuartierQuery.FIND_QUARTIER_BY_UUID)
                .param("quartierUuid", quartierUuid)
                .query(quartierRowMapper)
                .optional();
    }

    @Override
    public boolean existsByLibelleAndCommune(String libelle, String communeUuid) {
        log.debug("Vérification de l'existence du libellé: {} dans la commune: {}", libelle, communeUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(QuartierQuery.EXISTS_BY_LIBELLE_AND_COMMUNE)
                        .param("libelle", libelle)
                        .param("communeUuid", communeUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByLibelleAndCommuneAndNotUuid(String libelle, String communeUuid, String quartierUuid) {
        log.debug("Vérification de l'existence du libellé: {} dans la commune: {} pour un autre quartier que: {}",
                libelle, communeUuid, quartierUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(QuartierQuery.EXISTS_BY_LIBELLE_AND_COMMUNE_AND_NOT_UUID)
                        .param("libelle", libelle)
                        .param("communeUuid", communeUuid)
                        .param("quartierUuid", quartierUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByUuid(String quartierUuid) {
        log.debug("Vérification de l'existence du quartier par UUID: {}", quartierUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(QuartierQuery.EXISTS_BY_UUID)
                        .param("quartierUuid", quartierUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public Optional<Long> findCommuneIdByUuid(String communeUuid) {
        log.debug("Recherche de l'ID de la commune par UUID: {}", communeUuid);

        return jdbcClient.sql(QuartierQuery.FIND_COMMUNE_ID_BY_UUID)
                .param("communeUuid", communeUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public long countAll() {
        Long count = jdbcClient.sql(QuartierQuery.COUNT_ALL_QUARTIERS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActive() {
        Long count = jdbcClient.sql(QuartierQuery.COUNT_ACTIVE_QUARTIERS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByCommune(String communeUuid) {
        Long count = jdbcClient.sql(QuartierQuery.COUNT_QUARTIERS_BY_COMMUNE)
                .param("communeUuid", communeUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}

