package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Offre;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité Offre.
 */
public interface OffreRepository {

    // ========== LECTURE ==========

    List<Offre> findAll();

    List<Offre> findAllOuvertes();

    Optional<Offre> findByUuid(String uuid);

    Optional<Offre> findById(Long id);

    Optional<Offre> findByToken(String token);

    List<Offre> findByTrajet(String trajetUuid);

    List<Offre> findByVehicule(String vehiculeUuid);

    List<Offre> findByUser(Long userId);

    List<Offre> findByStatut(String statut);

    List<Offre> findByDateDepart(LocalDate dateDepart);

    List<Offre> findByVilles(String villeDepartUuid, String villeArriveeUuid);

    List<Offre> findByVillesAndDate(String villeDepartUuid, String villeArriveeUuid, LocalDate dateDepart);

    List<Offre> findAvecPlacesDisponibles(int nombrePlaces);

    List<Offre> findByVilleDepart(String villeDepartUuid);

    List<Offre> findByVilleArrivee(String villeArriveeUuid);

    List<Offre> findAujourdHui();

    List<Offre> findAVenir();

    List<Offre> findPassees();

    List<Offre> findEnPromotion();

    List<Offre> search(String searchTerm);

    // ========== VÉRIFICATION ==========

    boolean existsByToken(String token);

    boolean existsOffreActiveVehiculeDate(String vehiculeUuid, LocalDate dateDepart);

    boolean existsOffreActiveVehiculeDateExcluding(String vehiculeUuid, LocalDate dateDepart, String excludeUuid);

    boolean hasReservations(String uuid);

    int countReservationsConfirmees(String uuid);

    // ========== ÉCRITURE ==========

    Offre save(Offre offre);

    Offre update(Offre offre);

    int updateStatut(String uuid, String statut);

    int updatePlaces(String uuid, int nombrePlacesDisponibles, int nombrePlacesReservees, int niveauRemplissage);

    int updatePromotion(String uuid, BigDecimal montantPromotion);

    int updateDatesEffectives(String uuid, OffsetDateTime dateDepartEffectif, OffsetDateTime dateArriveeEffective);

    int cloturer(String uuid);

    int deleteByUuid(String uuid);

    // ========== COMPTAGE ==========

    long count();

    long countByStatut(String statut);

    long countByUser(Long userId);

    long countByTrajet(String trajetUuid);

    long countByVehicule(String vehiculeUuid);

    long countAujourdHui();

    long countOuvertes();
}