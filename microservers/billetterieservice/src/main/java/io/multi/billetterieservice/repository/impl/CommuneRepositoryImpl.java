package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Commune;
import io.multi.billetterieservice.mapper.CommuneRowMapper;
import io.multi.billetterieservice.query.CommuneQuery;
import io.multi.billetterieservice.repository.CommuneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository pour la gestion des communes.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class CommuneRepositoryImpl implements CommuneRepository {

    private final JdbcClient jdbcClient;
    private final CommuneRowMapper communeRowMapper;

    @Override
    public Commune save(Commune commune) {
        log.debug("Création d'une nouvelle commune: {} dans la ville ID: {}", commune.getLibelle(), commune.getVilleId());

        return jdbcClient.sql(CommuneQuery.INSERT_COMMUNE)
                .param("villeId", commune.getVilleId())
                .param("libelle", commune.getLibelle())
                .param("actif", commune.getActif() != null ? commune.getActif() : true)
                .query(communeRowMapper)
                .single();
    }

    @Override
    public Optional<Commune> update(String communeUuid, String libelle, Long villeId) {
        log.debug("Mise à jour de la commune UUID: {}", communeUuid);

        return jdbcClient.sql(CommuneQuery.UPDATE_COMMUNE)
                .param("communeUuid", communeUuid)
                .param("libelle", libelle)
                .param("villeId", villeId)
                .query(communeRowMapper)
                .optional();
    }

    @Override
    public Optional<Commune> updateStatus(String communeUuid, Boolean actif) {
        log.debug("Mise à jour du statut de la commune UUID: {} -> actif: {}", communeUuid, actif);

        return jdbcClient.sql(CommuneQuery.UPDATE_COMMUNE_STATUS)
                .param("communeUuid", communeUuid)
                .param("actif", actif)
                .query(communeRowMapper)
                .optional();
    }

    @Override
    public List<Commune> findAll() {
        log.debug("Récupération de toutes les communes");

        return jdbcClient.sql(CommuneQuery.FIND_ALL_COMMUNES)
                .query(communeRowMapper)
                .list();
    }

    @Override
    public List<Commune> findAllActive() {
        log.debug("Récupération de toutes les communes actives");

        return jdbcClient.sql(CommuneQuery.FIND_ALL_ACTIVE_COMMUNES)
                .query(communeRowMapper)
                .list();
    }

    @Override
    public List<Commune> findByVilleUuid(String villeUuid) {
        log.debug("Récupération des communes de la ville UUID: {}", villeUuid);

        return jdbcClient.sql(CommuneQuery.FIND_COMMUNES_BY_VILLE_UUID)
                .param("villeUuid", villeUuid)
                .query(communeRowMapper)
                .list();
    }

    @Override
    public List<Commune> findActiveByVilleUuid(String villeUuid) {
        log.debug("Récupération des communes actives de la ville UUID: {}", villeUuid);

        return jdbcClient.sql(CommuneQuery.FIND_ACTIVE_COMMUNES_BY_VILLE_UUID)
                .param("villeUuid", villeUuid)
                .query(communeRowMapper)
                .list();
    }

    @Override
    public List<Commune> findByRegionUuid(String regionUuid) {
        log.debug("Récupération des communes de la région UUID: {}", regionUuid);

        return jdbcClient.sql(CommuneQuery.FIND_COMMUNES_BY_REGION_UUID)
                .param("regionUuid", regionUuid)
                .query(communeRowMapper)
                .list();
    }

    @Override
    public Optional<Commune> findByUuid(String communeUuid) {
        log.debug("Recherche de la commune par UUID: {}", communeUuid);

        return jdbcClient.sql(CommuneQuery.FIND_COMMUNE_BY_UUID)
                .param("communeUuid", communeUuid)
                .query(communeRowMapper)
                .optional();
    }

    @Override
    public boolean existsByLibelleAndVille(String libelle, String villeUuid) {
        log.debug("Vérification de l'existence du libellé: {} dans la ville: {}", libelle, villeUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(CommuneQuery.EXISTS_BY_LIBELLE_AND_VILLE)
                        .param("libelle", libelle)
                        .param("villeUuid", villeUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByLibelleAndVilleAndNotUuid(String libelle, String villeUuid, String communeUuid) {
        log.debug("Vérification de l'existence du libellé: {} dans la ville: {} pour une autre commune que: {}",
                libelle, villeUuid, communeUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(CommuneQuery.EXISTS_BY_LIBELLE_AND_VILLE_AND_NOT_UUID)
                        .param("libelle", libelle)
                        .param("villeUuid", villeUuid)
                        .param("communeUuid", communeUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public boolean existsByUuid(String communeUuid) {
        log.debug("Vérification de l'existence de la commune par UUID: {}", communeUuid);

        return Boolean.TRUE.equals(
                jdbcClient.sql(CommuneQuery.EXISTS_BY_UUID)
                        .param("communeUuid", communeUuid)
                        .query(Boolean.class)
                        .single()
        );
    }

    @Override
    public Optional<Long> findVilleIdByUuid(String villeUuid) {
        log.debug("Recherche de l'ID de la ville par UUID: {}", villeUuid);

        return jdbcClient.sql(CommuneQuery.FIND_VILLE_ID_BY_UUID)
                .param("villeUuid", villeUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public long countAll() {
        Long count = jdbcClient.sql(CommuneQuery.COUNT_ALL_COMMUNES)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActive() {
        Long count = jdbcClient.sql(CommuneQuery.COUNT_ACTIVE_COMMUNES)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByVille(String villeUuid) {
        Long count = jdbcClient.sql(CommuneQuery.COUNT_COMMUNES_BY_VILLE)
                .param("villeUuid", villeUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}
