package io.multi.billetterieservice.service.impl;
import io.multi.billetterieservice.domain.Ville;
import io.multi.billetterieservice.dto.VilleCreateRequest;
import io.multi.billetterieservice.dto.VilleUpdateRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.VilleRepository;
import io.multi.billetterieservice.response.VilleResponse;
import io.multi.billetterieservice.service.VilleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des villes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VilleServiceImpl implements VilleService {

    private final VilleRepository villeRepository;

    @Override
    public VilleResponse createVille(VilleCreateRequest request) {
        log.info("Création d'une nouvelle ville: {} dans la région: {}", request.getLibelle(), request.getRegionUuid());

        // Récupérer l'ID de la région
        Long regionId = villeRepository.findRegionIdByUuid(request.getRegionUuid())
                .orElseThrow(() -> new ApiException("Région non trouvée avec l'UUID: " + request.getRegionUuid()));

        // Vérifier si le libellé existe déjà dans la région
        if (villeRepository.existsByLibelleAndRegion(request.getLibelle(), request.getRegionUuid())) {
            throw new ApiException("Une ville existe déjà avec le libellé '" + request.getLibelle() + "' dans cette région");
        }

        // Créer l'entité ville
        Ville ville = Ville.builder()
                .regionId(regionId)
                .libelle(request.getLibelle())
                .codePostal(request.getCodePostal())
                .actif(true)
                .build();

        // Sauvegarder
        Ville savedVille = villeRepository.save(ville);
        log.info("Ville créée avec succès: UUID={}", savedVille.getVilleUuid());

        // Récupérer avec les informations de la région pour la réponse
        return villeRepository.findByUuid(savedVille.getVilleUuid())
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la ville créée"));
    }

    @Override
    public VilleResponse updateVille(String villeUuid, VilleUpdateRequest request) {
        log.info("Mise à jour de la ville: {}", villeUuid);

        // Vérifier si la ville existe
        Ville existingVille = villeRepository.findByUuid(villeUuid)
                .orElseThrow(() -> new ApiException("Ville non trouvée avec l'UUID: " + villeUuid));

        // Déterminer la région pour la vérification du doublon
        String regionUuidForCheck = request.getRegionUuid() != null ? request.getRegionUuid() : existingVille.getRegionUuid();

        // Vérifier si le nouveau libellé n'est pas déjà utilisé par une autre ville dans la région
        if (villeRepository.existsByLibelleAndRegionAndNotUuid(request.getLibelle(), regionUuidForCheck, villeUuid)) {
            throw new ApiException("Une ville existe déjà avec le libellé '" + request.getLibelle() + "' dans cette région");
        }

        // Si changement de région, récupérer le nouvel ID
        Long newRegionId = null;
        if (request.getRegionUuid() != null && !request.getRegionUuid().equals(existingVille.getRegionUuid())) {
            newRegionId = villeRepository.findRegionIdByUuid(request.getRegionUuid())
                    .orElseThrow(() -> new ApiException("Région non trouvée avec l'UUID: " + request.getRegionUuid()));
        }

        // Mettre à jour
        Ville updatedVille = villeRepository.update(villeUuid, request.getLibelle(), request.getCodePostal(), newRegionId)
                .orElseThrow(() -> new ApiException("Erreur lors de la mise à jour de la ville"));

        log.info("Ville mise à jour avec succès: UUID={}", villeUuid);

        // Récupérer avec les informations de la région pour la réponse
        return villeRepository.findByUuid(villeUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la ville mise à jour"));
    }

    @Override
    public VilleResponse updateVilleStatus(String villeUuid, Boolean actif) {
        log.info("Mise à jour du statut de la ville: {} -> actif={}", villeUuid, actif);

        // Vérifier si la ville existe
        if (!villeRepository.existsByUuid(villeUuid)) {
            throw new ApiException("Ville non trouvée avec l'UUID: " + villeUuid);
        }

        // Mettre à jour le statut
        Ville updatedVille = villeRepository.updateStatus(villeUuid, actif)
                .orElseThrow(() -> new ApiException("Erreur lors de la mise à jour du statut de la ville"));

        log.info("Statut de la ville mis à jour avec succès: UUID={}, actif={}", villeUuid, actif);

        // Récupérer avec les informations de la région pour la réponse
        return villeRepository.findByUuid(villeUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la ville mise à jour"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<VilleResponse> getAllVilles() {
        log.info("Récupération de toutes les villes");

        List<Ville> villes = villeRepository.findAll();
        log.info("Nombre de villes trouvées: {}", villes.size());

        return villes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VilleResponse> getActiveVilles() {
        log.info("Récupération des villes actives");

        List<Ville> villes = villeRepository.findAllActive();
        log.info("Nombre de villes actives trouvées: {}", villes.size());

        return villes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VilleResponse> getVillesByRegion(String regionUuid) {
        log.info("Récupération des villes de la région: {}", regionUuid);

        List<Ville> villes = villeRepository.findByRegionUuid(regionUuid);
        log.info("Nombre de villes trouvées pour la région {}: {}", regionUuid, villes.size());

        return villes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VilleResponse> getActiveVillesByRegion(String regionUuid) {
        log.info("Récupération des villes actives de la région: {}", regionUuid);

        List<Ville> villes = villeRepository.findActiveByRegionUuid(regionUuid);
        log.info("Nombre de villes actives trouvées pour la région {}: {}", regionUuid, villes.size());

        return villes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VilleResponse getVilleByUuid(String villeUuid) {
        log.info("Récupération de la ville: {}", villeUuid);

        Ville ville = villeRepository.findByUuid(villeUuid)
                .orElseThrow(() -> new ApiException("Ville non trouvée avec l'UUID: " + villeUuid));

        return mapToResponse(ville);
    }

    /**
     * Convertit une entité Ville en VilleResponse.
     *
     * @param ville L'entité à convertir
     * @return Le DTO de réponse
     */
    private VilleResponse mapToResponse(Ville ville) {
        return VilleResponse.builder()
                .villeId(ville.getVilleId())
                .villeUuid(ville.getVilleUuid())
                .libelle(ville.getLibelle())
                .codePostal(ville.getCodePostal())
                .actif(ville.getActif())
                .regionId(ville.getRegionId())
                .regionUuid(ville.getRegionUuid())
                .regionLibelle(ville.getRegionLibelle())
                .createdAt(ville.getCreatedAt())
                .updatedAt(ville.getUpdatedAt())
                .build();
    }
}