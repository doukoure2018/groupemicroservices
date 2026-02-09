package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Ville;
import io.multi.billetterieservice.mapper.VilleRowMapper;
import io.multi.billetterieservice.query.VilleQuery;
import io.multi.billetterieservice.repository.VilleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository pour la gestion des villes.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class VilleRepositoryImpl implements VilleRepository {

    private final JdbcClient jdbcClient;
    private final VilleRowMapper villeRowMapper;

    @Override
    public Ville save(Ville ville) {
        log.debug("Création d'une nouvelle ville: {} dans la région ID: {}", ville.getLibelle(), ville.getRegionId());

        return jdbcClient.sql(VilleQuery.INSERT_VILLE)
                .param("regionId", ville.getRegionId())
                .param("libelle", ville.getLibelle())
                .param("codePostal", ville.getCodePostal())
                .param("actif", ville.getActif() != null ? ville.getActif() : true)
                .query(villeRowMapper)
                .single();
    }

    @Override
    public Optional<Ville> update(String villeUuid, String libelle, String codePostal, Long regionId) {
        log.debug("Mise à jour de la ville UUID: {}", villeUuid);

        return jdbcClient.sql(VilleQuery.UPDATE_VILLE)
                .param("villeUuid", villeUuid)
                .param("libelle", libelle)
                .param("codePostal", codePostal)
                .param("regionId", regionId)
                .query(villeRowMapper)
                .optional();
    }

    @Override
    public Optional<Ville> updateStatus(String villeUuid, Boolean actif) {
        log.debug("Mise à jour du statut de la ville UUID: {} -> actif: {}", villeUuid, actif);

        return jdbcClient.sql(VilleQuery.UPDATE_VILLE_STATUS)
                .param("villeUuid", villeUuid)
                .param("actif", actif)
                .query(villeRowMapper)
                .optional();
    }

    @Override
    public List<Ville> findAll() {
        log.debug("Récupération de toutes les villes");

        return jdbcClient.sql(VilleQuery.FIND_ALL_VILLES)
                .query(villeRowMapper)
                .list();
    }

    @Override
    public List<Ville> findAllActive() {
        log.debug("Récupération de toutes les villes actives");

        return jdbcClient.sql(VilleQuery.FIND_ALL_ACTIVE_VILLES)
                .query(villeRowMapper)
                .list();
    }

    @Override
    public List<Ville> findByRegionUuid(String regionUuid) {
        log.debug("Récupération des villes de la région UUID: {}", regionUuid);

        return jdbcClient.sql(VilleQuery.FIND_VILLES_BY_REGION_UUID)
                .param("regionUuid", regionUuid)
                .query(villeRowMapper)
                .list();
    }

    @Override
    public List<Ville> findActiveByRegionUuid(String regionUuid) {
        log.debug("Récupération des villes actives de la région UUID: {}", regionUuid);

        return jdbcClient.sql(VilleQuery.FIND_ACTIVE_VILLES_BY_REGION_UUID)
                .param("regionUuid", regionUuid)
                .query(villeRowMapper)
                .list();
    }

    @Override
    public Optional<Ville> findByUuid(String villeUuid) {
        log.debug("Recherche de la ville par UUID: {}", villeUuid);

        return jdbcClient.sql(VilleQuery.FIND_VILLE_BY_UUID)
                .param("villeUuid", villeUuid)
                .query(villeRowMapper)
                .optional();
    }

    @Override
    public Optional<Ville> findById(Long villeId) {
        log.debug("Recherche de la ville par ID: {}", villeId);

        return jdbcClient.sql(VilleQuery.FIND_VILLE_BY_ID)
                .param("villeId", villeId)
                .query(villeRowMapper)
                .optional();
    }

    @Override
    public boolean existsByLibelleAndRegion(String libelle, String regionUuid) {
        log.debug("Vérification de l'existence du libellé: {} dans la région: {}", libelle, regionUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(VilleQuery.EXISTS_BY_LIBELLE_AND_REGION)
                        .param("libelle", libelle)
                        .param("regionUuid", regionUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByLibelleAndRegionAndNotUuid(String libelle, String regionUuid, String villeUuid) {
        log.debug("Vérification de l'existence du libellé: {} dans la région: {} pour une autre ville que: {}",
                libelle, regionUuid, villeUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(VilleQuery.EXISTS_BY_LIBELLE_AND_REGION_AND_NOT_UUID)
                        .param("libelle", libelle)
                        .param("regionUuid", regionUuid)
                        .param("villeUuid", villeUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByUuid(String villeUuid) {
        log.debug("Vérification de l'existence de la ville par UUID: {}", villeUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(VilleQuery.EXISTS_BY_UUID)
                        .param("villeUuid", villeUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public Optional<Long> findRegionIdByUuid(String regionUuid) {
        log.debug("Recherche de l'ID de la région par UUID: {}", regionUuid);

        return jdbcClient.sql(VilleQuery.FIND_REGION_ID_BY_UUID)
                .param("regionUuid", regionUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public long countAll() {
        log.debug("Comptage de toutes les villes");

        Long count = jdbcClient.sql(VilleQuery.COUNT_ALL_VILLES)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActive() {
        log.debug("Comptage des villes actives");

        Long count = jdbcClient.sql(VilleQuery.COUNT_ACTIVE_VILLES)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByRegion(String regionUuid) {
        log.debug("Comptage des villes de la région: {}", regionUuid);

        Long count = jdbcClient.sql(VilleQuery.COUNT_VILLES_BY_REGION)
                .param("regionUuid", regionUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}