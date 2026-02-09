package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.ModeReglement;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité ModeReglement.
 */
public interface ModeReglementRepository {

    // ========== LECTURE ==========

    List<ModeReglement> findAll();

    List<ModeReglement> findAllActifs();

    Optional<ModeReglement> findByUuid(String uuid);

    Optional<ModeReglement> findById(Long id);

    Optional<ModeReglement> findByCode(String code);

    Optional<ModeReglement> findByLibelle(String libelle);

    List<ModeReglement> search(String searchTerm);

    List<ModeReglement> findSansFrais();

    // ========== VÉRIFICATION ==========

    boolean existsByCode(String code);

    boolean existsByCodeExcludingUuid(String code, String excludeUuid);

    boolean existsByLibelle(String libelle);

    boolean existsByLibelleExcludingUuid(String libelle, String excludeUuid);

    boolean hasTransactions(String uuid);

    // ========== ÉCRITURE ==========

    ModeReglement save(ModeReglement modeReglement);

    ModeReglement update(ModeReglement modeReglement);

    int updateFrais(String uuid, BigDecimal fraisPourcentage, BigDecimal fraisFixe);

    int updateActif(String uuid, boolean actif);

    int deleteByUuid(String uuid);

    // ========== COMPTAGE ==========

    long count();

    long countActifs();
}