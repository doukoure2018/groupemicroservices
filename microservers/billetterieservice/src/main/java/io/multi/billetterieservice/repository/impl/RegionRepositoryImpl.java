package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Region;
import io.multi.billetterieservice.mapper.RegionRowMapper;
import io.multi.billetterieservice.query.RegionQuery;
import io.multi.billetterieservice.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository pour la gestion des régions.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class RegionRepositoryImpl implements RegionRepository {

    private final JdbcClient jdbcClient;
    private final RegionRowMapper regionRowMapper;

    @Override
    public Region save(Region region) {
        log.debug("Création d'une nouvelle région: {}", region.getLibelle());

        return jdbcClient.sql(RegionQuery.INSERT_REGION)
                .param("libelle", region.getLibelle())
                .param("code", region.getCode())
                .param("actif", region.getActif() != null ? region.getActif() : true)
                .query(regionRowMapper)
                .single();
    }

    @Override
    public Optional<Region> update(String regionUuid, String libelle, String code) {
        log.debug("Mise à jour de la région UUID: {}", regionUuid);

        return jdbcClient.sql(RegionQuery.UPDATE_REGION)
                .param("regionUuid", regionUuid)
                .param("libelle", libelle)
                .param("code", code)
                .query(regionRowMapper)
                .optional();
    }

    @Override
    public Optional<Region> updateStatus(String regionUuid, Boolean actif) {
        log.debug("Mise à jour du statut de la région UUID: {} -> actif: {}", regionUuid, actif);

        return jdbcClient.sql(RegionQuery.UPDATE_REGION_STATUS)
                .param("regionUuid", regionUuid)
                .param("actif", actif)
                .query(regionRowMapper)
                .optional();
    }

    @Override
    public List<Region> findAll() {
        log.debug("Récupération de toutes les régions");

        return jdbcClient.sql(RegionQuery.FIND_ALL_REGIONS)
                .query(regionRowMapper)
                .list();
    }

    @Override
    public List<Region> findAllActive() {
        log.debug("Récupération de toutes les régions actives");

        return jdbcClient.sql(RegionQuery.FIND_ALL_ACTIVE_REGIONS)
                .query(regionRowMapper)
                .list();
    }

    @Override
    public Optional<Region> findByUuid(String regionUuid) {
        log.debug("Recherche de la région par UUID: {}", regionUuid);

        return jdbcClient.sql(RegionQuery.FIND_REGION_BY_UUID)
                .param("regionUuid", regionUuid)
                .query(regionRowMapper)
                .optional();
    }

    @Override
    public Optional<Region> findById(Long regionId) {
        log.debug("Recherche de la région par ID: {}", regionId);

        return jdbcClient.sql(RegionQuery.FIND_REGION_BY_ID)
                .param("regionId", regionId)
                .query(regionRowMapper)
                .optional();
    }

    @Override
    public boolean existsByLibelle(String libelle) {
        log.debug("Vérification de l'existence du libellé: {}", libelle);

        return Boolean.TRUE.equals(
                jdbcClient.sql(RegionQuery.EXISTS_BY_LIBELLE)
                        .param("libelle", libelle)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByLibelleAndNotUuid(String libelle, String regionUuid) {
        log.debug("Vérification de l'existence du libellé: {} pour une autre région que: {}", libelle, regionUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(RegionQuery.EXISTS_BY_LIBELLE_AND_NOT_UUID)
                        .param("libelle", libelle)
                        .param("regionUuid", regionUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByUuid(String regionUuid) {
        log.debug("Vérification de l'existence de la région par UUID: {}", regionUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(RegionQuery.EXISTS_BY_UUID)
                        .param("regionUuid", regionUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public long countAll() {
        log.debug("Comptage de toutes les régions");

        Long count = jdbcClient.sql(RegionQuery.COUNT_ALL_REGIONS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActive() {
        log.debug("Comptage des régions actives");

        Long count = jdbcClient.sql(RegionQuery.COUNT_ACTIVE_REGIONS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}