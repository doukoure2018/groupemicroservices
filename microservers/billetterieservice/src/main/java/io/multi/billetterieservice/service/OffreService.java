package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.dto.OffreRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Interface de service pour la gestion des offres de transport.
 */
public interface OffreService {

    // ========== LECTURE ==========

    List<Offre> getAll();

    List<Offre> getAllOuvertes();

    Offre getByUuid(String uuid);

    Offre getByToken(String token);

    List<Offre> getByTrajet(String trajetUuid);

    List<Offre> getByVehicule(String vehiculeUuid);

    List<Offre> getMesOffres(Long userId);

    List<Offre> getByStatut(String statut);

    List<Offre> getByDateDepart(LocalDate dateDepart);

    List<Offre> getByVilles(String villeDepartUuid, String villeArriveeUuid);

    List<Offre> getByVillesAndDate(String villeDepartUuid, String villeArriveeUuid, LocalDate dateDepart);

    List<Offre> getAvecPlacesDisponibles(int nombrePlaces);

    List<Offre> getByVilleDepart(String villeDepartUuid);

    List<Offre> getByVilleArrivee(String villeArriveeUuid);

    List<Offre> getAujourdHui();

    List<Offre> getAVenir();

    List<Offre> getPassees();

    List<Offre> getEnPromotion();

    List<Offre> search(String searchTerm);

    // ========== ÉCRITURE ==========

    /**
     * Crée une nouvelle offre
     * @param request Données de l'offre
     * @param userId ID de l'utilisateur propriétaire (depuis JWT)
     */
    Offre create(OffreRequest request, Long userId);

    Offre update(String uuid, OffreRequest request);

    // ========== GESTION DES STATUTS ==========

    Offre ouvrir(String uuid);

    Offre fermer(String uuid);

    Offre cloturer(String uuid);

    Offre annuler(String uuid);

    Offre demarrer(String uuid);

    Offre terminer(String uuid);

    Offre suspendre(String uuid);

    Offre reprendre(String uuid);

    // ========== GESTION DES PLACES ==========

    /**
     * Réserve des places (appelé lors d'une réservation)
     */
    Offre reserverPlaces(String uuid, int nombrePlaces);

    /**
     * Libère des places (appelé lors d'une annulation de réservation)
     */
    Offre libererPlaces(String uuid, int nombrePlaces);

    // ========== GESTION DES PROMOTIONS ==========

    Offre appliquerPromotion(String uuid, BigDecimal montantPromotion);

    Offre supprimerPromotion(String uuid);

    // ========== GESTION DES DATES EFFECTIVES ==========

    Offre enregistrerDepartEffectif(String uuid);

    Offre enregistrerArriveeEffective(String uuid);

    // ========== SUPPRESSION ==========

    void delete(String uuid);

    // ========== STATISTIQUES ==========

    long count();

    long countByStatut(String statut);

    long countByUser(Long userId);

    long countAujourdHui();

    long countOuvertes();
}