package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ProprieteCreateRequest;
import io.multi.immobilierservice.dto.ProprieteUpdateRequest;

import java.util.List;

public interface ProprieteService {

    Propriete create(ProprieteCreateRequest request, Long userId);

    Propriete update(String proprieteUuid, ProprieteUpdateRequest request, Long userId);

    /**
     * Récupère une propriété par son UUID + charge photos/commodités/type.
     *
     * @param proprieteUuid   identifiant
     * @param incrementVues   si true ET {@code viewerUserId} non null, tente
     *                        d'incrémenter le compteur de vues avec dédup par
     *                        (user, jour calendaire) — voir V21. Si
     *                        {@code viewerUserId} null (anonyme/bot), aucune
     *                        vue n'est comptée même si incrementVues=true.
     * @param viewerUserId    user qui consulte (nullable si endpoint anonyme)
     */
    Propriete getByUuid(String proprieteUuid, boolean incrementVues, Long viewerUserId);

    List<Propriete> findMine(Long userId, int limit, int offset);

    /**
     * Modération hybride (Phase 9a) :
     * <ul>
     *   <li>Profil VERIFIE + pas la première annonce → {@code PUBLIE}</li>
     *   <li>Sinon → {@code EN_ATTENTE_VALIDATION} (admin doit valider via {@link #valider})</li>
     * </ul>
     * Vérifie aussi la limite d'annonces actives selon {@code typeProfil}.
     */
    Propriete publier(String proprieteUuid, Long userId);

    Propriete retirer(String proprieteUuid, Long userId);

    Propriete marquerVendu(String proprieteUuid, Long userId);

    Propriete marquerLoue(String proprieteUuid, Long userId);

    void supprimer(String proprieteUuid, Long userId);

    /** Admin : valide une annonce en EN_ATTENTE_VALIDATION → PUBLIE. */
    Propriete valider(String proprieteUuid);

    /** Admin : rejette une annonce + motif. La passe en RETIRE. */
    Propriete rejeter(String proprieteUuid, String motif);

    /** Owner : renouvelle son annonce (1-clic) pour {@code immo.expiration.duree-jours} jours. */
    Propriete renouveler(String proprieteUuid, Long userId);
}
