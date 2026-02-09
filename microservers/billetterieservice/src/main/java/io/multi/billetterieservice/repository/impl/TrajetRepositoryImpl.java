package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Trajet;
import io.multi.billetterieservice.query.TrajetQuery;
import io.multi.billetterieservice.repository.TrajetRepository;
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
 * Implémentation du repository Trajet utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class TrajetRepositoryImpl implements TrajetRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en Double (pour les coordonnées NUMERIC PostgreSQL)
     */
    private Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    /**
     * RowMapper pour convertir les ResultSet en objets Trajet
     */
    private final RowMapper<Trajet> trajetRowMapper = (rs, rowNum) -> Trajet.builder()
            // Champs de base
            .trajetId(rs.getLong("trajet_id"))
            .trajetUuid(rs.getString("trajet_uuid"))
            .departId(rs.getLong("depart_id"))
            .arriveeId(rs.getLong("arrivee_id"))
            .userId(rs.getLong("user_id"))
            .libelleTrajet(rs.getString("libelle_trajet"))
            .distanceKm(rs.getBigDecimal("distance_km"))
            .dureeEstimeeMinutes(rs.getObject("duree_estimee_minutes", Integer.class))
            .montantBase(rs.getBigDecimal("montant_base"))
            .montantBagages(rs.getBigDecimal("montant_bagages"))
            .devise(rs.getString("devise"))
            .description(rs.getString("description"))
            .instructions(rs.getString("instructions"))
            .actif(rs.getBoolean("actif"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Départ
            .departUuid(rs.getString("depart_uuid"))
            .departLibelle(rs.getString("depart_libelle"))
            .departSiteId(rs.getLong("depart_site_id"))
            .departSiteUuid(rs.getString("depart_site_uuid"))
            .departSiteNom(rs.getString("depart_site_nom"))
            .departAdresseComplete(rs.getString("depart_adresse_complete"))
            .departLatitude(toDouble(rs.getBigDecimal("depart_latitude")))
            .departLongitude(toDouble(rs.getBigDecimal("depart_longitude")))
            .departVilleUuid(rs.getString("depart_ville_uuid"))
            .departVilleLibelle(rs.getString("depart_ville_libelle"))
            .departRegionLibelle(rs.getString("depart_region_libelle"))
            // Arrivée
            .arriveeUuid(rs.getString("arrivee_uuid"))
            .arriveeLibelle(rs.getString("arrivee_libelle"))
            .arriveeSiteId(rs.getLong("arrivee_site_id"))
            .arriveeSiteUuid(rs.getString("arrivee_site_uuid"))
            .arriveeSiteNom(rs.getString("arrivee_site_nom"))
            .arriveeAdresseComplete(rs.getString("arrivee_adresse_complete"))
            .arriveeLatitude(toDouble(rs.getBigDecimal("arrivee_latitude")))
            .arriveeLongitude(toDouble(rs.getBigDecimal("arrivee_longitude")))
            .arriveeVilleUuid(rs.getString("arrivee_ville_uuid"))
            .arriveeVilleLibelle(rs.getString("arrivee_ville_libelle"))
            .arriveeRegionLibelle(rs.getString("arrivee_region_libelle"))
            // Utilisateur
            .userUuid(rs.getString("user_uuid"))
            .userUsername(rs.getString("user_username"))
            .userFullName(rs.getString("user_full_name"))
            .build();

    // ========== LECTURE ==========

    @Override
    public List<Trajet> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(TrajetQuery.FIND_ALL)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(TrajetQuery.FIND_ALL_ACTIFS)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public Optional<Trajet> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(trajetRowMapper)
                .optional();
    }

    @Override
    public Optional<Trajet> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(TrajetQuery.FIND_BY_ID)
                .param("id", id)
                .query(trajetRowMapper)
                .optional();
    }

    @Override
    public List<Trajet> findByDepart(Long departId) {
        log.debug("Exécution de findByDepart({})", departId);
        return jdbcClient.sql(TrajetQuery.FIND_BY_DEPART)
                .param("departId", departId)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findByDepartUuid(String departUuid) {
        log.debug("Exécution de findByDepartUuid({})", departUuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_DEPART_UUID)
                .param("departUuid", departUuid)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findByArrivee(Long arriveeId) {
        log.debug("Exécution de findByArrivee({})", arriveeId);
        return jdbcClient.sql(TrajetQuery.FIND_BY_ARRIVEE)
                .param("arriveeId", arriveeId)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findByArriveeUuid(String arriveeUuid) {
        log.debug("Exécution de findByArriveeUuid({})", arriveeUuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_ARRIVEE_UUID)
                .param("arriveeUuid", arriveeUuid)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public Optional<Trajet> findByDepartAndArrivee(String departUuid, String arriveeUuid) {
        log.debug("Exécution de findByDepartAndArrivee({}, {})", departUuid, arriveeUuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_DEPART_AND_ARRIVEE)
                .param("departUuid", departUuid)
                .param("arriveeUuid", arriveeUuid)
                .query(trajetRowMapper)
                .optional();
    }

    @Override
    public List<Trajet> findByVilleDepart(String villeUuid) {
        log.debug("Exécution de findByVilleDepart({})", villeUuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_VILLE_DEPART)
                .param("villeUuid", villeUuid)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findByVilleArrivee(String villeUuid) {
        log.debug("Exécution de findByVilleArrivee({})", villeUuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_VILLE_ARRIVEE)
                .param("villeUuid", villeUuid)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findByVilles(String villeDepartUuid, String villeArriveeUuid) {
        log.debug("Exécution de findByVilles({}, {})", villeDepartUuid, villeArriveeUuid);
        return jdbcClient.sql(TrajetQuery.FIND_BY_VILLES)
                .param("villeDepartUuid", villeDepartUuid)
                .param("villeArriveeUuid", villeArriveeUuid)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> findByUser(Long userId) {
        log.debug("Exécution de findByUser({})", userId);
        return jdbcClient.sql(TrajetQuery.FIND_BY_USER)
                .param("userId", userId)
                .query(trajetRowMapper)
                .list();
    }

    @Override
    public List<Trajet> searchByLibelle(String searchTerm) {
        log.debug("Exécution de searchByLibelle({})", searchTerm);
        return jdbcClient.sql(TrajetQuery.SEARCH_BY_LIBELLE)
                .param("searchTerm", "%" + searchTerm.toLowerCase() + "%")
                .query(trajetRowMapper)
                .list();
    }

    // ========== VÉRIFICATION ==========

    @Override
    public boolean existsByDepartAndArrivee(String departUuid, String arriveeUuid) {
        log.debug("Exécution de existsByDepartAndArrivee({}, {})", departUuid, arriveeUuid);
        Integer count = jdbcClient.sql(TrajetQuery.EXISTS_BY_DEPART_AND_ARRIVEE)
                .param("departUuid", departUuid)
                .param("arriveeUuid", arriveeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByDepartAndArriveeExcludingUuid(String departUuid, String arriveeUuid, String excludeUuid) {
        log.debug("Exécution de existsByDepartAndArriveeExcludingUuid({}, {}, {})", departUuid, arriveeUuid, excludeUuid);
        Integer count = jdbcClient.sql(TrajetQuery.EXISTS_BY_DEPART_AND_ARRIVEE_EXCLUDING_UUID)
                .param("departUuid", departUuid)
                .param("arriveeUuid", arriveeUuid)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasOffres(String uuid) {
        log.debug("Exécution de hasOffres({})", uuid);
        try {
            Integer count = jdbcClient.sql(TrajetQuery.HAS_OFFRES)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les offres pour le trajet {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    // ========== ÉCRITURE ==========

    @Override
    public Trajet save(Trajet trajet) {
        log.debug("Exécution de save({})", trajet.getLibelleTrajet());
        return jdbcClient.sql(TrajetQuery.INSERT)
                .param("departId", trajet.getDepartId())
                .param("arriveeId", trajet.getArriveeId())
                .param("userId", trajet.getUserId())
                .param("libelleTrajet", trajet.getLibelleTrajet())
                .param("distanceKm", trajet.getDistanceKm())
                .param("dureeEstimeeMinutes", trajet.getDureeEstimeeMinutes())
                .param("montantBase", trajet.getMontantBase())
                .param("montantBagages", trajet.getMontantBagages() != null ? trajet.getMontantBagages() : BigDecimal.ZERO)
                .param("devise", trajet.getDevise() != null ? trajet.getDevise() : "GNF")
                .param("description", trajet.getDescription())
                .param("instructions", trajet.getInstructions())
                .param("actif", trajet.getActif() != null ? trajet.getActif() : true)
                .query((rs, rowNum) -> {
                    trajet.setTrajetId(rs.getLong("trajet_id"));
                    trajet.setTrajetUuid(rs.getString("trajet_uuid"));
                    trajet.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    trajet.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return trajet;
                })
                .single();
    }

    @Override
    public Trajet update(Trajet trajet) {
        log.debug("Exécution de update({})", trajet.getTrajetUuid());
        return jdbcClient.sql(TrajetQuery.UPDATE)
                .param("departId", trajet.getDepartId())
                .param("arriveeId", trajet.getArriveeId())
                .param("libelleTrajet", trajet.getLibelleTrajet())
                .param("distanceKm", trajet.getDistanceKm())
                .param("dureeEstimeeMinutes", trajet.getDureeEstimeeMinutes())
                .param("montantBase", trajet.getMontantBase())
                .param("montantBagages", trajet.getMontantBagages())
                .param("devise", trajet.getDevise())
                .param("description", trajet.getDescription())
                .param("instructions", trajet.getInstructions())
                .param("actif", trajet.getActif())
                .param("uuid", trajet.getTrajetUuid())
                .query((rs, rowNum) -> {
                    trajet.setTrajetId(rs.getLong("trajet_id"));
                    trajet.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    trajet.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return trajet;
                })
                .single();
    }

    @Override
    public int updateActif(String uuid, boolean actif) {
        log.debug("Exécution de updateActif({}, {})", uuid, actif);
        return jdbcClient.sql(TrajetQuery.UPDATE_ACTIF)
                .param("actif", actif)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public Trajet updateMontants(String uuid, BigDecimal montantBase, BigDecimal montantBagages) {
        log.debug("Exécution de updateMontants({}, {}, {})", uuid, montantBase, montantBagages);
        jdbcClient.sql(TrajetQuery.UPDATE_MONTANTS)
                .param("montantBase", montantBase)
                .param("montantBagages", montantBagages)
                .param("uuid", uuid)
                .update();
        return findByUuid(uuid).orElse(null);
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(TrajetQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    // ========== COMPTAGE ==========

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(TrajetQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActifs() {
        log.debug("Exécution de countActifs()");
        Long count = jdbcClient.sql(TrajetQuery.COUNT_ACTIFS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByDepart(String departUuid) {
        log.debug("Exécution de countByDepart({})", departUuid);
        Long count = jdbcClient.sql(TrajetQuery.COUNT_BY_DEPART)
                .param("departUuid", departUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByArrivee(String arriveeUuid) {
        log.debug("Exécution de countByArrivee({})", arriveeUuid);
        Long count = jdbcClient.sql(TrajetQuery.COUNT_BY_ARRIVEE)
                .param("arriveeUuid", arriveeUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}