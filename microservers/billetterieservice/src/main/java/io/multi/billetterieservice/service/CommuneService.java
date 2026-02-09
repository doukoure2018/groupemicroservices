package io.multi.billetterieservice.service;

import io.multi.billetterieservice.dto.CommuneCreateRequest;
import io.multi.billetterieservice.dto.CommuneUpdateRequest;
import io.multi.billetterieservice.response.CommuneResponse;

import java.util.List;

/**
 * Service pour la gestion des communes.
 */
public interface CommuneService {

    CommuneResponse createCommune(CommuneCreateRequest request);

    CommuneResponse updateCommune(String communeUuid, CommuneUpdateRequest request);

    CommuneResponse updateCommuneStatus(String communeUuid, Boolean actif);

    List<CommuneResponse> getAllCommunes();

    List<CommuneResponse> getActiveCommunes();

    List<CommuneResponse> getCommunesByVille(String villeUuid);

    List<CommuneResponse> getActiveCommunesByVille(String villeUuid);

    List<CommuneResponse> getCommunesByRegion(String regionUuid);

    CommuneResponse getCommuneByUuid(String communeUuid);
}