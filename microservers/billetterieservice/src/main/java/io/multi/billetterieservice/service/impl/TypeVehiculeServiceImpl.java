package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.TypeVehicule;
import io.multi.billetterieservice.dto.TypeVehiculeRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.TypeVehiculeRepository;
import io.multi.billetterieservice.service.TypeVehiculeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des types de véhicules.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TypeVehiculeServiceImpl implements TypeVehiculeService {

    private final TypeVehiculeRepository typeVehiculeRepository;

    // ========== LECTURE ==========

    @Override
    @Transactional(readOnly = true)
    public List<TypeVehicule> getAll() {
        log.info("Récupération de tous les types de véhicules");
        return typeVehiculeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TypeVehicule> getAllActifs() {
        log.info("Récupération de tous les types de véhicules actifs");
        return typeVehiculeRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public TypeVehicule getByUuid(String uuid) {
        log.info("Récupération du type de véhicule: {}", uuid);
        return typeVehiculeRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Type de véhicule non trouvé: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public TypeVehicule getByLibelle(String libelle) {
        log.info("Récupération du type de véhicule par libellé: {}", libelle);
        return typeVehiculeRepository.findByLibelle(libelle)
                .orElseThrow(() -> new ApiException("Type de véhicule non trouvé: " + libelle));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TypeVehicule> search(String searchTerm) {
        log.info("Recherche des types de véhicules: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return typeVehiculeRepository.findAllActifs();
        }
        return typeVehiculeRepository.searchByLibelle(searchTerm.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TypeVehicule> getByCapacite(int capacite) {
        log.info("Récupération des types de véhicules pour capacité: {}", capacite);
        return typeVehiculeRepository.findByCapacite(capacite);
    }

    // ========== ÉCRITURE ==========

    @Override
    public TypeVehicule create(TypeVehiculeRequest request) {
        log.info("Création d'un type de véhicule: {}", request.getLibelle());

        // Vérifier l'unicité du libellé
        if (typeVehiculeRepository.existsByLibelle(request.getLibelle())) {
            throw new ApiException("Un type de véhicule existe déjà avec ce libellé: " + request.getLibelle());
        }

        // Validation des capacités
        validateCapacites(request.getCapaciteMin(), request.getCapaciteMax());

        TypeVehicule typeVehicule = TypeVehicule.builder()
                .libelle(request.getLibelle())
                .description(request.getDescription())
                .capaciteMin(request.getCapaciteMin())
                .capaciteMax(request.getCapaciteMax())
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();

        TypeVehicule saved = typeVehiculeRepository.save(typeVehicule);
        log.info("Type de véhicule créé: {}", saved.getTypeVehiculeUuid());
        return saved;
    }

    @Override
    public TypeVehicule update(String uuid, TypeVehiculeRequest request) {
        log.info("Mise à jour du type de véhicule: {}", uuid);

        TypeVehicule existing = getByUuid(uuid);

        // Vérifier l'unicité du libellé (hors lui-même)
        if (typeVehiculeRepository.existsByLibelleExcludingUuid(request.getLibelle(), uuid)) {
            throw new ApiException("Un type de véhicule existe déjà avec ce libellé: " + request.getLibelle());
        }

        // Validation des capacités
        validateCapacites(request.getCapaciteMin(), request.getCapaciteMax());

        existing.setLibelle(request.getLibelle());
        existing.setDescription(request.getDescription());
        existing.setCapaciteMin(request.getCapaciteMin());
        existing.setCapaciteMax(request.getCapaciteMax());
        if (request.getActif() != null) {
            existing.setActif(request.getActif());
        }

        TypeVehicule updated = typeVehiculeRepository.update(existing);
        log.info("Type de véhicule mis à jour: {}", uuid);
        return typeVehiculeRepository.findByUuid(uuid).orElse(updated);
    }

    @Override
    public TypeVehicule activate(String uuid) {
        log.info("Activation du type de véhicule: {}", uuid);
        TypeVehicule typeVehicule = getByUuid(uuid);

        if (Boolean.TRUE.equals(typeVehicule.getActif())) {
            throw new ApiException("Le type de véhicule est déjà actif");
        }

        typeVehiculeRepository.updateActif(uuid, true);
        return typeVehiculeRepository.findByUuid(uuid).orElse(typeVehicule);
    }

    @Override
    public TypeVehicule deactivate(String uuid) {
        log.info("Désactivation du type de véhicule: {}", uuid);
        TypeVehicule typeVehicule = getByUuid(uuid);

        if (!Boolean.TRUE.equals(typeVehicule.getActif())) {
            throw new ApiException("Le type de véhicule est déjà inactif");
        }

        // Vérifier s'il y a des véhicules associés
        if (typeVehiculeRepository.hasVehicules(uuid)) {
            throw new ApiException("Impossible de désactiver: des véhicules utilisent ce type");
        }

        typeVehiculeRepository.updateActif(uuid, false);
        return typeVehiculeRepository.findByUuid(uuid).orElse(typeVehicule);
    }

    @Override
    public TypeVehicule toggleActif(String uuid) {
        log.info("Basculement du statut actif du type de véhicule: {}", uuid);
        TypeVehicule typeVehicule = getByUuid(uuid);

        if (Boolean.TRUE.equals(typeVehicule.getActif())) {
            return deactivate(uuid);
        } else {
            return activate(uuid);
        }
    }

    @Override
    public void delete(String uuid) {
        log.info("Suppression du type de véhicule: {}", uuid);

        TypeVehicule typeVehicule = getByUuid(uuid);

        // Vérifier s'il y a des véhicules associés
        if (typeVehiculeRepository.hasVehicules(uuid)) {
            throw new ApiException("Impossible de supprimer: des véhicules utilisent ce type");
        }

        int deleted = typeVehiculeRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du type de véhicule");
        }

        log.info("Type de véhicule supprimé: {}", uuid);
    }

    // ========== STATISTIQUES ==========

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return typeVehiculeRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countActifs() {
        return typeVehiculeRepository.countActifs();
    }

    // ========== MÉTHODES PRIVÉES ==========

    private void validateCapacites(Integer capaciteMin, Integer capaciteMax) {
        if (capaciteMin != null && capaciteMax != null && capaciteMin > capaciteMax) {
            throw new ApiException("La capacité minimale ne peut pas être supérieure à la capacité maximale");
        }
    }
}