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

    /**
     * Admin : valide une annonce en EN_ATTENTE_VALIDATION → PUBLIE.
     * Persiste un audit log {@code immo_admin_action} dans la même transaction.
     *
     * @param adminUserId user_id de l'admin qui effectue l'action (claim sub du JWT)
     */
    Propriete valider(String proprieteUuid, Long adminUserId);

    /**
     * Admin : rejette une annonce + motif. La passe en RETIRE.
     * Persiste un audit log {@code immo_admin_action} dans la même transaction.
     *
     * @param adminUserId user_id de l'admin qui effectue l'action (claim sub du JWT)
     */
    Propriete rejeter(String proprieteUuid, String motif, Long adminUserId);

    /**
     * Admin : liste paginée des annonces en file de modération (FIFO sur
     * created_at). Chaque propriete est enrichie avec ses photos et
     * commodités pour preview sans N+1 côté UI.
     */
    java.util.List<Propriete> findEnAttenteValidation(int limit, int offset);

    /**
     * Détail enrichi pour le back-office modération : propriété + photos +
     * commodités + profil vendeur (firstName, lastName, phone, email, type,
     * statutVerification). N'incrémente PAS le compteur de vues — l'admin
     * n'est pas un visiteur. NotFoundException 404 si UUID inconnu.
     */
    java.util.Map<String, Object> getForModeration(String proprieteUuid);

    /** Admin : compteur total pour pagination "Modération". */
    long countEnAttenteValidation();

    /** Owner : renouvelle son annonce (1-clic) pour {@code immo.expiration.duree-jours} jours. */
    Propriete renouveler(String proprieteUuid, Long userId);
}
