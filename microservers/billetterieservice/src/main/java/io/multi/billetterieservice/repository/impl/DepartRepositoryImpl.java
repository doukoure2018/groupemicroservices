package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Depart;
import io.multi.billetterieservice.query.DepartQuery;
import io.multi.billetterieservice.repository.DepartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository Depart utilisant JdbcClient
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class DepartRepositoryImpl implements DepartRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en Double (pour les coordonnées NUMERIC PostgreSQL)
     */
    private Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    /**
     * RowMapper pour convertir les ResultSet en objets Depart
     */
    private final RowMapper<Depart> departRowMapper = (rs, rowNum) -> Depart.builder()
            .departId(rs.getLong("depart_id"))
            .departUuid(rs.getString("depart_uuid"))
            .siteId(rs.getLong("site_id"))
            .libelle(rs.getString("libelle"))
            .description(rs.getString("description"))
            .ordreAffichage(rs.getObject("ordre_affichage", Integer.class))
            .actif(rs.getBoolean("actif"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Site
            .siteUuid(rs.getString("site_uuid"))
            .siteNom(rs.getString("site_nom"))
            .siteTypeSite(rs.getString("site_type_site"))
            // Localisation
            .localisationUuid(rs.getString("localisation_uuid"))
            .adresseComplete(rs.getString("adresse_complete"))
            // CORRECTION: Utiliser BigDecimal pour les coordonnées NUMERIC PostgreSQL
            .latitude(toDouble(rs.getBigDecimal("latitude")))
            .longitude(toDouble(rs.getBigDecimal("longitude")))
            // Hiérarchie géographique
            .quartierLibelle(rs.getString("quartier_libelle"))
            .communeLibelle(rs.getString("commune_libelle"))
            .villeUuid(rs.getString("ville_uuid"))
            .villeLibelle(rs.getString("ville_libelle"))
            .regionLibelle(rs.getString("region_libelle"))
            .build();

    @Override
    public List<Depart> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(DepartQuery.FIND_ALL)
                .query(departRowMapper)
                .list();
    }

    @Override
    public List<Depart> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(DepartQuery.FIND_ALL_ACTIFS)
                .query(departRowMapper)
                .list();
    }

    @Override
    public Optional<Depart> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(DepartQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(departRowMapper)
                .optional();
    }

    @Override
    public Optional<Depart> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(DepartQuery.FIND_BY_ID)
                .param("id", id)
                .query(departRowMapper)
                .optional();
    }

    @Override
    public List<Depart> findBySite(Long siteId) {
        log.debug("Exécution de findBySite({})", siteId);
        return jdbcClient.sql(DepartQuery.FIND_BY_SITE)
                .param("siteId", siteId)
                .query(departRowMapper)
                .list();
    }

    @Override
    public List<Depart> findBySiteUuid(String siteUuid) {
        log.debug("Exécution de findBySiteUuid({})", siteUuid);
        return jdbcClient.sql(DepartQuery.FIND_BY_SITE_UUID)
                .param("siteUuid", siteUuid)
                .query(departRowMapper)
                .list();
    }

    @Override
    public List<Depart> findBySiteUuidActifs(String siteUuid) {
        log.debug("Exécution de findBySiteUuidActifs({})", siteUuid);
        return jdbcClient.sql(DepartQuery.FIND_BY_SITE_UUID_ACTIFS)
                .param("siteUuid", siteUuid)
                .query(departRowMapper)
                .list();
    }

    @Override
    public List<Depart> findByVille(String villeUuid) {
        log.debug("Exécution de findByVille({})", villeUuid);
        return jdbcClient.sql(DepartQuery.FIND_BY_VILLE)
                .param("villeUuid", villeUuid)
                .query(departRowMapper)
                .list();
    }

    @Override
    public List<Depart> searchByLibelle(String searchTerm) {
        log.debug("Exécution de searchByLibelle({})", searchTerm);
        return jdbcClient.sql(DepartQuery.SEARCH_BY_LIBELLE)
                .param("searchTerm", "%" + searchTerm + "%")
                .query(departRowMapper)
                .list();
    }

    @Override
    public boolean existsByLibelleAndSite(String libelle, Long siteId) {
        log.debug("Exécution de existsByLibelleAndSite({}, {})", libelle, siteId);
        Integer count = jdbcClient.sql(DepartQuery.EXISTS_BY_LIBELLE_AND_SITE)
                .param("libelle", libelle)
                .param("siteId", siteId)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByLibelleAndSiteExcludingUuid(String libelle, Long siteId, String excludeUuid) {
        log.debug("Exécution de existsByLibelleAndSiteExcludingUuid({}, {}, {})", libelle, siteId, excludeUuid);
        Integer count = jdbcClient.sql(DepartQuery.EXISTS_BY_LIBELLE_AND_SITE_EXCLUDING_UUID)
                .param("libelle", libelle)
                .param("siteId", siteId)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public Depart save(Depart depart) {
        log.debug("Exécution de save({})", depart.getLibelle());
        return jdbcClient.sql(DepartQuery.INSERT)
                .param("siteId", depart.getSiteId())
                .param("libelle", depart.getLibelle())
                .param("description", depart.getDescription())
                .param("ordreAffichage", depart.getOrdreAffichage() != null ? depart.getOrdreAffichage() : 0)
                .param("actif", depart.getActif() != null ? depart.getActif() : true)
                .query((rs, rowNum) -> {
                    depart.setDepartId(rs.getLong("depart_id"));
                    depart.setDepartUuid(rs.getString("depart_uuid"));
                    depart.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    depart.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return depart;
                })
                .single();
    }

    @Override
    public Depart update(Depart depart) {
        log.debug("Exécution de update({})", depart.getDepartUuid());
        return jdbcClient.sql(DepartQuery.UPDATE)
                .param("siteId", depart.getSiteId())
                .param("libelle", depart.getLibelle())
                .param("description", depart.getDescription())
                .param("ordreAffichage", depart.getOrdreAffichage())
                .param("actif", depart.getActif())
                .param("uuid", depart.getDepartUuid())
                .query((rs, rowNum) -> {
                    depart.setDepartId(rs.getLong("depart_id"));
                    depart.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    depart.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return depart;
                })
                .single();
    }

    @Override
    public int updateActif(String uuid, boolean actif) {
        log.debug("Exécution de updateActif({}, {})", uuid, actif);
        return jdbcClient.sql(DepartQuery.UPDATE_ACTIF)
                .param("actif", actif)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(DepartQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public boolean hasArrivees(String uuid) {
        log.debug("Exécution de hasArrivees({})", uuid);
        Integer count = jdbcClient.sql(DepartQuery.HAS_ARRIVEES)
                .param("uuid", uuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(DepartQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActifs() {
        log.debug("Exécution de countActifs()");
        Long count = jdbcClient.sql(DepartQuery.COUNT_ACTIFS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countBySite(Long siteId) {
        log.debug("Exécution de countBySite({})", siteId);
        Long count = jdbcClient.sql(DepartQuery.COUNT_BY_SITE)
                .param("siteId", siteId)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}