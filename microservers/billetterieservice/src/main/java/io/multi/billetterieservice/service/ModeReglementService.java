package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.ModeReglement;
import io.multi.billetterieservice.dto.ModeReglementRequest;

import java.math.BigDecimal;
import java.util.List;

/**
 * Interface de service pour la gestion des modes de règlement.
 */
public interface ModeReglementService {

    // ========== LECTURE ==========

    List<ModeReglement> getAll();

    List<ModeReglement> getAllActifs();

    ModeReglement getByUuid(String uuid);

    ModeReglement getByCode(String code);

    List<ModeReglement> search(String searchTerm);

    List<ModeReglement> getSansFrais();

    // ========== ÉCRITURE ==========

    ModeReglement create(ModeReglementRequest request);

    ModeReglement update(String uuid, ModeReglementRequest request);

    ModeReglement updateFrais(String uuid, BigDecimal fraisPourcentage, BigDecimal fraisFixe);

    ModeReglement activate(String uuid);

    ModeReglement deactivate(String uuid);

    ModeReglement toggleActif(String uuid);

    void delete(String uuid);

    // ========== STATISTIQUES ==========

    long count();

    long countActifs();

    // ========== CALCUL ==========

    /**
     * Calcule les frais pour un montant donné
     */
    BigDecimal calculerFrais(String uuid, BigDecimal montant);
}