package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.TypeVehicule;
import io.multi.billetterieservice.dto.TypeVehiculeRequest;

import java.util.List;

/**
 * Interface de service pour la gestion des types de véhicules.
 */
public interface TypeVehiculeService {

    // ========== LECTURE ==========

    List<TypeVehicule> getAll();

    List<TypeVehicule> getAllActifs();

    TypeVehicule getByUuid(String uuid);

    TypeVehicule getByLibelle(String libelle);

    List<TypeVehicule> search(String searchTerm);

    List<TypeVehicule> getByCapacite(int capacite);

    // ========== ÉCRITURE ==========

    TypeVehicule create(TypeVehiculeRequest request);

    TypeVehicule update(String uuid, TypeVehiculeRequest request);

    TypeVehicule activate(String uuid);

    TypeVehicule deactivate(String uuid);

    TypeVehicule toggleActif(String uuid);

    void delete(String uuid);

    // ========== STATISTIQUES ==========

    long count();

    long countActifs();
}