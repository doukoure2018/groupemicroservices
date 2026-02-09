package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Site;
import io.multi.billetterieservice.query.SiteQuery;
import io.multi.billetterieservice.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository Site utilisant JdbcClient
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class SiteRepositoryImpl implements SiteRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en Double (pour les coordonnées NUMERIC PostgreSQL)
     */
    private Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    /**
     * RowMapper pour convertir les ResultSet en objets Site
     */
    private final RowMapper<Site> siteRowMapper = (rs, rowNum) -> Site.builder()
            .siteId(rs.getLong("site_id"))
            .siteUuid(rs.getString("site_uuid"))
            .localisationId(rs.getLong("localisation_id"))
            .nom(rs.getString("nom"))
            .description(rs.getString("description"))
            .typeSite(rs.getString("type_site"))
            .capaciteVehicules(rs.getObject("capacite_vehicules", Integer.class))
            .telephone(rs.getString("telephone"))
            .email(rs.getString("email"))
            .horaireOuverture(rs.getObject("horaire_ouverture", LocalTime.class))
            .horaireFermeture(rs.getObject("horaire_fermeture", LocalTime.class))
            .imageUrl(rs.getString("image_url"))
            .actif(rs.getBoolean("actif"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Localisation
            .localisationUuid(rs.getString("localisation_uuid"))
            .adresseComplete(rs.getString("adresse_complete"))
            // CORRECTION: Utiliser BigDecimal pour les coordonnées NUMERIC PostgreSQL
            .latitude(toDouble(rs.getBigDecimal("latitude")))
            .longitude(toDouble(rs.getBigDecimal("longitude")))
            // Hiérarchie géographique
            .quartierUuid(rs.getString("quartier_uuid"))
            .quartierLibelle(rs.getString("quartier_libelle"))
            .communeUuid(rs.getString("commune_uuid"))
            .communeLibelle(rs.getString("commune_libelle"))
            .villeUuid(rs.getString("ville_uuid"))
            .villeLibelle(rs.getString("ville_libelle"))
            .regionUuid(rs.getString("region_uuid"))
            .regionLibelle(rs.getString("region_libelle"))
            .build();

    @Override
    public List<Site> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(SiteQuery.FIND_ALL)
                .query(siteRowMapper)
                .list();
    }

    @Override
    public List<Site> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(SiteQuery.FIND_ALL_ACTIFS)
                .query(siteRowMapper)
                .list();
    }

    @Override
    public Optional<Site> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(SiteQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(siteRowMapper)
                .optional();
    }

    @Override
    public Optional<Site> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(SiteQuery.FIND_BY_ID)
                .param("id", id)
                .query(siteRowMapper)
                .optional();
    }

    @Override
    public List<Site> findByTypeSite(String typeSite) {
        log.debug("Exécution de findByTypeSite({})", typeSite);
        return jdbcClient.sql(SiteQuery.FIND_BY_TYPE_SITE)
                .param("typeSite", typeSite)
                .query(siteRowMapper)
                .list();
    }

    @Override
    public List<Site> findByLocalisation(Long localisationId) {
        log.debug("Exécution de findByLocalisation({})", localisationId);
        return jdbcClient.sql(SiteQuery.FIND_BY_LOCALISATION)
                .param("localisationId", localisationId)
                .query(siteRowMapper)
                .list();
    }

    @Override
    public List<Site> findByVille(String villeUuid) {
        log.debug("Exécution de findByVille({})", villeUuid);
        return jdbcClient.sql(SiteQuery.FIND_BY_VILLE)
                .param("villeUuid", villeUuid)
                .query(siteRowMapper)
                .list();
    }

    @Override
    public List<Site> findByCommune(String communeUuid) {
        log.debug("Exécution de findByCommune({})", communeUuid);
        return jdbcClient.sql(SiteQuery.FIND_BY_COMMUNE)
                .param("communeUuid", communeUuid)
                .query(siteRowMapper)
                .list();
    }

    @Override
    public List<Site> searchByNom(String searchTerm) {
        log.debug("Exécution de searchByNom({})", searchTerm);
        return jdbcClient.sql(SiteQuery.SEARCH_BY_NOM)
                .param("searchTerm", "%" + searchTerm + "%")
                .query(siteRowMapper)
                .list();
    }

    @Override
    public boolean existsByNomAndLocalisation(String nom, Long localisationId) {
        log.debug("Exécution de existsByNomAndLocalisation({}, {})", nom, localisationId);
        Integer count = jdbcClient.sql(SiteQuery.EXISTS_BY_NOM_AND_LOCALISATION)
                .param("nom", nom)
                .param("localisationId", localisationId)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByNomAndLocalisationExcludingUuid(String nom, Long localisationId, String excludeUuid) {
        log.debug("Exécution de existsByNomAndLocalisationExcludingUuid({}, {}, {})", nom, localisationId, excludeUuid);
        Integer count = jdbcClient.sql(SiteQuery.EXISTS_BY_NOM_AND_LOCALISATION_EXCLUDING_UUID)
                .param("nom", nom)
                .param("localisationId", localisationId)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public Site save(Site site) {
        log.debug("Exécution de save({})", site.getNom());
        return jdbcClient.sql(SiteQuery.INSERT)
                .param("localisationId", site.getLocalisationId())
                .param("nom", site.getNom())
                .param("description", site.getDescription())
                .param("typeSite", site.getTypeSite() != null ? site.getTypeSite() : "GARE_ROUTIERE")
                .param("capaciteVehicules", site.getCapaciteVehicules())
                .param("telephone", site.getTelephone())
                .param("email", site.getEmail())
                .param("horaireOuverture", site.getHoraireOuverture())
                .param("horaireFermeture", site.getHoraireFermeture())
                .param("imageUrl", site.getImageUrl())
                .param("actif", site.getActif() != null ? site.getActif() : true)
                .query((rs, rowNum) -> {
                    site.setSiteId(rs.getLong("site_id"));
                    site.setSiteUuid(rs.getString("site_uuid"));
                    site.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    site.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return site;
                })
                .single();
    }

    @Override
    public Site update(Site site) {
        log.debug("Exécution de update({})", site.getSiteUuid());
        return jdbcClient.sql(SiteQuery.UPDATE)
                .param("localisationId", site.getLocalisationId())
                .param("nom", site.getNom())
                .param("description", site.getDescription())
                .param("typeSite", site.getTypeSite())
                .param("capaciteVehicules", site.getCapaciteVehicules())
                .param("telephone", site.getTelephone())
                .param("email", site.getEmail())
                .param("horaireOuverture", site.getHoraireOuverture())
                .param("horaireFermeture", site.getHoraireFermeture())
                .param("imageUrl", site.getImageUrl())
                .param("actif", site.getActif())
                .param("uuid", site.getSiteUuid())
                .query((rs, rowNum) -> {
                    site.setSiteId(rs.getLong("site_id"));
                    site.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    site.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return site;
                })
                .single();
    }

    @Override
    public int updateActif(String uuid, boolean actif) {
        log.debug("Exécution de updateActif({}, {})", uuid, actif);
        return jdbcClient.sql(SiteQuery.UPDATE_ACTIF)
                .param("actif", actif)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(SiteQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public boolean hasDeparts(String uuid) {
        log.debug("Exécution de hasDeparts({})", uuid);
        Integer count = jdbcClient.sql(SiteQuery.HAS_DEPARTS)
                .param("uuid", uuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasArrivees(String uuid) {
        log.debug("Exécution de hasArrivees({})", uuid);
        Integer count = jdbcClient.sql(SiteQuery.HAS_ARRIVEES)
                .param("uuid", uuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(SiteQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActifs() {
        log.debug("Exécution de countActifs()");
        Long count = jdbcClient.sql(SiteQuery.COUNT_ACTIFS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}