package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.Partenaire;
import io.multi.billetterieservice.query.PartenaireQuery;
import io.multi.billetterieservice.repository.PartenaireRepository;
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
 * Implémentation du repository Partenaire utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class PartenaireRepositoryImpl implements PartenaireRepository {

    private final JdbcClient jdbcClient;

    /**
     * Convertit BigDecimal en Double (pour les coordonnées NUMERIC PostgreSQL)
     */
    private Double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    private final RowMapper<Partenaire> rowMapper = (rs, rowNum) -> Partenaire.builder()
            // Champs de base
            .partenaireId(rs.getLong("partenaire_id"))
            .partenaireUuid(rs.getString("partenaire_uuid"))
            .localisationId(rs.getObject("localisation_id", Long.class))
            .nom(rs.getString("nom"))
            .typePartenaire(rs.getString("type_partenaire"))
            .raisonSociale(rs.getString("raison_sociale"))
            .numeroRegistre(rs.getString("numero_registre"))
            .telephone(rs.getString("telephone"))
            .email(rs.getString("email"))
            .adresse(rs.getString("adresse"))
            .logoUrl(rs.getString("logo_url"))
            .commissionPourcentage(rs.getBigDecimal("commission_pourcentage"))
            .commissionFixe(rs.getBigDecimal("commission_fixe"))
            .responsableNom(rs.getString("responsable_nom"))
            .responsableTelephone(rs.getString("responsable_telephone"))
            .statut(rs.getString("statut"))
            .dateDebutPartenariat(rs.getObject("date_debut_partenariat", LocalDate.class))
            .dateFinPartenariat(rs.getObject("date_fin_partenariat", LocalDate.class))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            // Localisation (jointure)
            .localisationUuid(rs.getString("localisation_uuid"))
            .localisationAdresseComplete(rs.getString("localisation_adresse_complete"))
            .localisationLatitude(toDouble(rs.getBigDecimal("localisation_latitude")))
            .localisationLongitude(toDouble(rs.getBigDecimal("localisation_longitude")))
            .quartierLibelle(rs.getString("quartier_libelle"))
            .communeLibelle(rs.getString("commune_libelle"))
            .villeLibelle(rs.getString("ville_libelle"))
            .villeUuid(rs.getString("ville_uuid"))
            .regionLibelle(rs.getString("region_libelle"))
            .build();

    // ========== LECTURE ==========

    @Override
    public List<Partenaire> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(PartenaireQuery.FIND_ALL)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(PartenaireQuery.FIND_ALL_ACTIFS)
                .query(rowMapper)
                .list();
    }

    @Override
    public Optional<Partenaire> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Partenaire> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_ID)
                .param("id", id)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Partenaire> findByNom(String nom) {
        log.debug("Exécution de findByNom({})", nom);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_NOM)
                .param("nom", nom)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Partenaire> findByType(String typePartenaire) {
        log.debug("Exécution de findByType({})", typePartenaire);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_TYPE)
                .param("typePartenaire", typePartenaire)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> findByStatut(String statut) {
        log.debug("Exécution de findByStatut({})", statut);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_STATUT)
                .param("statut", statut)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> findByVille(String villeUuid) {
        log.debug("Exécution de findByVille({})", villeUuid);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_VILLE)
                .param("villeUuid", villeUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> findByRegion(String regionUuid) {
        log.debug("Exécution de findByRegion({})", regionUuid);
        return jdbcClient.sql(PartenaireQuery.FIND_BY_REGION)
                .param("regionUuid", regionUuid)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> search(String searchTerm) {
        log.debug("Exécution de search({})", searchTerm);
        return jdbcClient.sql(PartenaireQuery.SEARCH)
                .param("searchTerm", "%" + searchTerm.toLowerCase() + "%")
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> findPartenariatsExpires() {
        log.debug("Exécution de findPartenariatsExpires()");
        return jdbcClient.sql(PartenaireQuery.FIND_PARTENARIATS_EXPIRES)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<Partenaire> findPartenariatsExpirantBientot() {
        log.debug("Exécution de findPartenariatsExpirantBientot()");
        return jdbcClient.sql(PartenaireQuery.FIND_PARTENARIATS_EXPIRANT_BIENTOT)
                .query(rowMapper)
                .list();
    }

    // ========== VÉRIFICATION ==========

    @Override
    public boolean existsByNom(String nom) {
        log.debug("Exécution de existsByNom({})", nom);
        Integer count = jdbcClient.sql(PartenaireQuery.EXISTS_BY_NOM)
                .param("nom", nom)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByNomExcludingUuid(String nom, String excludeUuid) {
        log.debug("Exécution de existsByNomExcludingUuid({}, {})", nom, excludeUuid);
        Integer count = jdbcClient.sql(PartenaireQuery.EXISTS_BY_NOM_EXCLUDING_UUID)
                .param("nom", nom)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByEmail(String email) {
        log.debug("Exécution de existsByEmail({})", email);
        if (email == null || email.isEmpty()) {
            return false;
        }
        Integer count = jdbcClient.sql(PartenaireQuery.EXISTS_BY_EMAIL)
                .param("email", email)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByEmailExcludingUuid(String email, String excludeUuid) {
        log.debug("Exécution de existsByEmailExcludingUuid({}, {})", email, excludeUuid);
        if (email == null || email.isEmpty()) {
            return false;
        }
        Integer count = jdbcClient.sql(PartenaireQuery.EXISTS_BY_EMAIL_EXCLUDING_UUID)
                .param("email", email)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasOffres(String uuid) {
        log.debug("Exécution de hasOffres({})", uuid);
        try {
            Integer count = jdbcClient.sql(PartenaireQuery.HAS_OFFRES)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les offres pour le partenaire {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    // ========== ÉCRITURE ==========

    @Override
    public Partenaire save(Partenaire partenaire) {
        log.debug("Exécution de save({})", partenaire.getNom());
        return jdbcClient.sql(PartenaireQuery.INSERT)
                .param("localisationId", partenaire.getLocalisationId())
                .param("nom", partenaire.getNom())
                .param("typePartenaire", partenaire.getTypePartenaire())
                .param("raisonSociale", partenaire.getRaisonSociale())
                .param("numeroRegistre", partenaire.getNumeroRegistre())
                .param("telephone", partenaire.getTelephone())
                .param("email", partenaire.getEmail())
                .param("adresse", partenaire.getAdresse())
                .param("logoUrl", partenaire.getLogoUrl())
                .param("commissionPourcentage", partenaire.getCommissionPourcentage() != null
                        ? partenaire.getCommissionPourcentage() : BigDecimal.ZERO)
                .param("commissionFixe", partenaire.getCommissionFixe() != null
                        ? partenaire.getCommissionFixe() : BigDecimal.ZERO)
                .param("responsableNom", partenaire.getResponsableNom())
                .param("responsableTelephone", partenaire.getResponsableTelephone())
                .param("statut", partenaire.getStatut() != null ? partenaire.getStatut() : "ACTIF")
                .param("dateDebutPartenariat", partenaire.getDateDebutPartenariat())
                .param("dateFinPartenariat", partenaire.getDateFinPartenariat())
                .query((rs, rowNum) -> {
                    partenaire.setPartenaireId(rs.getLong("partenaire_id"));
                    partenaire.setPartenaireUuid(rs.getString("partenaire_uuid"));
                    partenaire.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    partenaire.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return partenaire;
                })
                .single();
    }

    @Override
    public Partenaire update(Partenaire partenaire) {
        log.debug("Exécution de update({})", partenaire.getPartenaireUuid());
        return jdbcClient.sql(PartenaireQuery.UPDATE)
                .param("localisationId", partenaire.getLocalisationId())
                .param("nom", partenaire.getNom())
                .param("typePartenaire", partenaire.getTypePartenaire())
                .param("raisonSociale", partenaire.getRaisonSociale())
                .param("numeroRegistre", partenaire.getNumeroRegistre())
                .param("telephone", partenaire.getTelephone())
                .param("email", partenaire.getEmail())
                .param("adresse", partenaire.getAdresse())
                .param("logoUrl", partenaire.getLogoUrl())
                .param("commissionPourcentage", partenaire.getCommissionPourcentage())
                .param("commissionFixe", partenaire.getCommissionFixe())
                .param("responsableNom", partenaire.getResponsableNom())
                .param("responsableTelephone", partenaire.getResponsableTelephone())
                .param("statut", partenaire.getStatut())
                .param("dateDebutPartenariat", partenaire.getDateDebutPartenariat())
                .param("dateFinPartenariat", partenaire.getDateFinPartenariat())
                .param("uuid", partenaire.getPartenaireUuid())
                .query((rs, rowNum) -> {
                    partenaire.setPartenaireId(rs.getLong("partenaire_id"));
                    partenaire.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    partenaire.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return partenaire;
                })
                .single();
    }

    @Override
    public int updateStatut(String uuid, String statut) {
        log.debug("Exécution de updateStatut({}, {})", uuid, statut);
        return jdbcClient.sql(PartenaireQuery.UPDATE_STATUT)
                .param("statut", statut)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int updateCommissions(String uuid, BigDecimal commissionPourcentage, BigDecimal commissionFixe) {
        log.debug("Exécution de updateCommissions({}, {}, {})", uuid, commissionPourcentage, commissionFixe);
        return jdbcClient.sql(PartenaireQuery.UPDATE_COMMISSIONS)
                .param("commissionPourcentage", commissionPourcentage)
                .param("commissionFixe", commissionFixe)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(PartenaireQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    // ========== COMPTAGE ==========

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(PartenaireQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByStatut(String statut) {
        log.debug("Exécution de countByStatut({})", statut);
        Long count = jdbcClient.sql(PartenaireQuery.COUNT_BY_STATUT)
                .param("statut", statut)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByType(String typePartenaire) {
        log.debug("Exécution de countByType({})", typePartenaire);
        Long count = jdbcClient.sql(PartenaireQuery.COUNT_BY_TYPE)
                .param("typePartenaire", typePartenaire)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countByVille(String villeUuid) {
        log.debug("Exécution de countByVille({})", villeUuid);
        Long count = jdbcClient.sql(PartenaireQuery.COUNT_BY_VILLE)
                .param("villeUuid", villeUuid)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}