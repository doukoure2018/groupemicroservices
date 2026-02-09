package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Site;

import java.util.List;
import java.util.Optional;

public interface SiteRepository {

    /**
     * Récupère tous les sites
     */
    List<Site> findAll();

    /**
     * Récupère tous les sites actifs
     */
    List<Site> findAllActifs();

    /**
     * Trouve un site par son UUID
     */
    Optional<Site> findByUuid(String uuid);

    /**
     * Trouve un site par son ID
     */
    Optional<Site> findById(Long id);

    /**
     * Trouve les sites par type
     */
    List<Site> findByTypeSite(String typeSite);

    /**
     * Trouve les sites par localisation
     */
    List<Site> findByLocalisation(Long localisationId);

    /**
     * Trouve les sites par ville
     */
    List<Site> findByVille(String villeUuid);

    /**
     * Trouve les sites par commune
     */
    List<Site> findByCommune(String communeUuid);

    /**
     * Recherche les sites par nom
     */
    List<Site> searchByNom(String searchTerm);

    /**
     * Vérifie si un site existe avec ce nom et cette localisation
     */
    boolean existsByNomAndLocalisation(String nom, Long localisationId);

    /**
     * Vérifie si un site existe avec ce nom et cette localisation (hors UUID donné)
     */
    boolean existsByNomAndLocalisationExcludingUuid(String nom, Long localisationId, String excludeUuid);

    /**
     * Sauvegarde un nouveau site
     */
    Site save(Site site);

    /**
     * Met à jour un site existant
     */
    Site update(Site site);

    /**
     * Met à jour le statut actif d'un site
     */
    int updateActif(String uuid, boolean actif);

    /**
     * Supprime un site par son UUID
     */
    int deleteByUuid(String uuid);

    /**
     * Vérifie si le site a des départs
     */
    boolean hasDeparts(String uuid);

    /**
     * Vérifie si le site a des arrivées
     */
    boolean hasArrivees(String uuid);

    /**
     * Compte tous les sites
     */
    long count();

    /**
     * Compte les sites actifs
     */
    long countActifs();
}