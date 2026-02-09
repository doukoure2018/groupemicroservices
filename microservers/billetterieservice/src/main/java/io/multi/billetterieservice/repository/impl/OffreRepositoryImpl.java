package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.query.OffreQuery;
import io.multi.billetterieservice.repository.OffreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository Offre utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class OffreRepositoryImpl implements OffreRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en Double (pour les coordonnées NUMERIC PostgreSQL)
     */
    private Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    private final RowMapper<Offre> rowMapper = (rs, rowNum) -> Offre.builder()
            // Champs de base
            .offreId(rs.getLong("offre_id"))
            .offreUuid(rs.getString("offre_uuid"))
            .tokenOffre(rs.getString("token_offre"))
            .trajetId(rs.getLong("trajet_id"))
            .vehiculeId(rs.getLong("vehicule_id"))
            .userId(rs.getLong("user_id"))
            .dateDepart(rs.getObject("date_depart", LocalDate.class))
            .heureDepart(rs.getObject("heure_depart", LocalTime.class))
            .heureArriveeEstimee(rs.getObject("heure_arrivee_estimee", LocalTime.class))
            .nombrePlacesTotal(rs.getInt("nombre_places_total"))
            .nombrePlacesDisponibles(rs.getInt("nombre_places_disponibles"))
            .nombrePlacesReservees(rs.getObject("nombre_places_reservees", Integer.class))
            .montant(rs.getBigDecimal("montant"))
            .montantPromotion(rs.getBigDecimal("montant_promotion"))
            .devise(rs.getString("devise"))
            .statut(rs.getString("statut"))
            .niveauRemplissage(rs.getObject("niveau_remplissage", Integer.class))
            .pointRendezvous(rs.getString("point_rencontre"))
            .conditions(rs.getString("conditions"))
            .annulationAutorisee(rs.getObject("annulation_autorisee", Boolean.class))
            .delaiAnnulationHeures(rs.getObject("delai_annulation_heures", Integer.class))
            .datePublication(rs.getObject("date_publication", OffsetDateTime.class))
            .dateCloture(rs.getObject("date_cloture", OffsetDateTime.class))
            .dateDepartEffectif(rs.getObject("date_depart_effectif", OffsetDateTime.class))
            .dateArriveeEffective(rs.getObject("date_arrivee_effective", OffsetDateTime.class))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Trajet
            .trajetUuid(rs.getString("trajet_uuid"))
            .trajetLibelle(rs.getString("trajet_libelle"))
            .trajetDistanceKm(rs.getBigDecimal("trajet_distance_km"))
            .trajetDureeMinutes(rs.getObject("trajet_duree_minutes", Integer.class))
            // Départ
            .departUuid(rs.getString("depart_uuid"))
            .departLibelle(rs.getString("depart_libelle"))
            .siteDepart(rs.getString("site_depart"))
            .villeDepartLibelle(rs.getString("ville_depart_libelle"))
            .villeDepartUuid(rs.getString("ville_depart_uuid"))
            .regionDepartLibelle(rs.getString("region_depart_libelle"))
            // Arrivée
            .arriveeUuid(rs.getString("arrivee_uuid"))
            .arriveeLibelle(rs.getString("arrivee_libelle"))
            .siteArrivee(rs.getString("site_arrivee"))
            .villeArriveeLibelle(rs.getString("ville_arrivee_libelle"))
            .villeArriveeUuid(rs.getString("ville_arrivee_uuid"))
            .regionArriveeLibelle(rs.getString("region_arrivee_libelle"))
            // Véhicule
            .vehiculeUuid(rs.getString("vehicule_uuid"))
            .vehiculeImmatriculation(rs.getString("vehicule_immatriculation"))
            .vehiculeMarque(rs.getString("vehicule_marque"))
            .vehiculeModele(rs.getString("vehicule_modele"))
            .vehiculeCouleur(rs.getString("vehicule_couleur"))
            .vehiculeNombrePlaces(rs.getObject("vehicule_nombre_places", Integer.class))
            .vehiculeClimatise(rs.getObject("vehicule_climatise", Boolean.class))
            .vehiculeStatut(rs.getString("vehicule_statut"))
            .typeVehiculeLibelle(rs.getString("type_vehicule_libelle"))
            .nomChauffeur(rs.getString("nom_chauffeur"))
            .contactChauffeur(rs.getString("contact_chauffeur"))
            // Utilisateur
            .userUuid(rs.getString("user_uuid"))
            .userUsername(rs.getString("user_username"))
            .userFullName(rs.getString("user_full_name"))
            .userEmail(rs.getString("user_email"))
            .userPhone(rs.getString("user_phone"))
            .build();

    // ========== LECTURE ==========

    @Override
    public List<Offre> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(OffreQuery.FIND_ALL)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findAllOuvertes() {
        log.debug("Exécution de findAllOuvertes()");
        return jdbcClient.sql(OffreQuery.FIND_ALL_OUVERTES)
                .query(rowMapper)
                .list();
    }

    @Override
    public Optional<Offre> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(OffreQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Offre> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(OffreQuery.FIND_BY_ID)
                .param("id", id)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Offre> findByToken(String token) {
        log.debug("Exécution de findByToken({})", token);
        return jdbcClient.sql(OffreQuery.FIND_BY_TOKEN)
                .param("token", token)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Offre> findByTrajet(String trajetUuid) {
        log.debug("Exécution de findByTrajet({})", trajetUuid);
        return jdbcClient.sql(OffreQuery.FIND_BY_TRAJET)
                .param("trajetUuid", trajetUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByVehicule(String vehiculeUuid) {
        log.debug("Exécution de findByVehicule({})", vehiculeUuid);
        return jdbcClient.sql(OffreQuery.FIND_BY_VEHICULE)
                .param("vehiculeUuid", vehiculeUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByUser(Long userId) {
        log.debug("Exécution de findByUser({})", userId);
        return jdbcClient.sql(OffreQuery.FIND_BY_USER)
                .param("userId", userId)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByStatut(String statut) {
        log.debug("Exécution de findByStatut({})", statut);
        return jdbcClient.sql(OffreQuery.FIND_BY_STATUT)
                .param("statut", statut)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByDateDepart(LocalDate dateDepart) {
        log.debug("Exécution de findByDateDepart({})", dateDepart);
        return jdbcClient.sql(OffreQuery.FIND_BY_DATE_DEPART)
                .param("dateDepart", dateDepart)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByVilles(String villeDepartUuid, String villeArriveeUuid) {
        log.debug("Exécution de findByVilles({}, {})", villeDepartUuid, villeArriveeUuid);
        return jdbcClient.sql(OffreQuery.FIND_BY_VILLES)
                .param("villeDepartUuid", villeDepartUuid)
                .param("villeArriveeUuid", villeArriveeUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByVillesAndDate(String villeDepartUuid, String villeArriveeUuid, LocalDate dateDepart) {
        log.debug("Exécution de findByVillesAndDate({}, {}, {})", villeDepartUuid, villeArriveeUuid, dateDepart);
        return jdbcClient.sql(OffreQuery.FIND_BY_VILLES_AND_DATE)
                .param("villeDepartUuid", villeDepartUuid)
                .param("villeArriveeUuid", villeArriveeUuid)
                .param("dateDepart", dateDepart)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findAvecPlacesDisponibles(int nombrePlaces) {
        log.debug("Exécution de findAvecPlacesDisponibles({})", nombrePlaces);
        return jdbcClient.sql(OffreQuery.FIND_AVEC_PLACES_DISPONIBLES)
                .param("nombrePlaces", nombrePlaces)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByVilleDepart(String villeDepartUuid) {
        log.debug("Exécution de findByVilleDepart({})", villeDepartUuid);
        return jdbcClient.sql(OffreQuery.FIND_BY_VILLE_DEPART)
                .param("villeDepartUuid", villeDepartUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findByVilleArrivee(String villeArriveeUuid) {
        log.debug("Exécution de findByVilleArrivee({})", villeArriveeUuid);
        return jdbcClient.sql(OffreQuery.FIND_BY_VILLE_ARRIVEE)
                .param("villeArriveeUuid", villeArriveeUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findAujourdHui() {
        log.debug("Exécution de findAujourdHui()");
        return jdbcClient.sql(OffreQuery.FIND_AUJOURD_HUI)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findAVenir() {
        log.debug("Exécution de findAVenir()");
        return jdbcClient.sql(OffreQuery.FIND_A_VENIR)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findPassees() {
        log.debug("Exécution de findPassees()");
        return jdbcClient.sql(OffreQuery.FIND_PASSEES)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> findEnPromotion() {
        log.debug("Exécution de findEnPromotion()");
        return jdbcClient.sql(OffreQuery.FIND_EN_PROMOTION)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Offre> search(String searchTerm) {
        log.debug("Exécution de search({})", searchTerm);
        return jdbcClient.sql(OffreQuery.SEARCH)
                .param("searchTerm", "%" + searchTerm.toLowerCase() + "%")
                .query(rowMapper)
                .list();
    }

    // ========== VÉRIFICATION ==========

    @Override
    public boolean existsByToken(String token) {
        log.debug("Exécution de existsByToken({})", token);
        Integer count = jdbcClient.sql(OffreQuery.EXISTS_BY_TOKEN)
                .param("token", token)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsOffreActiveVehiculeDate(String vehiculeUuid, LocalDate dateDepart) {
        log.debug("Exécution de existsOffreActiveVehiculeDate({}, {})", vehiculeUuid, dateDepart);
        Integer count = jdbcClient.sql(OffreQuery.EXISTS_OFFRE_ACTIVE_VEHICULE_DATE)
                .param("vehiculeUuid", vehiculeUuid)
                .param("dateDepart", dateDepart)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsOffreActiveVehiculeDateExcluding(String vehiculeUuid, LocalDate dateDepart, String excludeUuid) {
        log.debug("Exécution de existsOffreActiveVehiculeDateExcluding({}, {}, {})", vehiculeUuid, dateDepart, excludeUuid);
        Integer count = jdbcClient.sql(OffreQuery.EXISTS_OFFRE_ACTIVE_VEHICULE_DATE_EXCLUDING)
                .param("vehiculeUuid", vehiculeUuid)
                .param("dateDepart", dateDepart)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasReservations(String uuid) {
        log.debug("Exécution de hasReservations({})", uuid);
        try {
            Integer count = jdbcClient.sql(OffreQuery.HAS_RESERVATIONS)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les réservations pour l'offre {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    @Override
    public int countReservationsConfirmees(String uuid) {
        log.debug("Exécution de countReservationsConfirmees({})", uuid);
        try {
            Integer count = jdbcClient.sql(OffreQuery.COUNT_RESERVATIONS_CONFIRMEES)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Impossible de compter les réservations pour l'offre {}: {}", uuid, e.getMessage());
            return 0;
        }
    }

    // ========== ÉCRITURE ==========

    @Override
    public Offre save(Offre offre) {
        log.debug("Exécution de save() pour trajet {} véhicule {}", offre.getTrajetId(), offre.getVehiculeId());
        return jdbcClient.sql(OffreQuery.INSERT)
                .param("tokenOffre", offre.getTokenOffre())
                .param("trajetId", offre.getTrajetId())
                .param("vehiculeId", offre.getVehiculeId())
                .param("userId", offre.getUserId())
                .param("dateDepart", offre.getDateDepart())
                .param("heureDepart", offre.getHeureDepart())
                .param("heureArriveeEstimee", offre.getHeureArriveeEstimee())
                .param("nombrePlacesTotal", offre.getNombrePlacesTotal())
                .param("nombrePlacesDisponibles", offre.getNombrePlacesDisponibles())
                .param("nombrePlacesReservees", offre.getNombrePlacesReservees() != null ? offre.getNombrePlacesReservees() : 0)
                .param("montant", offre.getMontant())
                .param("montantPromotion", offre.getMontantPromotion())
                .param("devise", offre.getDevise() != null ? offre.getDevise() : "GNF")
                .param("statut", offre.getStatut() != null ? offre.getStatut() : "EN_ATTENTE")
                .param("niveauRemplissage", offre.getNiveauRemplissage() != null ? offre.getNiveauRemplissage() : 0)
                .param("pointRendezvous", offre.getPointRendezvous())
                .param("conditions", offre.getConditions())
                .param("annulationAutorisee", offre.getAnnulationAutorisee() != null ? offre.getAnnulationAutorisee() : true)
                .param("delaiAnnulationHeures", offre.getDelaiAnnulationHeures() != null ? offre.getDelaiAnnulationHeures() : 24)
                .query((rs, rowNum) -> {
                    offre.setOffreId(rs.getLong("offre_id"));
                    offre.setOffreUuid(rs.getString("offre_uuid"));
                    offre.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    offre.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return offre;
                })
                .single();
    }

    @Override
    public Offre update(Offre offre) {
        log.debug("Exécution de update({})", offre.getOffreUuid());
        return jdbcClient.sql(OffreQuery.UPDATE)
                .param("dateDepart", offre.getDateDepart())
                .param("heureDepart", offre.getHeureDepart())
                .param("heureArriveeEstimee", offre.getHeureArriveeEstimee())
                .param("nombrePlacesTotal", offre.getNombrePlacesTotal())
                .param("montant", offre.getMontant())
                .param("montantPromotion", offre.getMontantPromotion())
                .param("devise", offre.getDevise())
                .param("pointRendezvous", offre.getPointRendezvous())
                .param("conditions", offre.getConditions())
                .param("annulationAutorisee", offre.getAnnulationAutorisee())
                .param("delaiAnnulationHeures", offre.getDelaiAnnulationHeures())
                .param("uuid", offre.getOffreUuid())
                .query((rs, rowNum) -> {
                    offre.setOffreId(rs.getLong("offre_id"));
                    offre.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    offre.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return offre;
                })
                .single();
    }

    @Override
    public int updateStatut(String uuid, String statut) {
        log.debug("Exécution de updateStatut({}, {})", uuid, statut);
        return jdbcClient.sql(OffreQuery.UPDATE_STATUT)
                .param("statut", statut)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int updatePlaces(String uuid, int nombrePlacesDisponibles, int nombrePlacesReservees, int niveauRemplissage) {
        log.debug("Exécution de updatePlaces({}, {}, {}, {})", uuid, nombrePlacesDisponibles, nombrePlacesReservees, niveauRemplissage);
        return jdbcClient.sql(OffreQuery.UPDATE_PLACES)
                .param("nombrePlacesDisponibles", nombrePlacesDisponibles)
                .param("nombrePlacesReservees", nombrePlacesReservees)
                .param("niveauRemplissage", niveauRemplissage)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int updatePromotion(String uuid, BigDecimal montantPromotion) {
        log.debug("Exécution de updatePromotion({}, {})", uuid, montantPromotion);
        return jdbcClient.sql(OffreQuery.UPDATE_PROMOTION)
                .param("montantPromotion", montantPromotion)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int updateDatesEffectives(String uuid, OffsetDateTime dateDepartEffectif, OffsetDateTime dateArriveeEffective) {
        log.debug("Exécution de updateDatesEffectives({}, {}, {})", uuid, dateDepartEffectif, dateArriveeEffective);
        return jdbcClient.sql(OffreQuery.UPDATE_DATES_EFFECTIVES)
                .param("dateDepartEffectif", dateDepartEffectif)
                .param("dateArriveeEffective", dateArriveeEffective)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int cloturer(String uuid) {
        log.debug("Exécution de cloturer({})", uuid);
        return jdbcClient.sql(OffreQuery.CLOTURER)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(OffreQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    // ========== COMPTAGE ==========

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(OffreQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByStatut(String statut) {
        log.debug("Exécution de countByStatut({})", statut);
        Long count = jdbcClient.sql(OffreQuery.COUNT_BY_STATUT)
                .param("statut", statut)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByUser(Long userId) {
        log.debug("Exécution de countByUser({})", userId);
        Long count = jdbcClient.sql(OffreQuery.COUNT_BY_USER)
                .param("userId", userId)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByTrajet(String trajetUuid) {
        log.debug("Exécution de countByTrajet({})", trajetUuid);
        Long count = jdbcClient.sql(OffreQuery.COUNT_BY_TRAJET)
                .param("trajetUuid", trajetUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByVehicule(String vehiculeUuid) {
        log.debug("Exécution de countByVehicule({})", vehiculeUuid);
        Long count = jdbcClient.sql(OffreQuery.COUNT_BY_VEHICULE)
                .param("vehiculeUuid", vehiculeUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countAujourdHui() {
        log.debug("Exécution de countAujourdHui()");
        Long count = jdbcClient.sql(OffreQuery.COUNT_AUJOURD_HUI)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countOuvertes() {
        log.debug("Exécution de countOuvertes()");
        Long count = jdbcClient.sql(OffreQuery.COUNT_OUVERTES)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}