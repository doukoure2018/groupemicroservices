package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Region;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des régions.
 */
public interface RegionRepository {

    /**
     * Crée une nouvelle région.
     *
     * @param region La région à créer
     * @return La région créée avec son ID et UUID générés
     */
    Region save(Region region);

    /**
     * Met à jour le libellé et le code d'une région.
     *
     * @param regionUuid L'UUID de la région à mettre à jour
     * @param libelle    Le nouveau libellé
     * @param code       Le nouveau code
     * @return La région mise à jour, ou Optional.empty() si non trouvée
     */
    Optional<Region> update(String regionUuid, String libelle, String code);

    /**
     * Active ou désactive une région.
     *
     * @param regionUuid L'UUID de la région
     * @param actif      Le nouveau statut
     * @return La région mise à jour, ou Optional.empty() si non trouvée
     */
    Optional<Region> updateStatus(String regionUuid, Boolean actif);

    /**
     * Récupère toutes les régions.
     *
     * @return Liste de toutes les régions
     */
    List<Region> findAll();

    /**
     * Récupère toutes les régions actives.
     *
     * @return Liste des régions actives
     */
    List<Region> findAllActive();

    /**
     * Recherche une région par son UUID.
     *
     * @param regionUuid L'UUID de la région
     * @return La région trouvée, ou Optional.empty() si non trouvée
     */
    Optional<Region> findByUuid(String regionUuid);

    /**
     * Recherche une région par son ID.
     *
     * @param regionId L'ID de la région
     * @return La région trouvée, ou Optional.empty() si non trouvée
     */
    Optional<Region> findById(Long regionId);

    /**
     * Vérifie si un libellé existe déjà.
     *
     * @param libelle Le libellé à vérifier
     * @return true si le libellé existe, false sinon
     */
    boolean existsByLibelle(String libelle);

    /**
     * Vérifie si un libellé existe déjà pour une autre région.
     *
     * @param libelle    Le libellé à vérifier
     * @param regionUuid L'UUID de la région à exclure
     * @return true si le libellé existe pour une autre région, false sinon
     */
    boolean existsByLibelleAndNotUuid(String libelle, String regionUuid);

    /**
     * Vérifie si une région existe par son UUID.
     *
     * @param regionUuid L'UUID de la région
     * @return true si la région existe, false sinon
     */
    boolean existsByUuid(String regionUuid);

    /**
     * Compte le nombre total de régions.
     *
     * @return Le nombre total de régions
     */
    long countAll();

    /**
     * Compte le nombre de régions actives.
     *
     * @return Le nombre de régions actives
     */
    long countActive();
}