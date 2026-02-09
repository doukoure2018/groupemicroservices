package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.TypeVehicule;
import io.multi.billetterieservice.query.TypeVehiculeQuery;
import io.multi.billetterieservice.repository.TypeVehiculeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implémentation du repository TypeVehicule utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class TypeVehiculeRepositoryImpl implements TypeVehiculeRepository {

    private final JdbcClient jdbcClient;

    private final RowMapper<TypeVehicule> rowMapper = (rs, rowNum) -> TypeVehicule.builder()
            .typeVehiculeId(rs.getLong("type_vehicule_id"))
            .typeVehiculeUuid(rs.getString("type_vehicule_uuid"))
            .libelle(rs.getString("libelle"))
            .description(rs.getString("description"))
            .capaciteMin(rs.getObject("capacite_min", Integer.class))
            .capaciteMax(rs.getObject("capacite_max", Integer.class))
            .actif(rs.getBoolean("actif"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            .build();

    // ========== LECTURE ==========

    @Override
    public List<TypeVehicule> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(TypeVehiculeQuery.FIND_ALL)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<TypeVehicule> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(TypeVehiculeQuery.FIND_ALL_ACTIFS)
                .query(rowMapper)
                .list();
    }

    @Override
    public Optional<TypeVehicule> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(TypeVehiculeQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<TypeVehicule> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(TypeVehiculeQuery.FIND_BY_ID)
                .param("id", id)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<TypeVehicule> findByLibelle(String libelle) {
        log.debug("Exécution de findByLibelle({})", libelle);
        return jdbcClient.sql(TypeVehiculeQuery.FIND_BY_LIBELLE)
                .param("libelle", libelle)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<TypeVehicule> searchByLibelle(String searchTerm) {
        log.debug("Exécution de searchByLibelle({})", searchTerm);
        return jdbcClient.sql(TypeVehiculeQuery.SEARCH_BY_LIBELLE)
                .param("searchTerm", "%" + searchTerm.toLowerCase() + "%")
                .query(rowMapper)
                .list();
    }

    @Override
    public List<TypeVehicule> findByCapacite(int capacite) {
        log.debug("Exécution de findByCapacite({})", capacite);
        return jdbcClient.sql(TypeVehiculeQuery.FIND_BY_CAPACITE)
                .param("capacite", capacite)
                .query(rowMapper)
                .list();
    }

    // ========== VÉRIFICATION ==========

    @Override
    public boolean existsByLibelle(String libelle) {
        log.debug("Exécution de existsByLibelle({})", libelle);
        Integer count = jdbcClient.sql(TypeVehiculeQuery.EXISTS_BY_LIBELLE)
                .param("libelle", libelle)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByLibelleExcludingUuid(String libelle, String excludeUuid) {
        log.debug("Exécution de existsByLibelleExcludingUuid({}, {})", libelle, excludeUuid);
        Integer count = jdbcClient.sql(TypeVehiculeQuery.EXISTS_BY_LIBELLE_EXCLUDING_UUID)
                .param("libelle", libelle)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasVehicules(String uuid) {
        log.debug("Exécution de hasVehicules({})", uuid);
        try {
            Integer count = jdbcClient.sql(TypeVehiculeQuery.HAS_VEHICULES)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les véhicules pour le type {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    // ========== ÉCRITURE ==========

    @Override
    public TypeVehicule save(TypeVehicule typeVehicule) {
        log.debug("Exécution de save({})", typeVehicule.getLibelle());
        return jdbcClient.sql(TypeVehiculeQuery.INSERT)
                .param("libelle", typeVehicule.getLibelle())
                .param("description", typeVehicule.getDescription())
                .param("capaciteMin", typeVehicule.getCapaciteMin())
                .param("capaciteMax", typeVehicule.getCapaciteMax())
                .param("actif", typeVehicule.getActif() != null ? typeVehicule.getActif() : true)
                .query((rs, rowNum) -> {
                    typeVehicule.setTypeVehiculeId(rs.getLong("type_vehicule_id"));
                    typeVehicule.setTypeVehiculeUuid(rs.getString("type_vehicule_uuid"));
                    typeVehicule.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    typeVehicule.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return typeVehicule;
                })
                .single();
    }

    @Override
    public TypeVehicule update(TypeVehicule typeVehicule) {
        log.debug("Exécution de update({})", typeVehicule.getTypeVehiculeUuid());
        return jdbcClient.sql(TypeVehiculeQuery.UPDATE)
                .param("libelle", typeVehicule.getLibelle())
                .param("description", typeVehicule.getDescription())
                .param("capaciteMin", typeVehicule.getCapaciteMin())
                .param("capaciteMax", typeVehicule.getCapaciteMax())
                .param("actif", typeVehicule.getActif())
                .param("uuid", typeVehicule.getTypeVehiculeUuid())
                .query((rs, rowNum) -> {
                    typeVehicule.setTypeVehiculeId(rs.getLong("type_vehicule_id"));
                    typeVehicule.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    typeVehicule.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return typeVehicule;
                })
                .single();
    }

    @Override
    public int updateActif(String uuid, boolean actif) {
        log.debug("Exécution de updateActif({}, {})", uuid, actif);
        return jdbcClient.sql(TypeVehiculeQuery.UPDATE_ACTIF)
                .param("actif", actif)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(TypeVehiculeQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    // ========== COMPTAGE ==========

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(TypeVehiculeQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActifs() {
        log.debug("Exécution de countActifs()");
        Long count = jdbcClient.sql(TypeVehiculeQuery.COUNT_ACTIFS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}