package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Quartier;
import io.multi.billetterieservice.dto.QuartierCreateRequest;
import io.multi.billetterieservice.dto.QuartierUpdateRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.QuartierRepository;
import io.multi.billetterieservice.response.QuartierResponse;
import io.multi.billetterieservice.service.QuartierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des quartiers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class QuartierServiceImpl implements QuartierService {

    private final QuartierRepository quartierRepository;

    @Override
    public QuartierResponse createQuartier(QuartierCreateRequest request) {
        log.info("Création d'un nouveau quartier: {} dans la commune: {}", request.getLibelle(), request.getCommuneUuid());

        // Récupérer l'ID de la commune
        Long communeId = quartierRepository.findCommuneIdByUuid(request.getCommuneUuid())
                .orElseThrow(() -> new ApiException("Commune non trouvée avec l'UUID: " + request.getCommuneUuid()));

        // Vérifier si le libellé existe déjà dans la commune
        if (quartierRepository.existsByLibelleAndCommune(request.getLibelle(), request.getCommuneUuid())) {
            throw new ApiException("Un quartier existe déjà avec le libellé '" + request.getLibelle() + "' dans cette commune");
        }

        // Créer l'entité quartier
        Quartier quartier = Quartier.builder()
                .communeId(communeId)
                .libelle(request.getLibelle())
                .actif(true)
                .build();

        // Sauvegarder
        Quartier savedQuartier = quartierRepository.save(quartier);
        log.info("Quartier créé avec succès: UUID={}", savedQuartier.getQuartierUuid());

        // Récupérer avec les informations complètes
        return quartierRepository.findByUuid(savedQuartier.getQuartierUuid())
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération du quartier créé"));
    }

    @Override
    public QuartierResponse updateQuartier(String quartierUuid, QuartierUpdateRequest request) {
        log.info("Mise à jour du quartier: {}", quartierUuid);

        // Vérifier si le quartier existe
        Quartier existingQuartier = quartierRepository.findByUuid(quartierUuid)
                .orElseThrow(() -> new ApiException("Quartier non trouvé avec l'UUID: " + quartierUuid));

        // Déterminer la commune pour la vérification du doublon
        String communeUuidForCheck = request.getCommuneUuid() != null ? request.getCommuneUuid() : existingQuartier.getCommuneUuid();

        // Vérifier si le nouveau libellé n'est pas déjà utilisé par un autre quartier dans la commune
        if (quartierRepository.existsByLibelleAndCommuneAndNotUuid(request.getLibelle(), communeUuidForCheck, quartierUuid)) {
            throw new ApiException("Un quartier existe déjà avec le libellé '" + request.getLibelle() + "' dans cette commune");
        }

        // Si changement de commune, récupérer le nouvel ID
        Long newCommuneId = null;
        if (request.getCommuneUuid() != null && !request.getCommuneUuid().equals(existingQuartier.getCommuneUuid())) {
            newCommuneId = quartierRepository.findCommuneIdByUuid(request.getCommuneUuid())
                    .orElseThrow(() -> new ApiException("Commune non trouvée avec l'UUID: " + request.getCommuneUuid()));
        }

        // Mettre à jour
        quartierRepository.update(quartierUuid, request.getLibelle(), newCommuneId)
                .orElseThrow(() -> new ApiException("Erreur lors de la mise à jour du quartier"));

        log.info("Quartier mis à jour avec succès: UUID={}", quartierUuid);

        // Récupérer avec les informations complètes
        return quartierRepository.findByUuid(quartierUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération du quartier mis à jour"));
    }

    @Override
    public QuartierResponse updateQuartierStatus(String quartierUuid, Boolean actif) {
        log.info("Mise à jour du statut du quartier: {} -> actif={}", quartierUuid, actif);

        // Vérifier si le quartier existe
        if (!quartierRepository.existsByUuid(quartierUuid)) {
            throw new ApiException("Quartier non trouvé avec l'UUID: " + quartierUuid);
        }

        // Mettre à jour le statut
        quartierRepository.updateStatus(quartierUuid, actif)
                .orElseThrow(() -> new ApiException("Erreur lors de la mise à jour du statut du quartier"));

        log.info("Statut du quartier mis à jour avec succès: UUID={}, actif={}", quartierUuid, actif);

        // Récupérer avec les informations complètes
        return quartierRepository.findByUuid(quartierUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération du quartier mis à jour"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> getAllQuartiers() {
        log.info("Récupération de tous les quartiers");
        List<Quartier> quartiers = quartierRepository.findAll();
        log.info("Nombre de quartiers trouvés: {}", quartiers.size());
        return quartiers.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> getActiveQuartiers() {
        log.info("Récupération des quartiers actifs");
        List<Quartier> quartiers = quartierRepository.findAllActive();
        log.info("Nombre de quartiers actifs trouvés: {}", quartiers.size());
        return quartiers.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> getQuartiersByCommune(String communeUuid) {
        log.info("Récupération des quartiers de la commune: {}", communeUuid);
        List<Quartier> quartiers = quartierRepository.findByCommuneUuid(communeUuid);
        log.info("Nombre de quartiers trouvés: {}", quartiers.size());
        return quartiers.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> getActiveQuartiersByCommune(String communeUuid) {
        log.info("Récupération des quartiers actifs de la commune: {}", communeUuid);
        List<Quartier> quartiers = quartierRepository.findActiveByCommuneUuid(communeUuid);
        log.info("Nombre de quartiers actifs trouvés: {}", quartiers.size());
        return quartiers.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> getQuartiersByVille(String villeUuid) {
        log.info("Récupération des quartiers de la ville: {}", villeUuid);
        List<Quartier> quartiers = quartierRepository.findByVilleUuid(villeUuid);
        log.info("Nombre de quartiers trouvés: {}", quartiers.size());
        return quartiers.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuartierResponse> getQuartiersByRegion(String regionUuid) {
        log.info("Récupération des quartiers de la région: {}", regionUuid);
        List<Quartier> quartiers = quartierRepository.findByRegionUuid(regionUuid);
        log.info("Nombre de quartiers trouvés: {}", quartiers.size());
        return quartiers.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuartierResponse getQuartierByUuid(String quartierUuid) {
        log.info("Récupération du quartier: {}", quartierUuid);
        Quartier quartier = quartierRepository.findByUuid(quartierUuid)
                .orElseThrow(() -> new ApiException("Quartier non trouvé avec l'UUID: " + quartierUuid));
        return mapToResponse(quartier);
    }

    private QuartierResponse mapToResponse(Quartier quartier) {
        return QuartierResponse.builder()
                .quartierId(quartier.getQuartierId())
                .quartierUuid(quartier.getQuartierUuid())
                .libelle(quartier.getLibelle())
                .actif(quartier.getActif())
                .communeId(quartier.getCommuneId())
                .communeUuid(quartier.getCommuneUuid())
                .communeLibelle(quartier.getCommuneLibelle())
                .villeUuid(quartier.getVilleUuid())
                .villeLibelle(quartier.getVilleLibelle())
                .regionUuid(quartier.getRegionUuid())
                .regionLibelle(quartier.getRegionLibelle())
                .createdAt(quartier.getCreatedAt())
                .updatedAt(quartier.getUpdatedAt())
                .build();
    }
}
