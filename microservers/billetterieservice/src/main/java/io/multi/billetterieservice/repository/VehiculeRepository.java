package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Vehicule;

import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité Vehicule.
 */
public interface VehiculeRepository {

    // ========== LECTURE ==========

    List<Vehicule> findAll();

    List<Vehicule> findAllActifs();

    Optional<Vehicule> findByUuid(String uuid);

    Optional<Vehicule> findById(Long id);

    Optional<Vehicule> findByImmatriculation(String immatriculation);

    List<Vehicule> findByUser(Long userId);

    List<Vehicule> findByTypeVehicule(String typeVehiculeUuid);

    List<Vehicule> findByStatut(String statut);

    List<Vehicule> findByNombrePlacesMin(int nombrePlacesMin);

    List<Vehicule> findClimatises();

    List<Vehicule> findAssuranceExpiree();

    List<Vehicule> findVisiteExpiree();

    List<Vehicule> search(String searchTerm);

    // ========== VÉRIFICATION ==========

    boolean existsByImmatriculation(String immatriculation);

    boolean existsByImmatriculationExcludingUuid(String immatriculation, String excludeUuid);

    boolean hasOffres(String uuid);

    // ========== ÉCRITURE ==========

    Vehicule save(Vehicule vehicule);

    Vehicule update(Vehicule vehicule);

    int updateStatut(String uuid, String statut);

    int updateImage(String uuid, String imageUrl, byte[] imageData, String imageType);

    int deleteByUuid(String uuid);

    // ========== COMPTAGE ==========

    long count();

    long countByStatut(String statut);

    long countByUser(Long userId);

    long countByTypeVehicule(String typeVehiculeUuid);
}