package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.DemandeBesoin;
import io.multi.immobilierservice.dto.DemandeCreateRequest;

import java.util.List;
import java.util.Map;

public interface DemandeBesoinService {

    /**
     * Crée la demande puis la diffuse par email aux agences VERIFIEES de la zone :
     * commune du besoin → fallback région → fallback toutes (décision produit 2026-07-06).
     */
    DemandeBesoin create(DemandeCreateRequest request, Long userId);

    /** Demandes du client connecté. */
    List<DemandeBesoin> mesDemandes(Long userId);

    /**
     * Demandes actives visibles par l'agence de l'utilisateur connecté (VERIFIEE).
     * scope ZONE (défaut) : même commune ou région que l'agence ; scope TOUTES : toutes.
     */
    Map<String, Object> pourMonAgence(Long userId, String scope, int limit, int offset);

    /** Annulation par le client propriétaire de la demande. */
    DemandeBesoin annuler(String demandeUuid, Long userId);
}
