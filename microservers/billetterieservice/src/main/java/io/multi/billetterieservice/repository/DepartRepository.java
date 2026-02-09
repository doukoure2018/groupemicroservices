package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Depart;

import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité Depart
 */
public interface DepartRepository {

    /**
     * Récupère tous les départs
     */
    List<Depart> findAll();

    /**
     * Récupère tous les départs actifs
     */
    List<Depart> findAllActifs();

    /**
     * Trouve un départ par son UUID
     */
    Optional<Depart> findByUuid(String uuid);

    /**
     * Trouve un départ par son ID
     */
    Optional<Depart> findById(Long id);

    /**
     * Trouve les départs par site (ID)
     */
    List<Depart> findBySite(Long siteId);

    /**
     * Trouve les départs par site (UUID)
     */
    List<Depart> findBySiteUuid(String siteUuid);

    /**
     * Trouve les départs actifs par site (UUID)
     */
    List<Depart> findBySiteUuidActifs(String siteUuid);

    /**
     * Trouve les départs par ville
     */
    List<Depart> findByVille(String villeUuid);

    /**
     * Recherche les départs par libellé
     */
    List<Depart> searchByLibelle(String searchTerm);

    /**
     * Vérifie si un départ existe avec ce libellé et ce site
     */
    boolean existsByLibelleAndSite(String libelle, Long siteId);

    /**
     * Vérifie si un départ existe avec ce libellé et ce site (hors UUID donné)
     */
    boolean existsByLibelleAndSiteExcludingUuid(String libelle, Long siteId, String excludeUuid);

    /**
     * Sauvegarde un nouveau départ
     */
    Depart save(Depart depart);

    /**
     * Met à jour un départ existant
     */
    Depart update(Depart depart);

    /**
     * Met à jour le statut actif d'un départ
     */
    int updateActif(String uuid, boolean actif);

    /**
     * Supprime un départ par son UUID
     */
    int deleteByUuid(String uuid);

    /**
     * Vérifie si le départ a des arrivées
     */
    boolean hasArrivees(String uuid);

    /**
     * Compte tous les départs
     */
    long count();

    /**
     * Compte les départs actifs
     */
    long countActifs();

    /**
     * Compte les départs par site
     */
    long countBySite(Long siteId);
}