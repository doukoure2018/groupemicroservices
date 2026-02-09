package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Region;
import io.multi.billetterieservice.dto.RegionCreateRequest;
import io.multi.billetterieservice.dto.RegionStatusRequest;
import io.multi.billetterieservice.dto.RegionUpdateRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.RegionRepository;
import io.multi.billetterieservice.response.RegionResponse;
import io.multi.billetterieservice.service.RegionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des régions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RegionServiceImpl implements RegionService {

    private final RegionRepository regionRepository;

    @Override
    public RegionResponse createRegion(RegionCreateRequest request) {
        log.info("Création d'une nouvelle région: {}", request.getLibelle());

        // Vérifier si le libellé existe déjà
        if (regionRepository.existsByLibelle(request.getLibelle())) {
            throw new ApiException("Une région existe déjà avec le libellé: " + request.getLibelle());
        }

        // Créer l'entité région
        Region region = Region.builder()
                .libelle(request.getLibelle())
                .code(request.getCode())
                .actif(true)
                .build();

        // Sauvegarder et retourner
        Region savedRegion = regionRepository.save(region);
        log.info("Région créée avec succès: UUID={}", savedRegion.getRegionUuid());

        return mapToResponse(savedRegion);
    }

    @Override
    public RegionResponse updateRegion(String regionUuid, RegionUpdateRequest request) {
        log.info("Mise à jour de la région: {}", regionUuid);

        // Vérifier si la région existe
        if (!regionRepository.existsByUuid(regionUuid)) {
            throw new ApiException("Région non trouvée avec l'UUID: " + regionUuid);
        }

        // Vérifier si le nouveau libellé n'est pas déjà utilisé par une autre région
        if (regionRepository.existsByLibelleAndNotUuid(request.getLibelle(), regionUuid)) {
            throw new ApiException("Une région existe déjà avec le libellé: " + request.getLibelle());
        }

        // Mettre à jour
        Region updatedRegion = regionRepository.update(regionUuid, request.getLibelle(), request.getCode())
                .orElseThrow(() -> new ApiException("Région non trouvée avec l'UUID: " + regionUuid));

        log.info("Région mise à jour avec succès: UUID={}", regionUuid);
        return mapToResponse(updatedRegion);
    }

    @Override
    public RegionResponse updateRegionStatus(String regionUuid, RegionStatusRequest request) {
        log.info("Mise à jour du statut de la région: {} -> actif={}", regionUuid, request.getActif());

        // Vérifier si la région existe
        if (!regionRepository.existsByUuid(regionUuid)) {
            throw new ApiException("Région non trouvée avec l'UUID: " + regionUuid);
        }

        // Mettre à jour le statut
        Region updatedRegion = regionRepository.updateStatus(regionUuid, request.getActif())
                .orElseThrow(() -> new ApiException("Région non trouvée avec l'UUID: " + regionUuid));

        log.info("Statut de la région mis à jour avec succès: UUID={}, actif={}", regionUuid, request.getActif());
        return mapToResponse(updatedRegion);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegionResponse> getAllRegions() {
        log.info("Récupération de toutes les régions");

        List<Region> regions = regionRepository.findAll();
        log.info("Nombre de régions trouvées: {}", regions.size());

        return regions.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegionResponse> getActiveRegions() {
        log.info("Récupération des régions actives");

        List<Region> regions = regionRepository.findAllActive();
        log.info("Nombre de régions actives trouvées: {}", regions.size());

        return regions.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RegionResponse getRegionByUuid(String regionUuid) {
        log.info("Récupération de la région: {}", regionUuid);

        Region region = regionRepository.findByUuid(regionUuid)
                .orElseThrow(() -> new ApiException("Région non trouvée avec l'UUID: " + regionUuid));

        return mapToResponse(region);
    }

    /**
     * Convertit une entité Region en RegionResponse.
     *
     * @param region L'entité à convertir
     * @return Le DTO de réponse
     */
    private RegionResponse mapToResponse(Region region) {
        return RegionResponse.builder()
                .regionId(region.getRegionId())
                .regionUuid(region.getRegionUuid())
                .libelle(region.getLibelle())
                .code(region.getCode())
                .actif(region.getActif())
                .createdAt(region.getCreatedAt())
                .updatedAt(region.getUpdatedAt())
                .build();
    }
}