package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Commune;
import io.multi.billetterieservice.dto.CommuneCreateRequest;
import io.multi.billetterieservice.dto.CommuneUpdateRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.CommuneRepository;
import io.multi.billetterieservice.response.CommuneResponse;
import io.multi.billetterieservice.service.CommuneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des communes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CommuneServiceImpl implements CommuneService {

    private final CommuneRepository communeRepository;

    @Override
    public CommuneResponse createCommune(CommuneCreateRequest request) {
        log.info("Création d'une nouvelle commune: {} dans la ville: {}", request.getLibelle(), request.getVilleUuid());

        // Récupérer l'ID de la ville
        Long villeId = communeRepository.findVilleIdByUuid(request.getVilleUuid())
                .orElseThrow(() -> new ApiException("Ville non trouvée avec l'UUID: " + request.getVilleUuid()));

        // Vérifier si le libellé existe déjà dans la ville
        if (communeRepository.existsByLibelleAndVille(request.getLibelle(), request.getVilleUuid())) {
            throw new ApiException("Une commune existe déjà avec le libellé '" + request.getLibelle() + "' dans cette ville");
        }

        // Créer l'entité commune
        Commune commune = Commune.builder()
                .villeId(villeId)
                .libelle(request.getLibelle())
                .actif(true)
                .build();

        // Sauvegarder
        Commune savedCommune = communeRepository.save(commune);
        log.info("Commune créée avec succès: UUID={}", savedCommune.getCommuneUuid());

        // Récupérer avec les informations complètes
        return communeRepository.findByUuid(savedCommune.getCommuneUuid())
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la commune créée"));
    }

    @Override
    public CommuneResponse updateCommune(String communeUuid, CommuneUpdateRequest request) {
        log.info("Mise à jour de la commune: {}", communeUuid);

        // Vérifier si la commune existe
        Commune existingCommune = communeRepository.findByUuid(communeUuid)
                .orElseThrow(() -> new ApiException("Commune non trouvée avec l'UUID: " + communeUuid));

        // Déterminer la ville pour la vérification du doublon
        String villeUuidForCheck = request.getVilleUuid() != null ? request.getVilleUuid() : existingCommune.getVilleUuid();

        // Vérifier si le nouveau libellé n'est pas déjà utilisé par une autre commune dans la ville
        if (communeRepository.existsByLibelleAndVilleAndNotUuid(request.getLibelle(), villeUuidForCheck, communeUuid)) {
            throw new ApiException("Une commune existe déjà avec le libellé '" + request.getLibelle() + "' dans cette ville");
        }

        // Si changement de ville, récupérer le nouvel ID
        Long newVilleId = null;
        if (request.getVilleUuid() != null && !request.getVilleUuid().equals(existingCommune.getVilleUuid())) {
            newVilleId = communeRepository.findVilleIdByUuid(request.getVilleUuid())
                    .orElseThrow(() -> new ApiException("Ville non trouvée avec l'UUID: " + request.getVilleUuid()));
        }

        // Mettre à jour
        communeRepository.update(communeUuid, request.getLibelle(), newVilleId)
                .orElseThrow(() -> new ApiException("Erreur lors de la mise à jour de la commune"));

        log.info("Commune mise à jour avec succès: UUID={}", communeUuid);

        // Récupérer avec les informations complètes
        return communeRepository.findByUuid(communeUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la commune mise à jour"));
    }

    @Override
    public CommuneResponse updateCommuneStatus(String communeUuid, Boolean actif) {
        log.info("Mise à jour du statut de la commune: {} -> actif={}", communeUuid, actif);

        // Vérifier si la commune existe
        if (!communeRepository.existsByUuid(communeUuid)) {
            throw new ApiException("Commune non trouvée avec l'UUID: " + communeUuid);
        }

        // Mettre à jour le statut
        communeRepository.updateStatus(communeUuid, actif)
                .orElseThrow(() -> new ApiException("Erreur lors de la mise à jour du statut de la commune"));

        log.info("Statut de la commune mis à jour avec succès: UUID={}, actif={}", communeUuid, actif);

        // Récupérer avec les informations complètes
        return communeRepository.findByUuid(communeUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la commune mise à jour"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommuneResponse> getAllCommunes() {
        log.info("Récupération de toutes les communes");
        List<Commune> communes = communeRepository.findAll();
        log.info("Nombre de communes trouvées: {}", communes.size());
        return communes.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommuneResponse> getActiveCommunes() {
        log.info("Récupération des communes actives");
        List<Commune> communes = communeRepository.findAllActive();
        log.info("Nombre de communes actives trouvées: {}", communes.size());
        return communes.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommuneResponse> getCommunesByVille(String villeUuid) {
        log.info("Récupération des communes de la ville: {}", villeUuid);
        List<Commune> communes = communeRepository.findByVilleUuid(villeUuid);
        log.info("Nombre de communes trouvées: {}", communes.size());
        return communes.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommuneResponse> getActiveCommunesByVille(String villeUuid) {
        log.info("Récupération des communes actives de la ville: {}", villeUuid);
        List<Commune> communes = communeRepository.findActiveByVilleUuid(villeUuid);
        log.info("Nombre de communes actives trouvées: {}", communes.size());
        return communes.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommuneResponse> getCommunesByRegion(String regionUuid) {
        log.info("Récupération des communes de la région: {}", regionUuid);
        List<Commune> communes = communeRepository.findByRegionUuid(regionUuid);
        log.info("Nombre de communes trouvées: {}", communes.size());
        return communes.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CommuneResponse getCommuneByUuid(String communeUuid) {
        log.info("Récupération de la commune: {}", communeUuid);
        Commune commune = communeRepository.findByUuid(communeUuid)
                .orElseThrow(() -> new ApiException("Commune non trouvée avec l'UUID: " + communeUuid));
        return mapToResponse(commune);
    }

    private CommuneResponse mapToResponse(Commune commune) {
        return CommuneResponse.builder()
                .communeId(commune.getCommuneId())
                .communeUuid(commune.getCommuneUuid())
                .libelle(commune.getLibelle())
                .actif(commune.getActif())
                .villeId(commune.getVilleId())
                .villeUuid(commune.getVilleUuid())
                .villeLibelle(commune.getVilleLibelle())
                .regionUuid(commune.getRegionUuid())
                .regionLibelle(commune.getRegionLibelle())
                .createdAt(commune.getCreatedAt())
                .updatedAt(commune.getUpdatedAt())
                .build();
    }
}

