package io.multi.billetterieservice.repository;
import io.multi.billetterieservice.domain.Ville;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des villes.
 */
public interface VilleRepository {

    /**
     * Crée une nouvelle ville.
     *
     * @param ville La ville à créer
     * @return La ville créée avec son ID et UUID générés
     */
    Ville save(Ville ville);

    /**
     * Met à jour une ville (libellé, code postal et optionnellement la région).
     *
     * @param villeUuid  L'UUID de la ville à mettre à jour
     * @param libelle    Le nouveau libellé
     * @param codePostal Le nouveau code postal
     * @param regionId   Le nouvel ID de région (peut être null pour ne pas changer)
     * @return La ville mise à jour, ou Optional.empty() si non trouvée
     */
    Optional<Ville> update(String villeUuid, String libelle, String codePostal, Long regionId);

    /**
     * Active ou désactive une ville.
     *
     * @param villeUuid L'UUID de la ville
     * @param actif     Le nouveau statut
     * @return La ville mise à jour, ou Optional.empty() si non trouvée
     */
    Optional<Ville> updateStatus(String villeUuid, Boolean actif);

    /**
     * Récupère toutes les villes avec les informations de région.
     *
     * @return Liste de toutes les villes
     */
    List<Ville> findAll();

    /**
     * Récupère toutes les villes actives.
     *
     * @return Liste des villes actives
     */
    List<Ville> findAllActive();

    /**
     * Récupère les villes d'une région spécifique.
     *
     * @param regionUuid L'UUID de la région
     * @return Liste des villes de la région
     */
    List<Ville> findByRegionUuid(String regionUuid);

    /**
     * Récupère les villes actives d'une région spécifique.
     *
     * @param regionUuid L'UUID de la région
     * @return Liste des villes actives de la région
     */
    List<Ville> findActiveByRegionUuid(String regionUuid);

    /**
     * Recherche une ville par son UUID.
     *
     * @param villeUuid L'UUID de la ville
     * @return La ville trouvée, ou Optional.empty() si non trouvée
     */
    Optional<Ville> findByUuid(String villeUuid);

    /**
     * Recherche une ville par son ID.
     *
     * @param villeId L'ID de la ville
     * @return La ville trouvée, ou Optional.empty() si non trouvée
     */
    Optional<Ville> findById(Long villeId);

    /**
     * Vérifie si un libellé existe déjà dans une région.
     *
     * @param libelle    Le libellé à vérifier
     * @param regionUuid L'UUID de la région
     * @return true si le libellé existe dans la région, false sinon
     */
    boolean existsByLibelleAndRegion(String libelle, String regionUuid);

    /**
     * Vérifie si un libellé existe déjà dans une région pour une autre ville.
     *
     * @param libelle    Le libellé à vérifier
     * @param regionUuid L'UUID de la région
     * @param villeUuid  L'UUID de la ville à exclure
     * @return true si le libellé existe pour une autre ville, false sinon
     */
    boolean existsByLibelleAndRegionAndNotUuid(String libelle, String regionUuid, String villeUuid);

    /**
     * Vérifie si une ville existe par son UUID.
     *
     * @param villeUuid L'UUID de la ville
     * @return true si la ville existe, false sinon
     */
    boolean existsByUuid(String villeUuid);

    /**
     * Récupère l'ID d'une région à partir de son UUID.
     *
     * @param regionUuid L'UUID de la région
     * @return L'ID de la région, ou Optional.empty() si non trouvée
     */
    Optional<Long> findRegionIdByUuid(String regionUuid);

    /**
     * Compte le nombre total de villes.
     *
     * @return Le nombre total de villes
     */
    long countAll();

    /**
     * Compte le nombre de villes actives.
     *
     * @return Le nombre de villes actives
     */
    long countActive();

    /**
     * Compte le nombre de villes dans une région.
     *
     * @param regionUuid L'UUID de la région
     * @return Le nombre de villes dans la région
     */
    long countByRegion(String regionUuid);
}