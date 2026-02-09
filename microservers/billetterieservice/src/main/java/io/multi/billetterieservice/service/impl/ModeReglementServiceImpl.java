package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.ModeReglement;
import io.multi.billetterieservice.dto.ModeReglementRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.ModeReglementRepository;
import io.multi.billetterieservice.service.ModeReglementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Implémentation du service pour la gestion des modes de règlement.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ModeReglementServiceImpl implements ModeReglementService {

    private final ModeReglementRepository modeReglementRepository;

    // ========== LECTURE ==========

    @Override
    @Transactional(readOnly = true)
    public List<ModeReglement> getAll() {
        log.info("Récupération de tous les modes de règlement");
        return modeReglementRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModeReglement> getAllActifs() {
        log.info("Récupération de tous les modes de règlement actifs");
        return modeReglementRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public ModeReglement getByUuid(String uuid) {
        log.info("Récupération du mode de règlement: {}", uuid);
        return modeReglementRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Mode de règlement non trouvé: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public ModeReglement getByCode(String code) {
        log.info("Récupération du mode de règlement par code: {}", code);
        return modeReglementRepository.findByCode(code)
                .orElseThrow(() -> new ApiException("Mode de règlement non trouvé avec le code: " + code));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModeReglement> search(String searchTerm) {
        log.info("Recherche des modes de règlement: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return modeReglementRepository.findAllActifs();
        }
        return modeReglementRepository.search(searchTerm.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModeReglement> getSansFrais() {
        log.info("Récupération des modes de règlement sans frais");
        return modeReglementRepository.findSansFrais();
    }

    // ========== ÉCRITURE ==========

    @Override
    public ModeReglement create(ModeReglementRequest request) {
        log.info("Création d'un mode de règlement: {}", request.getCode());

        // Vérifier l'unicité du code
        if (modeReglementRepository.existsByCode(request.getCode())) {
            throw new ApiException("Un mode de règlement existe déjà avec ce code: " + request.getCode());
        }

        // Vérifier l'unicité du libellé
        if (modeReglementRepository.existsByLibelle(request.getLibelle())) {
            throw new ApiException("Un mode de règlement existe déjà avec ce libellé: " + request.getLibelle());
        }

        ModeReglement modeReglement = ModeReglement.builder()
                .libelle(request.getLibelle())
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .iconeUrl(request.getIconeUrl())
                .fraisPourcentage(request.getFraisPourcentage() != null
                        ? request.getFraisPourcentage() : BigDecimal.ZERO)
                .fraisFixe(request.getFraisFixe() != null
                        ? request.getFraisFixe() : BigDecimal.ZERO)
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();

        ModeReglement saved = modeReglementRepository.save(modeReglement);
        log.info("Mode de règlement créé: {}", saved.getModeReglementUuid());
        return saved;
    }

    @Override
    public ModeReglement update(String uuid, ModeReglementRequest request) {
        log.info("Mise à jour du mode de règlement: {}", uuid);

        ModeReglement existing = getByUuid(uuid);

        // Vérifier l'unicité du code (hors lui-même)
        if (modeReglementRepository.existsByCodeExcludingUuid(request.getCode(), uuid)) {
            throw new ApiException("Un mode de règlement existe déjà avec ce code: " + request.getCode());
        }

        // Vérifier l'unicité du libellé (hors lui-même)
        if (modeReglementRepository.existsByLibelleExcludingUuid(request.getLibelle(), uuid)) {
            throw new ApiException("Un mode de règlement existe déjà avec ce libellé: " + request.getLibelle());
        }

        existing.setLibelle(request.getLibelle());
        existing.setCode(request.getCode().toUpperCase());
        existing.setDescription(request.getDescription());
        existing.setIconeUrl(request.getIconeUrl());
        existing.setFraisPourcentage(request.getFraisPourcentage());
        existing.setFraisFixe(request.getFraisFixe());
        if (request.getActif() != null) {
            existing.setActif(request.getActif());
        }

        ModeReglement updated = modeReglementRepository.update(existing);
        log.info("Mode de règlement mis à jour: {}", uuid);
        return modeReglementRepository.findByUuid(uuid).orElse(updated);
    }

    @Override
    public ModeReglement updateFrais(String uuid, BigDecimal fraisPourcentage, BigDecimal fraisFixe) {
        log.info("Mise à jour des frais du mode de règlement: {}", uuid);

        ModeReglement modeReglement = getByUuid(uuid);

        // Validation des frais
        if (fraisPourcentage != null && fraisPourcentage.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Les frais en pourcentage ne peuvent pas être négatifs");
        }
        if (fraisPourcentage != null && fraisPourcentage.compareTo(new BigDecimal("100")) > 0) {
            throw new ApiException("Les frais en pourcentage ne peuvent pas dépasser 100%");
        }
        if (fraisFixe != null && fraisFixe.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Les frais fixes ne peuvent pas être négatifs");
        }

        modeReglementRepository.updateFrais(uuid,
                fraisPourcentage != null ? fraisPourcentage : BigDecimal.ZERO,
                fraisFixe != null ? fraisFixe : BigDecimal.ZERO);

        return modeReglementRepository.findByUuid(uuid).orElse(modeReglement);
    }

    @Override
    public ModeReglement activate(String uuid) {
        log.info("Activation du mode de règlement: {}", uuid);
        ModeReglement modeReglement = getByUuid(uuid);

        if (Boolean.TRUE.equals(modeReglement.getActif())) {
            throw new ApiException("Le mode de règlement est déjà actif");
        }

        modeReglementRepository.updateActif(uuid, true);
        return modeReglementRepository.findByUuid(uuid).orElse(modeReglement);
    }

    @Override
    public ModeReglement deactivate(String uuid) {
        log.info("Désactivation du mode de règlement: {}", uuid);
        ModeReglement modeReglement = getByUuid(uuid);

        if (!Boolean.TRUE.equals(modeReglement.getActif())) {
            throw new ApiException("Le mode de règlement est déjà inactif");
        }

        modeReglementRepository.updateActif(uuid, false);
        return modeReglementRepository.findByUuid(uuid).orElse(modeReglement);
    }

    @Override
    public ModeReglement toggleActif(String uuid) {
        log.info("Basculement du statut actif du mode de règlement: {}", uuid);
        ModeReglement modeReglement = getByUuid(uuid);

        if (Boolean.TRUE.equals(modeReglement.getActif())) {
            return deactivate(uuid);
        } else {
            return activate(uuid);
        }
    }

    @Override
    public void delete(String uuid) {
        log.info("Suppression du mode de règlement: {}", uuid);

        ModeReglement modeReglement = getByUuid(uuid);

        // Vérifier s'il y a des transactions associées
        if (modeReglementRepository.hasTransactions(uuid)) {
            throw new ApiException("Impossible de supprimer: des transactions utilisent ce mode de règlement");
        }

        int deleted = modeReglementRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du mode de règlement");
        }

        log.info("Mode de règlement supprimé: {}", uuid);
    }

    // ========== STATISTIQUES ==========

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return modeReglementRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countActifs() {
        return modeReglementRepository.countActifs();
    }

    // ========== CALCUL ==========

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculerFrais(String uuid, BigDecimal montant) {
        log.info("Calcul des frais pour le mode {} et montant {}", uuid, montant);

        ModeReglement modeReglement = getByUuid(uuid);

        if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Le montant doit être positif");
        }

        BigDecimal fraisPourcentage = modeReglement.getFraisPourcentage() != null
                ? modeReglement.getFraisPourcentage() : BigDecimal.ZERO;
        BigDecimal fraisFixe = modeReglement.getFraisFixe() != null
                ? modeReglement.getFraisFixe() : BigDecimal.ZERO;

        // Calcul: (montant * fraisPourcentage / 100) + fraisFixe
        BigDecimal fraisCalcules = montant
                .multiply(fraisPourcentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                .add(fraisFixe);

        log.debug("Frais calculés: {} ({}% + {} fixe)", fraisCalcules, fraisPourcentage, fraisFixe);
        return fraisCalcules;
    }
}