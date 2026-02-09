package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Vehicule;
import io.multi.billetterieservice.dto.VehiculeRequest;

import java.util.List;

/**
 * Interface de service pour la gestion des véhicules.
 */
public interface VehiculeService {

    // ========== LECTURE ==========

    List<Vehicule> getAll();

    List<Vehicule> getAllActifs();

    Vehicule getByUuid(String uuid);

    Vehicule getByImmatriculation(String immatriculation);

    List<Vehicule> getByUser(Long userId);

    List<Vehicule> getMesVehicules(Long userId);

    List<Vehicule> getByTypeVehicule(String typeVehiculeUuid);

    List<Vehicule> getByStatut(String statut);

    List<Vehicule> getByNombrePlacesMin(int nombrePlacesMin);

    List<Vehicule> getClimatises();

    List<Vehicule> getAssuranceExpiree();

    List<Vehicule> getVisiteExpiree();

    List<Vehicule> search(String searchTerm);

    // ========== ÉCRITURE ==========

    /**
     * Crée un véhicule
     * @param request Données du véhicule
     * @param userId ID de l'utilisateur propriétaire (depuis JWT)
     */
    Vehicule create(VehiculeRequest request, Long userId);

    Vehicule update(String uuid, VehiculeRequest request);

    Vehicule updateStatut(String uuid, String statut);

    Vehicule activer(String uuid);

    Vehicule desactiver(String uuid);

    Vehicule mettreEnMaintenance(String uuid);

    Vehicule suspendre(String uuid);

    void delete(String uuid);

    // ========== STATISTIQUES ==========

    long count();

    long countByStatut(String statut);

    long countByUser(Long userId);
}