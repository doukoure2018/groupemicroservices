package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Arrivee;
import io.multi.billetterieservice.query.ArriveeQuery;
import io.multi.billetterieservice.repository.ArriveeRepository;
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
 * Implémentation du repository Arrivee utilisant JdbcClient
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class ArriveeRepositoryImpl implements ArriveeRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en Double (pour les coordonnées NUMERIC PostgreSQL)
     */
    private Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    /**
     * RowMapper pour convertir les ResultSet en objets Arrivee
     */
    private final RowMapper<Arrivee> arriveeRowMapper = (rs, rowNum) -> Arrivee.builder()
            .arriveeId(rs.getLong("arrivee_id"))
            .arriveeUuid(rs.getString("arrivee_uuid"))
            .siteId(rs.getLong("site_id"))
            .departId(rs.getLong("depart_id"))
            .libelle(rs.getString("libelle"))
            .libelleDepart(rs.getString("libelle_depart"))
            .description(rs.getString("description"))
            .ordreAffichage(rs.getObject("ordre_affichage", Integer.class))
            .actif(rs.getBoolean("actif"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Site d'arrivée
            .siteUuid(rs.getString("site_uuid"))
            .siteNom(rs.getString("site_nom"))
            .siteTypeSite(rs.getString("site_type_site"))
            // Localisation arrivée
            .localisationUuid(rs.getString("localisation_uuid"))
            .adresseComplete(rs.getString("adresse_complete"))
            // CORRECTION: Utiliser BigDecimal pour les coordonnées NUMERIC PostgreSQL
            .latitude(toDouble(rs.getBigDecimal("latitude")))
            .longitude(toDouble(rs.getBigDecimal("longitude")))
            // Hiérarchie arrivée
            .quartierLibelle(rs.getString("quartier_libelle"))
            .communeLibelle(rs.getString("commune_libelle"))
            .villeUuid(rs.getString("ville_uuid"))
            .villeLibelle(rs.getString("ville_libelle"))
            .regionLibelle(rs.getString("region_libelle"))
            // Départ
            .departUuid(rs.getString("depart_uuid"))
            .departLibelle(rs.getString("depart_libelle"))
            // Site du départ
            .departSiteUuid(rs.getString("depart_site_uuid"))
            .departSiteNom(rs.getString("depart_site_nom"))
            .departAdresseComplete(rs.getString("depart_adresse_complete"))
            // CORRECTION: Coordonnées du site de départ
            .departLatitude(toDouble(rs.getBigDecimal("depart_latitude")))
            .departLongitude(toDouble(rs.getBigDecimal("depart_longitude")))
            .departVilleUuid(rs.getString("depart_ville_uuid"))
            .departVilleLibelle(rs.getString("depart_ville_libelle"))
            .build();

    @Override
    public List<Arrivee> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(ArriveeQuery.FIND_ALL)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(ArriveeQuery.FIND_ALL_ACTIFS)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public Optional<Arrivee> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(arriveeRowMapper)
                .optional();
    }

    @Override
    public Optional<Arrivee> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_ID)
                .param("id", id)
                .query(arriveeRowMapper)
                .optional();
    }

    @Override
    public List<Arrivee> findBySite(Long siteId) {
        log.debug("Exécution de findBySite({})", siteId);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_SITE)
                .param("siteId", siteId)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findBySiteUuid(String siteUuid) {
        log.debug("Exécution de findBySiteUuid({})", siteUuid);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_SITE_UUID)
                .param("siteUuid", siteUuid)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findByDepart(Long departId) {
        log.debug("Exécution de findByDepart({})", departId);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_DEPART)
                .param("departId", departId)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findByDepartUuid(String departUuid) {
        log.debug("Exécution de findByDepartUuid({})", departUuid);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_DEPART_UUID)
                .param("departUuid", departUuid)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findByVilleArrivee(String villeUuid) {
        log.debug("Exécution de findByVilleArrivee({})", villeUuid);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_VILLE_ARRIVEE)
                .param("villeUuid", villeUuid)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findByVilleDepart(String villeUuid) {
        log.debug("Exécution de findByVilleDepart({})", villeUuid);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_VILLE_DEPART)
                .param("villeUuid", villeUuid)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> findByDepartAndVilleArrivee(String departUuid, String villeArriveeUuid) {
        log.debug("Exécution de findByDepartAndVilleArrivee({}, {})", departUuid, villeArriveeUuid);
        return jdbcClient.sql(ArriveeQuery.FIND_BY_DEPART_AND_VILLE_ARRIVEE)
                .param("departUuid", departUuid)
                .param("villeArriveeUuid", villeArriveeUuid)
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public List<Arrivee> searchByLibelle(String searchTerm) {
        log.debug("Exécution de searchByLibelle({})", searchTerm);
        return jdbcClient.sql(ArriveeQuery.SEARCH_BY_LIBELLE)
                .param("searchTerm", "%" + searchTerm + "%")
                .query(arriveeRowMapper)
                .list();
    }

    @Override
    public boolean existsByLibelleAndSiteAndDepart(String libelle, Long siteId, Long departId) {
        log.debug("Exécution de existsByLibelleAndSiteAndDepart({}, {}, {})", libelle, siteId, departId);
        Integer count = jdbcClient.sql(ArriveeQuery.EXISTS_BY_LIBELLE_SITE_DEPART)
                .param("libelle", libelle)
                .param("siteId", siteId)
                .param("departId", departId)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByLibelleAndSiteAndDepartExcludingUuid(String libelle, Long siteId, Long departId, String excludeUuid) {
        log.debug("Exécution de existsByLibelleAndSiteAndDepartExcludingUuid({}, {}, {}, {})", libelle, siteId, departId, excludeUuid);
        Integer count = jdbcClient.sql(ArriveeQuery.EXISTS_BY_LIBELLE_SITE_DEPART_EXCLUDING_UUID)
                .param("libelle", libelle)
                .param("siteId", siteId)
                .param("departId", departId)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public Arrivee save(Arrivee arrivee) {
        log.debug("Exécution de save({})", arrivee.getLibelle());
        return jdbcClient.sql(ArriveeQuery.INSERT)
                .param("siteId", arrivee.getSiteId())
                .param("departId", arrivee.getDepartId())
                .param("libelle", arrivee.getLibelle())
                .param("libelleDepart", arrivee.getLibelleDepart())
                .param("description", arrivee.getDescription())
                .param("ordreAffichage", arrivee.getOrdreAffichage() != null ? arrivee.getOrdreAffichage() : 0)
                .param("actif", arrivee.getActif() != null ? arrivee.getActif() : true)
                .query((rs, rowNum) -> {
                    arrivee.setArriveeId(rs.getLong("arrivee_id"));
                    arrivee.setArriveeUuid(rs.getString("arrivee_uuid"));
                    arrivee.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    arrivee.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return arrivee;
                })
                .single();
    }

    @Override
    public Arrivee update(Arrivee arrivee) {
        log.debug("Exécution de update({})", arrivee.getArriveeUuid());
        return jdbcClient.sql(ArriveeQuery.UPDATE)
                .param("siteId", arrivee.getSiteId())
                .param("departId", arrivee.getDepartId())
                .param("libelle", arrivee.getLibelle())
                .param("libelleDepart", arrivee.getLibelleDepart())
                .param("description", arrivee.getDescription())
                .param("ordreAffichage", arrivee.getOrdreAffichage())
                .param("actif", arrivee.getActif())
                .param("uuid", arrivee.getArriveeUuid())
                .query((rs, rowNum) -> {
                    arrivee.setArriveeId(rs.getLong("arrivee_id"));
                    arrivee.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    arrivee.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return arrivee;
                })
                .single();
    }

    @Override
    public int updateActif(String uuid, boolean actif) {
        log.debug("Exécution de updateActif({}, {})", uuid, actif);
        return jdbcClient.sql(ArriveeQuery.UPDATE_ACTIF)
                .param("actif", actif)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(ArriveeQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public boolean hasTrajets(String uuid) {
        log.debug("Exécution de hasTrajets({})", uuid);
        // Note: Cette méthode sera implémentée quand la table trajets existera
        try {
            Integer count = jdbcClient.sql(ArriveeQuery.HAS_TRAJETS)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            // La table trajets n'existe peut-être pas encore
            log.warn("Impossible de vérifier les trajets pour l'arrivée {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(ArriveeQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActifs() {
        log.debug("Exécution de countActifs()");
        Long count = jdbcClient.sql(ArriveeQuery.COUNT_ACTIFS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countBySite(Long siteId) {
        log.debug("Exécution de countBySite({})", siteId);
        Long count = jdbcClient.sql(ArriveeQuery.COUNT_BY_SITE)
                .param("siteId", siteId)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByDepart(Long departId) {
        log.debug("Exécution de countByDepart({})", departId);
        Long count = jdbcClient.sql(ArriveeQuery.COUNT_BY_DEPART)
                .param("departId", departId)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}