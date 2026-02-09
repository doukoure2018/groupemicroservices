package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.TypeVehicule;

import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité TypeVehicule.
 */
public interface TypeVehiculeRepository {

    // ========== LECTURE ==========

    List<TypeVehicule> findAll();

    List<TypeVehicule> findAllActifs();

    Optional<TypeVehicule> findByUuid(String uuid);

    Optional<TypeVehicule> findById(Long id);

    Optional<TypeVehicule> findByLibelle(String libelle);

    List<TypeVehicule> searchByLibelle(String searchTerm);

    List<TypeVehicule> findByCapacite(int capacite);

    // ========== VÉRIFICATION ==========

    boolean existsByLibelle(String libelle);

    boolean existsByLibelleExcludingUuid(String libelle, String excludeUuid);

    boolean hasVehicules(String uuid);

    // ========== ÉCRITURE ==========

    TypeVehicule save(TypeVehicule typeVehicule);

    TypeVehicule update(TypeVehicule typeVehicule);

    int updateActif(String uuid, boolean actif);

    int deleteByUuid(String uuid);

    // ========== COMPTAGE ==========

    long count();

    long countActifs();
}