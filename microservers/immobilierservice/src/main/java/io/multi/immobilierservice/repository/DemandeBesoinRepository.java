package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.DemandeBesoin;

import java.util.List;
import java.util.Optional;

public interface DemandeBesoinRepository {

    /** Insère la demande puis la relit enrichie (libellés référentiel). */
    DemandeBesoin save(DemandeBesoin demande);

    Optional<DemandeBesoin> findByUuid(String demandeUuid);

    List<DemandeBesoin> findMesDemandes(Long userId);

    /** Demandes ACTIVE de la zone (même commune OU même région). */
    List<DemandeBesoin> findActivesZone(Long communeId, Long regionId, int limit, int offset);

    long countActivesZone(Long communeId, Long regionId);

    List<DemandeBesoin> findActivesAll(int limit, int offset);

    long countActivesAll();

    Optional<DemandeBesoin> updateStatut(String demandeUuid, String statut);
}
