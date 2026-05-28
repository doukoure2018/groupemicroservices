package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.VisiteCreateRequest;

import java.util.List;

public interface VisiteService {

    /**
     * Demande une visite. La contrainte BD {@code uq_immo_visite_active} empêche
     * qu'un même user ait deux visites actives (DEMANDEE/CONFIRMEE) sur le même
     * bien — anti-spam vendeur.
     */
    Visite demander(String proprieteUuid, VisiteCreateRequest req, Long visiteurUserId);

    List<Visite> findMesVisitesVisiteur(Long userId, int limit, int offset);
    long countMesVisitesVisiteur(Long userId);

    List<Visite> findVisitesSurMesAnnonces(Long vendeurUserId, int limit, int offset);
    long countVisitesSurMesAnnonces(Long vendeurUserId);

    /** Vendeur : DEMANDEE → CONFIRMEE. */
    Visite confirmer(String visiteUuid, Long vendeurUserId);

    /** Vendeur : CONFIRMEE → EFFECTUEE. */
    Visite effectuer(String visiteUuid, Long vendeurUserId, String notesVendeur);

    /** Visiteur OU vendeur : * → ANNULEE. */
    Visite annuler(String visiteUuid, Long requesterUserId, String motif);
}
