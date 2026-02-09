package io.multi.billetterieservice.service;

import io.multi.billetterieservice.dto.LocalisationCreateRequest;
import io.multi.billetterieservice.dto.LocalisationUpdateRequest;
import io.multi.billetterieservice.response.LocalisationResponse;

import java.util.List;

/**
 * Service pour la gestion des localisations.
 */
public interface LocalisationService {

    LocalisationResponse createLocalisation(LocalisationCreateRequest request);

    LocalisationResponse updateLocalisation(String localisationUuid, LocalisationUpdateRequest request);

    void deleteLocalisation(String localisationUuid);

    List<LocalisationResponse> getAllLocalisations();

    List<LocalisationResponse> getLocalisationsWithQuartier();

    List<LocalisationResponse> getLocalisationsWithoutQuartier();

    List<LocalisationResponse> getLocalisationsByQuartier(String quartierUuid);

    List<LocalisationResponse> getLocalisationsByCommune(String communeUuid);

    List<LocalisationResponse> getLocalisationsByVille(String villeUuid);

    List<LocalisationResponse> getLocalisationsByRegion(String regionUuid);

    LocalisationResponse getLocalisationByUuid(String localisationUuid);

    List<LocalisationResponse> searchLocalisations(String searchTerm);
}
