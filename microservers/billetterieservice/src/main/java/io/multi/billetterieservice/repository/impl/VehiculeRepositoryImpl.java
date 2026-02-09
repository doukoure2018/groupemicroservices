package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Vehicule;
import io.multi.billetterieservice.query.VehiculeQuery;
import io.multi.billetterieservice.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository Vehicule utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class VehiculeRepositoryImpl implements VehiculeRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en BigDecimal (pour note_moyenne NUMERIC PostgreSQL)
     */
    private BigDecimal toBigDecimal(BigDecimal value) {
        return value;
    }

    private final RowMapper<Vehicule> rowMapper = (rs, rowNum) -> Vehicule.builder()
            // Champs de base
            .vehiculeId(rs.getLong("vehicule_id"))
            .vehiculeUuid(rs.getString("vehicule_uuid"))
            .userId(rs.getLong("user_id"))
            .typeVehiculeId(rs.getObject("type_vehicule_id", Long.class))
            .immatriculation(rs.getString("immatriculation"))
            .marque(rs.getString("marque"))
            .modele(rs.getString("modele"))
            .anneeFabrication(rs.getObject("annee_fabrication", Integer.class))
            .nombrePlaces(rs.getInt("nombre_places"))
            .nomChauffeur(rs.getString("nom_chauffeur"))
            .contactChauffeur(rs.getString("contact_chauffeur"))
            .contactProprietaire(rs.getString("contact_proprietaire"))
            .description(rs.getString("description"))
            .couleur(rs.getString("couleur"))
            .climatise(rs.getObject("climatise", Boolean.class))
            .imageUrl(rs.getString("image_url"))
            .imageData(rs.getBytes("image_data"))
            .imageType(rs.getString("image_type"))
            .documentAssuranceUrl(rs.getString("document_assurance_url"))
            .dateExpirationAssurance(rs.getObject("date_expiration_assurance", LocalDate.class))
            .documentVisiteTechniqueUrl(rs.getString("document_visite_technique_url"))
            .dateExpirationVisite(rs.getObject("date_expiration_visite", LocalDate.class))
            .statut(rs.getString("statut"))
            .noteMoyenne(rs.getBigDecimal("note_moyenne"))
            .nombreAvis(rs.getObject("nombre_avis", Integer.class))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Type de véhicule (jointure)
            .typeVehiculeUuid(rs.getString("type_vehicule_uuid"))
            .typeVehiculeLibelle(rs.getString("type_vehicule_libelle"))
            .typeVehiculeDescription(rs.getString("type_vehicule_description"))
            .typeVehiculeCapaciteMin(rs.getObject("type_vehicule_capacite_min", Integer.class))
            .typeVehiculeCapaciteMax(rs.getObject("type_vehicule_capacite_max", Integer.class))
            // Utilisateur propriétaire (jointure)
            .userUuid(rs.getString("user_uuid"))
            .userUsername(rs.getString("user_username"))
            .userFullName(rs.getString("user_full_name"))
            .userEmail(rs.getString("user_email"))
            .userPhone(rs.getString("user_phone"))
            .build();

    // ========== LECTURE ==========

    @Override
    public List<Vehicule> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(VehiculeQuery.FIND_ALL)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(VehiculeQuery.FIND_ALL_ACTIFS)
                .query(rowMapper)
                .list();
    }

    @Override
    public Optional<Vehicule> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Vehicule> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_ID)
                .param("id", id)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Vehicule> findByImmatriculation(String immatriculation) {
        log.debug("Exécution de findByImmatriculation({})", immatriculation);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_IMMATRICULATION)
                .param("immatriculation", immatriculation)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Vehicule> findByUser(Long userId) {
        log.debug("Exécution de findByUser({})", userId);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_USER)
                .param("userId", userId)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findByTypeVehicule(String typeVehiculeUuid) {
        log.debug("Exécution de findByTypeVehicule({})", typeVehiculeUuid);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_TYPE_VEHICULE)
                .param("typeVehiculeUuid", typeVehiculeUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findByStatut(String statut) {
        log.debug("Exécution de findByStatut({})", statut);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_STATUT)
                .param("statut", statut)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findByNombrePlacesMin(int nombrePlacesMin) {
        log.debug("Exécution de findByNombrePlacesMin({})", nombrePlacesMin);
        return jdbcClient.sql(VehiculeQuery.FIND_BY_NOMBRE_PLACES_MIN)
                .param("nombrePlacesMin", nombrePlacesMin)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findClimatises() {
        log.debug("Exécution de findClimatises()");
        return jdbcClient.sql(VehiculeQuery.FIND_CLIMATISES)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findAssuranceExpiree() {
        log.debug("Exécution de findAssuranceExpiree()");
        return jdbcClient.sql(VehiculeQuery.FIND_ASSURANCE_EXPIREE)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> findVisiteExpiree() {
        log.debug("Exécution de findVisiteExpiree()");
        return jdbcClient.sql(VehiculeQuery.FIND_VISITE_EXPIREE)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Vehicule> search(String searchTerm) {
        log.debug("Exécution de search({})", searchTerm);
        return jdbcClient.sql(VehiculeQuery.SEARCH)
                .param("searchTerm", "%" + searchTerm.toLowerCase() + "%")
                .query(rowMapper)
                .list();
    }

    // ========== VÉRIFICATION ==========

    @Override
    public boolean existsByImmatriculation(String immatriculation) {
        log.debug("Exécution de existsByImmatriculation({})", immatriculation);
        Integer count = jdbcClient.sql(VehiculeQuery.EXISTS_BY_IMMATRICULATION)
                .param("immatriculation", immatriculation)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByImmatriculationExcludingUuid(String immatriculation, String excludeUuid) {
        log.debug("Exécution de existsByImmatriculationExcludingUuid({}, {})", immatriculation, excludeUuid);
        Integer count = jdbcClient.sql(VehiculeQuery.EXISTS_BY_IMMATRICULATION_EXCLUDING_UUID)
                .param("immatriculation", immatriculation)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasOffres(String uuid) {
        log.debug("Exécution de hasOffres({})", uuid);
        try {
            Integer count = jdbcClient.sql(VehiculeQuery.HAS_OFFRES)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les offres pour le véhicule {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    // ========== ÉCRITURE ==========

    @Override
    public Vehicule save(Vehicule vehicule) {
        log.debug("Exécution de save({})", vehicule.getImmatriculation());
        return jdbcClient.sql(VehiculeQuery.INSERT)
                .param("userId", vehicule.getUserId())
                .param("typeVehiculeId", vehicule.getTypeVehiculeId())
                .param("immatriculation", vehicule.getImmatriculation())
                .param("marque", vehicule.getMarque())
                .param("modele", vehicule.getModele())
                .param("anneeFabrication", vehicule.getAnneeFabrication())
                .param("nombrePlaces", vehicule.getNombrePlaces())
                .param("nomChauffeur", vehicule.getNomChauffeur())
                .param("contactChauffeur", vehicule.getContactChauffeur())
                .param("contactProprietaire", vehicule.getContactProprietaire())
                .param("description", vehicule.getDescription())
                .param("couleur", vehicule.getCouleur())
                .param("climatise", vehicule.getClimatise() != null ? vehicule.getClimatise() : false)
                .param("imageUrl", vehicule.getImageUrl())
                .param("documentAssuranceUrl", vehicule.getDocumentAssuranceUrl())
                .param("dateExpirationAssurance", vehicule.getDateExpirationAssurance())
                .param("documentVisiteTechniqueUrl", vehicule.getDocumentVisiteTechniqueUrl())
                .param("dateExpirationVisite", vehicule.getDateExpirationVisite())
                .param("statut", vehicule.getStatut() != null ? vehicule.getStatut() : "ACTIF")
                .query((rs, rowNum) -> {
                    vehicule.setVehiculeId(rs.getLong("vehicule_id"));
                    vehicule.setVehiculeUuid(rs.getString("vehicule_uuid"));
                    vehicule.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    vehicule.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return vehicule;
                })
                .single();
    }

    @Override
    public Vehicule update(Vehicule vehicule) {
        log.debug("Exécution de update({})", vehicule.getVehiculeUuid());
        return jdbcClient.sql(VehiculeQuery.UPDATE)
                .param("typeVehiculeId", vehicule.getTypeVehiculeId())
                .param("immatriculation", vehicule.getImmatriculation())
                .param("marque", vehicule.getMarque())
                .param("modele", vehicule.getModele())
                .param("anneeFabrication", vehicule.getAnneeFabrication())
                .param("nombrePlaces", vehicule.getNombrePlaces())
                .param("nomChauffeur", vehicule.getNomChauffeur())
                .param("contactChauffeur", vehicule.getContactChauffeur())
                .param("contactProprietaire", vehicule.getContactProprietaire())
                .param("description", vehicule.getDescription())
                .param("couleur", vehicule.getCouleur())
                .param("climatise", vehicule.getClimatise())
                .param("imageUrl", vehicule.getImageUrl())
                .param("documentAssuranceUrl", vehicule.getDocumentAssuranceUrl())
                .param("dateExpirationAssurance", vehicule.getDateExpirationAssurance())
                .param("documentVisiteTechniqueUrl", vehicule.getDocumentVisiteTechniqueUrl())
                .param("dateExpirationVisite", vehicule.getDateExpirationVisite())
                .param("statut", vehicule.getStatut())
                .param("uuid", vehicule.getVehiculeUuid())
                .query((rs, rowNum) -> {
                    vehicule.setVehiculeId(rs.getLong("vehicule_id"));
                    vehicule.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    vehicule.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return vehicule;
                })
                .single();
    }

    @Override
    public int updateStatut(String uuid, String statut) {
        log.debug("Exécution de updateStatut({}, {})", uuid, statut);
        return jdbcClient.sql(VehiculeQuery.UPDATE_STATUT)
                .param("statut", statut)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int updateImage(String uuid, String imageUrl, byte[] imageData, String imageType) {
        log.debug("Exécution de updateImage({})", uuid);
        return jdbcClient.sql(VehiculeQuery.UPDATE_IMAGE)
                .param("imageUrl", imageUrl)
                .param("imageData", imageData)
                .param("imageType", imageType)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(VehiculeQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    // ========== COMPTAGE ==========

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(VehiculeQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByStatut(String statut) {
        log.debug("Exécution de countByStatut({})", statut);
        Long count = jdbcClient.sql(VehiculeQuery.COUNT_BY_STATUT)
                .param("statut", statut)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByUser(Long userId) {
        log.debug("Exécution de countByUser({})", userId);
        Long count = jdbcClient.sql(VehiculeQuery.COUNT_BY_USER)
                .param("userId", userId)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByTypeVehicule(String typeVehiculeUuid) {
        log.debug("Exécution de countByTypeVehicule({})", typeVehiculeUuid);
        Long count = jdbcClient.sql(VehiculeQuery.COUNT_BY_TYPE_VEHICULE)
                .param("typeVehiculeUuid", typeVehiculeUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}