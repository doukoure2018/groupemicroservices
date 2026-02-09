package io.multi.billetterieservice.repository.impl;

import io.multi.billetterieservice.domain.ModeReglement;
import io.multi.billetterieservice.query.ModeReglementQuery;
import io.multi.billetterieservice.repository.ModeReglementRepository;
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
 * Implémentation du repository ModeReglement utilisant JdbcClient.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class ModeReglementRepositoryImpl implements ModeReglementRepository {

    private final JdbcClient jdbcClient;

    private final RowMapper<ModeReglement> rowMapper = (rs, rowNum) -> ModeReglement.builder()
            .modeReglementId(rs.getLong("mode_reglement_id"))
            .modeReglementUuid(rs.getString("mode_reglement_uuid"))
            .libelle(rs.getString("libelle"))
            .code(rs.getString("code"))
            .description(rs.getString("description"))
            .iconeUrl(rs.getString("icone_url"))
            .fraisPourcentage(rs.getBigDecimal("frais_pourcentage"))
            .fraisFixe(rs.getBigDecimal("frais_fixe"))
            .actif(rs.getBoolean("actif"))
            .createdAt(rs.getObject("created_at", OffsetDateTime.class))
            .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
            .build();

    // ========== LECTURE ==========

    @Override
    public List<ModeReglement> findAll() {
        log.debug("Exécution de findAll()");
        return jdbcClient.sql(ModeReglementQuery.FIND_ALL)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<ModeReglement> findAllActifs() {
        log.debug("Exécution de findAllActifs()");
        return jdbcClient.sql(ModeReglementQuery.FIND_ALL_ACTIFS)
                .query(rowMapper)
                .list();
    }

    @Override
    public Optional<ModeReglement> findByUuid(String uuid) {
        log.debug("Exécution de findByUuid({})", uuid);
        return jdbcClient.sql(ModeReglementQuery.FIND_BY_UUID)
                .param("uuid", uuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ModeReglement> findById(Long id) {
        log.debug("Exécution de findById({})", id);
        return jdbcClient.sql(ModeReglementQuery.FIND_BY_ID)
                .param("id", id)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ModeReglement> findByCode(String code) {
        log.debug("Exécution de findByCode({})", code);
        return jdbcClient.sql(ModeReglementQuery.FIND_BY_CODE)
                .param("code", code)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<ModeReglement> findByLibelle(String libelle) {
        log.debug("Exécution de findByLibelle({})", libelle);
        return jdbcClient.sql(ModeReglementQuery.FIND_BY_LIBELLE)
                .param("libelle", libelle)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<ModeReglement> search(String searchTerm) {
        log.debug("Exécution de search({})", searchTerm);
        return jdbcClient.sql(ModeReglementQuery.SEARCH)
                .param("searchTerm", "%" + searchTerm.toLowerCase() + "%")
                .query(rowMapper)
                .list();
    }

    @Override
    public List<ModeReglement> findSansFrais() {
        log.debug("Exécution de findSansFrais()");
        return jdbcClient.sql(ModeReglementQuery.FIND_SANS_FRAIS)
                .query(rowMapper)
                .list();
    }

    // ========== VÉRIFICATION ==========

    @Override
    public boolean existsByCode(String code) {
        log.debug("Exécution de existsByCode({})", code);
        Integer count = jdbcClient.sql(ModeReglementQuery.EXISTS_BY_CODE)
                .param("code", code)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByCodeExcludingUuid(String code, String excludeUuid) {
        log.debug("Exécution de existsByCodeExcludingUuid({}, {})", code, excludeUuid);
        Integer count = jdbcClient.sql(ModeReglementQuery.EXISTS_BY_CODE_EXCLUDING_UUID)
                .param("code", code)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByLibelle(String libelle) {
        log.debug("Exécution de existsByLibelle({})", libelle);
        Integer count = jdbcClient.sql(ModeReglementQuery.EXISTS_BY_LIBELLE)
                .param("libelle", libelle)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean existsByLibelleExcludingUuid(String libelle, String excludeUuid) {
        log.debug("Exécution de existsByLibelleExcludingUuid({}, {})", libelle, excludeUuid);
        Integer count = jdbcClient.sql(ModeReglementQuery.EXISTS_BY_LIBELLE_EXCLUDING_UUID)
                .param("libelle", libelle)
                .param("excludeUuid", excludeUuid)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }

    @Override
    public boolean hasTransactions(String uuid) {
        log.debug("Exécution de hasTransactions({})", uuid);
        try {
            Integer count = jdbcClient.sql(ModeReglementQuery.HAS_TRANSACTIONS)
                    .param("uuid", uuid)
                    .query(Integer.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Impossible de vérifier les transactions pour le mode {}: {}", uuid, e.getMessage());
            return false;
        }
    }

    // ========== ÉCRITURE ==========

    @Override
    public ModeReglement save(ModeReglement modeReglement) {
        log.debug("Exécution de save({})", modeReglement.getCode());
        return jdbcClient.sql(ModeReglementQuery.INSERT)
                .param("libelle", modeReglement.getLibelle())
                .param("code", modeReglement.getCode().toUpperCase())
                .param("description", modeReglement.getDescription())
                .param("iconeUrl", modeReglement.getIconeUrl())
                .param("fraisPourcentage", modeReglement.getFraisPourcentage() != null
                        ? modeReglement.getFraisPourcentage() : BigDecimal.ZERO)
                .param("fraisFixe", modeReglement.getFraisFixe() != null
                        ? modeReglement.getFraisFixe() : BigDecimal.ZERO)
                .param("actif", modeReglement.getActif() != null ? modeReglement.getActif() : true)
                .query((rs, rowNum) -> {
                    modeReglement.setModeReglementId(rs.getLong("mode_reglement_id"));
                    modeReglement.setModeReglementUuid(rs.getString("mode_reglement_uuid"));
                    modeReglement.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    modeReglement.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return modeReglement;
                })
                .single();
    }

    @Override
    public ModeReglement update(ModeReglement modeReglement) {
        log.debug("Exécution de update({})", modeReglement.getModeReglementUuid());
        return jdbcClient.sql(ModeReglementQuery.UPDATE)
                .param("libelle", modeReglement.getLibelle())
                .param("code", modeReglement.getCode().toUpperCase())
                .param("description", modeReglement.getDescription())
                .param("iconeUrl", modeReglement.getIconeUrl())
                .param("fraisPourcentage", modeReglement.getFraisPourcentage())
                .param("fraisFixe", modeReglement.getFraisFixe())
                .param("actif", modeReglement.getActif())
                .param("uuid", modeReglement.getModeReglementUuid())
                .query((rs, rowNum) -> {
                    modeReglement.setModeReglementId(rs.getLong("mode_reglement_id"));
                    modeReglement.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
                    modeReglement.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
                    return modeReglement;
                })
                .single();
    }

    @Override
    public int updateFrais(String uuid, BigDecimal fraisPourcentage, BigDecimal fraisFixe) {
        log.debug("Exécution de updateFrais({}, {}, {})", uuid, fraisPourcentage, fraisFixe);
        return jdbcClient.sql(ModeReglementQuery.UPDATE_FRAIS)
                .param("fraisPourcentage", fraisPourcentage)
                .param("fraisFixe", fraisFixe)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int updateActif(String uuid, boolean actif) {
        log.debug("Exécution de updateActif({}, {})", uuid, actif);
        return jdbcClient.sql(ModeReglementQuery.UPDATE_ACTIF)
                .param("actif", actif)
                .param("uuid", uuid)
                .update();
    }

    @Override
    public int deleteByUuid(String uuid) {
        log.debug("Exécution de deleteByUuid({})", uuid);
        return jdbcClient.sql(ModeReglementQuery.DELETE_BY_UUID)
                .param("uuid", uuid)
                .update();
    }

    // ========== COMPTAGE ==========

    @Override
    public long count() {
        log.debug("Exécution de count()");
        Long count = jdbcClient.sql(ModeReglementQuery.COUNT_ALL)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }

    @Override
    public long countActifs() {
        log.debug("Exécution de countActifs()");
        Long count = jdbcClient.sql(ModeReglementQuery.COUNT_ACTIFS)
                .query(Long.class)
                .single();
        return count != null ? count : 0L;
    }
}