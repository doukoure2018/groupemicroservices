package io.multi.billetterieservice.service;


import io.multi.billetterieservice.dto.RegionCreateRequest;
import io.multi.billetterieservice.dto.RegionStatusRequest;
import io.multi.billetterieservice.dto.RegionUpdateRequest;
import io.multi.billetterieservice.response.RegionResponse;

import java.util.List;

/**
 * Service pour la gestion des régions.
 */
public interface RegionService {

    /**
     * Crée une nouvelle région.
     *
     * @param request Les données de la région à créer
     * @return La région créée
     */
    RegionResponse createRegion(RegionCreateRequest request);

    /**
     * Met à jour le libellé et le code d'une région.
     *
     * @param regionUuid L'UUID de la région à mettre à jour
     * @param request    Les nouvelles données
     * @return La région mise à jour
     */
    RegionResponse updateRegion(String regionUuid, RegionUpdateRequest request);

    /**
     * Active ou désactive une région.
     *
     * @param regionUuid L'UUID de la région
     * @param request    Le nouveau statut
     * @return La région mise à jour
     */
    RegionResponse updateRegionStatus(String regionUuid, RegionStatusRequest request);

    /**
     * Récupère toutes les régions.
     *
     * @return Liste de toutes les régions
     */
    List<RegionResponse> getAllRegions();

    /**
     * Récupère toutes les régions actives.
     *
     * @return Liste des régions actives
     */
    List<RegionResponse> getActiveRegions();

    /**
     * Récupère une région par son UUID.
     *
     * @param regionUuid L'UUID de la région
     * @return La région trouvée
     */
    RegionResponse getRegionByUuid(String regionUuid);
}