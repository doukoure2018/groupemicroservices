package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Localisation;
import io.multi.billetterieservice.dto.LocalisationCreateRequest;
import io.multi.billetterieservice.dto.LocalisationUpdateRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.LocalisationRepository;
import io.multi.billetterieservice.response.LocalisationResponse;
import io.multi.billetterieservice.service.LocalisationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des localisations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LocalisationServiceImpl implements LocalisationService {

    private final LocalisationRepository localisationRepository;

    @Override
    public LocalisationResponse createLocalisation(LocalisationCreateRequest request) {
        log.info("Création d'une nouvelle localisation: {}", request.getAdresseComplete());

        // Vérifier si l'adresse existe déjà
        if (localisationRepository.existsByAdresse(request.getAdresseComplete())) {
            throw new ApiException("Une localisation existe déjà avec cette adresse: " + request.getAdresseComplete());
        }

        // Récupérer l'ID du quartier si fourni
        Long quartierId = null;
        if (request.getQuartierUuid() != null && !request.getQuartierUuid().isBlank()) {
            quartierId = localisationRepository.findQuartierIdByUuid(request.getQuartierUuid())
                    .orElseThrow(() -> new ApiException("Quartier non trouvé avec l'UUID: " + request.getQuartierUuid()));
        }

        // Créer l'entité localisation
        Localisation localisation = Localisation.builder()
                .quartierId(quartierId)
                .adresseComplete(request.getAdresseComplete())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .description(request.getDescription())
                .build();

        // Sauvegarder
        Localisation savedLocalisation = localisationRepository.save(localisation);
        log.info("Localisation créée avec succès: UUID={}", savedLocalisation.getLocalisationUuid());

        // Récupérer avec les informations complètes
        return localisationRepository.findByUuid(savedLocalisation.getLocalisationUuid())
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la localisation créée"));
    }

    @Override
    public LocalisationResponse updateLocalisation(String localisationUuid, LocalisationUpdateRequest request) {
        log.info("Mise à jour de la localisation: {}", localisationUuid);

        // Vérifier si la localisation existe
        Localisation existingLocalisation = localisationRepository.findByUuid(localisationUuid)
                .orElseThrow(() -> new ApiException("Localisation non trouvée avec l'UUID: " + localisationUuid));

        // Vérifier si la nouvelle adresse n'est pas déjà utilisée par une autre localisation
        if (localisationRepository.existsByAdresseAndNotUuid(request.getAdresseComplete(), localisationUuid)) {
            throw new ApiException("Une localisation existe déjà avec cette adresse: " + request.getAdresseComplete());
        }

        // Déterminer le quartier_id
        Long newQuartierId = existingLocalisation.getQuartierId();

        // Si on demande de retirer le quartier
        if (Boolean.TRUE.equals(request.getRemoveQuartier())) {
            newQuartierId = null;
        }
        // Sinon, si un nouveau quartier est fourni
        else if (request.getQuartierUuid() != null && !request.getQuartierUuid().isBlank()) {
            newQuartierId = localisationRepository.findQuartierIdByUuid(request.getQuartierUuid())
                    .orElseThrow(() -> new ApiException("Quartier non trouvé avec l'UUID: " + request.getQuartierUuid()));
        }

        // Mettre à jour
        localisationRepository.update(
                localisationUuid,
                newQuartierId,
                request.getAdresseComplete(),
                request.getLatitude(),
                request.getLongitude(),
                request.getDescription()
        ).orElseThrow(() -> new ApiException("Erreur lors de la mise à jour de la localisation"));

        log.info("Localisation mise à jour avec succès: UUID={}", localisationUuid);

        // Récupérer avec les informations complètes
        return localisationRepository.findByUuid(localisationUuid)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ApiException("Erreur lors de la récupération de la localisation mise à jour"));
    }

    @Override
    public void deleteLocalisation(String localisationUuid) {
        log.info("Suppression de la localisation: {}", localisationUuid);

        // Vérifier si la localisation existe
        if (!localisationRepository.existsByUuid(localisationUuid)) {
            throw new ApiException("Localisation non trouvée avec l'UUID: " + localisationUuid);
        }

        // Supprimer
        boolean deleted = localisationRepository.delete(localisationUuid);
        if (!deleted) {
            throw new ApiException("Erreur lors de la suppression de la localisation");
        }

        log.info("Localisation supprimée avec succès: UUID={}", localisationUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getAllLocalisations() {
        log.info("Récupération de toutes les localisations");
        List<Localisation> localisations = localisationRepository.findAll();
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getLocalisationsWithQuartier() {
        log.info("Récupération des localisations avec quartier");
        List<Localisation> localisations = localisationRepository.findAllWithQuartier();
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getLocalisationsWithoutQuartier() {
        log.info("Récupération des localisations sans quartier");
        List<Localisation> localisations = localisationRepository.findAllWithoutQuartier();
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getLocalisationsByQuartier(String quartierUuid) {
        log.info("Récupération des localisations du quartier: {}", quartierUuid);
        List<Localisation> localisations = localisationRepository.findByQuartierUuid(quartierUuid);
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getLocalisationsByCommune(String communeUuid) {
        log.info("Récupération des localisations de la commune: {}", communeUuid);
        List<Localisation> localisations = localisationRepository.findByCommuneUuid(communeUuid);
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getLocalisationsByVille(String villeUuid) {
        log.info("Récupération des localisations de la ville: {}", villeUuid);
        List<Localisation> localisations = localisationRepository.findByVilleUuid(villeUuid);
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> getLocalisationsByRegion(String regionUuid) {
        log.info("Récupération des localisations de la région: {}", regionUuid);
        List<Localisation> localisations = localisationRepository.findByRegionUuid(regionUuid);
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public LocalisationResponse getLocalisationByUuid(String localisationUuid) {
        log.info("Récupération de la localisation: {}", localisationUuid);
        Localisation localisation = localisationRepository.findByUuid(localisationUuid)
                .orElseThrow(() -> new ApiException("Localisation non trouvée avec l'UUID: " + localisationUuid));
        return mapToResponse(localisation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalisationResponse> searchLocalisations(String searchTerm) {
        log.info("Recherche des localisations avec le terme: {}", searchTerm);
        List<Localisation> localisations = localisationRepository.searchByAddress(searchTerm);
        log.info("Nombre de localisations trouvées: {}", localisations.size());
        return localisations.stream().map(this::mapToResponse).toList();
    }

    private LocalisationResponse mapToResponse(Localisation localisation) {
        return LocalisationResponse.builder()
                .localisationId(localisation.getLocalisationId())
                .localisationUuid(localisation.getLocalisationUuid())
                .adresseComplete(localisation.getAdresseComplete())
                .latitude(localisation.getLatitude())
                .longitude(localisation.getLongitude())
                .description(localisation.getDescription())
                .quartierId(localisation.getQuartierId())
                .quartierUuid(localisation.getQuartierUuid())
                .quartierLibelle(localisation.getQuartierLibelle())
                .communeUuid(localisation.getCommuneUuid())
                .communeLibelle(localisation.getCommuneLibelle())
                .villeUuid(localisation.getVilleUuid())
                .villeLibelle(localisation.getVilleLibelle())
                .regionUuid(localisation.getRegionUuid())
                .regionLibelle(localisation.getRegionLibelle())
                .createdAt(localisation.getCreatedAt())
                .updatedAt(localisation.getUpdatedAt())
                .build();
    }
}