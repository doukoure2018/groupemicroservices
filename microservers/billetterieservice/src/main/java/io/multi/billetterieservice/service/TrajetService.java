package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Trajet;
import io.multi.billetterieservice.dto.TrajetRequest;

import java.math.BigDecimal;
import java.util.List;

/**
 * Interface de service pour la gestion des trajets.
 */
public interface TrajetService {

    // ========== LECTURE ==========

    List<Trajet> getAll();

    List<Trajet> getAllActifs();

    Trajet getByUuid(String uuid);

    List<Trajet> getByDepart(String departUuid);

    List<Trajet> getByArrivee(String arriveeUuid);

    Trajet getByDepartAndArrivee(String departUuid, String arriveeUuid);

    List<Trajet> getByVilleDepart(String villeUuid);

    List<Trajet> getByVilleArrivee(String villeUuid);

    List<Trajet> getByVilles(String villeDepartUuid, String villeArriveeUuid);

    List<Trajet> getByUser(Long userId);

    List<Trajet> search(String searchTerm);

    // ========== ÉCRITURE ==========

    /**
     * Crée un nouveau trajet
     * @param request Données du trajet
     * @param userId ID de l'utilisateur créateur (depuis JWT)
     */
    Trajet create(TrajetRequest request, Long userId);

    Trajet update(String uuid, TrajetRequest request);

    Trajet updateMontants(String uuid, BigDecimal montantBase, BigDecimal montantBagages);

    Trajet activate(String uuid);

    Trajet deactivate(String uuid);

    Trajet toggleActif(String uuid);

    void delete(String uuid);

    // ========== STATISTIQUES ==========

    long count();

    long countActifs();
}