package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Arrivee;

import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité Arrivee
 */
public interface ArriveeRepository {

    /**
     * Récupère toutes les arrivées
     */
    List<Arrivee> findAll();

    /**
     * Récupère toutes les arrivées actives
     */
    List<Arrivee> findAllActifs();

    /**
     * Trouve une arrivée par son UUID
     */
    Optional<Arrivee> findByUuid(String uuid);

    /**
     * Trouve une arrivée par son ID
     */
    Optional<Arrivee> findById(Long id);

    /**
     * Trouve les arrivées par site (ID)
     */
    List<Arrivee> findBySite(Long siteId);

    /**
     * Trouve les arrivées par site (UUID)
     */
    List<Arrivee> findBySiteUuid(String siteUuid);

    /**
     * Trouve les arrivées par départ (ID)
     */
    List<Arrivee> findByDepart(Long departId);

    /**
     * Trouve les arrivées par départ (UUID)
     */
    List<Arrivee> findByDepartUuid(String departUuid);

    /**
     * Trouve les arrivées par ville d'arrivée
     */
    List<Arrivee> findByVilleArrivee(String villeUuid);

    /**
     * Trouve les arrivées par ville de départ
     */
    List<Arrivee> findByVilleDepart(String villeUuid);

    /**
     * Trouve les arrivées pour un trajet (départ + ville d'arrivée)
     */
    List<Arrivee> findByDepartAndVilleArrivee(String departUuid, String villeArriveeUuid);

    /**
     * Recherche les arrivées par libellé
     */
    List<Arrivee> searchByLibelle(String searchTerm);

    /**
     * Vérifie si une arrivée existe avec ce libellé, ce site et ce départ
     */
    boolean existsByLibelleAndSiteAndDepart(String libelle, Long siteId, Long departId);

    /**
     * Vérifie si une arrivée existe avec ce libellé, ce site et ce départ (hors UUID donné)
     */
    boolean existsByLibelleAndSiteAndDepartExcludingUuid(String libelle, Long siteId, Long departId, String excludeUuid);

    /**
     * Sauvegarde une nouvelle arrivée
     */
    Arrivee save(Arrivee arrivee);

    /**
     * Met à jour une arrivée existante
     */
    Arrivee update(Arrivee arrivee);

    /**
     * Met à jour le statut actif d'une arrivée
     */
    int updateActif(String uuid, boolean actif);

    /**
     * Supprime une arrivée par son UUID
     */
    int deleteByUuid(String uuid);

    /**
     * Vérifie si l'arrivée est utilisée dans des trajets
     */
    boolean hasTrajets(String uuid);

    /**
     * Compte toutes les arrivées
     */
    long count();

    /**
     * Compte les arrivées actives
     */
    long countActifs();

    /**
     * Compte les arrivées par site
     */
    long countBySite(Long siteId);

    /**
     * Compte les arrivées par départ
     */
    long countByDepart(Long departId);
}