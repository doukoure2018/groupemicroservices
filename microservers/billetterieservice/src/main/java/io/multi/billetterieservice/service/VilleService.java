package io.multi.billetterieservice.service;

import io.multi.billetterieservice.dto.VilleCreateRequest;
import io.multi.billetterieservice.dto.VilleUpdateRequest;
import io.multi.billetterieservice.response.VilleResponse;

import java.util.List;

/**
 * Service pour la gestion des villes.
 */
public interface VilleService {

    /**
     * Crée une nouvelle ville.
     *
     * @param request Les données de la ville à créer
     * @return La ville créée
     */
    VilleResponse createVille(VilleCreateRequest request);

    /**
     * Met à jour une ville.
     *
     * @param villeUuid L'UUID de la ville à mettre à jour
     * @param request   Les nouvelles données
     * @return La ville mise à jour
     */
    VilleResponse updateVille(String villeUuid, VilleUpdateRequest request);

    /**
     * Active ou désactive une ville.
     *
     * @param villeUuid L'UUID de la ville
     * @param actif     Le nouveau statut
     * @return La ville mise à jour
     */
    VilleResponse updateVilleStatus(String villeUuid, Boolean actif);

    /**
     * Récupère toutes les villes.
     *
     * @return Liste de toutes les villes
     */
    List<VilleResponse> getAllVilles();

    /**
     * Récupère toutes les villes actives.
     *
     * @return Liste des villes actives
     */
    List<VilleResponse> getActiveVilles();

    /**
     * Récupère les villes d'une région.
     *
     * @param regionUuid L'UUID de la région
     * @return Liste des villes de la région
     */
    List<VilleResponse> getVillesByRegion(String regionUuid);

    /**
     * Récupère les villes actives d'une région.
     *
     * @param regionUuid L'UUID de la région
     * @return Liste des villes actives de la région
     */
    List<VilleResponse> getActiveVillesByRegion(String regionUuid);

    /**
     * Récupère une ville par son UUID.
     *
     * @param villeUuid L'UUID de la ville
     * @return La ville trouvée
     */
    VilleResponse getVilleByUuid(String villeUuid);
}