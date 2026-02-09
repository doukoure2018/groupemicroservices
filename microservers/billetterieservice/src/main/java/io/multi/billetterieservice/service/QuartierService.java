package io.multi.billetterieservice.service;


import io.multi.billetterieservice.dto.QuartierCreateRequest;
import io.multi.billetterieservice.dto.QuartierUpdateRequest;
import io.multi.billetterieservice.response.QuartierResponse;

import java.util.List;

/**
 * Service pour la gestion des quartiers.
 */
public interface QuartierService {

    QuartierResponse createQuartier(QuartierCreateRequest request);

    QuartierResponse updateQuartier(String quartierUuid, QuartierUpdateRequest request);

    QuartierResponse updateQuartierStatus(String quartierUuid, Boolean actif);

    List<QuartierResponse> getAllQuartiers();

    List<QuartierResponse> getActiveQuartiers();

    List<QuartierResponse> getQuartiersByCommune(String communeUuid);

    List<QuartierResponse> getActiveQuartiersByCommune(String communeUuid);

    List<QuartierResponse> getQuartiersByVille(String villeUuid);

    List<QuartierResponse> getQuartiersByRegion(String regionUuid);

    QuartierResponse getQuartierByUuid(String quartierUuid);
}
