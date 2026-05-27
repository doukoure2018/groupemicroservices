package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.AgenceInvitation;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.AjouterAgentRequest;

import java.util.List;

/**
 * Gestion des invitations d'agent par une agence — corrige le trou de sécurité
 * Phase 4 (création directe de profil sans consentement).
 *
 * <p>Flux : <br>
 * 1. Patron agence : {@link #inviter(String, AjouterAgentRequest, Long)} → crée invitation EN_ATTENTE<br>
 * 2. User invité : {@link #mesInvitations(Long)} → voit les invitations reçues<br>
 * 3. User invité : {@link #accepter(String, Long)} → crée le profil AGENT_AGENCE + marque ACCEPTEE<br>
 *    OU {@link #refuser(String, Long, String)} → marque REFUSEE<br>
 * 4. Patron agence : {@link #revoquer(String, Long)} → REVOQUEE (avant acceptation)
 */
public interface AgenceInvitationService {

    AgenceInvitation inviter(String agenceUuid, AjouterAgentRequest request, Long requesterUserId);

    List<AgenceInvitation> mesInvitations(Long userId);

    List<AgenceInvitation> listForAgence(String agenceUuid, Long requesterUserId);

    /** Renvoie le profil AGENT_AGENCE nouvellement créé. */
    ProfilImmo accepter(String token, Long userId);

    AgenceInvitation refuser(String token, Long userId, String motif);

    AgenceInvitation revoquer(String invitationUuid, Long requesterUserId);
}
