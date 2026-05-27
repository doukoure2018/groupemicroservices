package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.AgenceInvitation;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.AgenceRequest;
import io.multi.immobilierservice.dto.AjouterAgentRequest;

import java.util.List;

public interface AgenceService {

    Agence create(AgenceRequest request, Long proprietaireUserId);

    Agence update(String agenceUuid, AgenceRequest request, Long userId);

    Agence getByUuid(String agenceUuid);

    List<Agence> findAll(int limit, int offset);

    List<Agence> findMine(Long userId);

    Agence verifier(String agenceUuid, String statut);

    void softDelete(String agenceUuid, Long userId);

    /**
     * <b>Depuis V15</b> : n'attache plus directement le user comme agent.
     * Crée une {@link AgenceInvitation} EN_ATTENTE. Le user doit explicitement
     * accepter via {@code POST /immo/agences/invitations/{token}/accepter}
     * pour que son profil AGENT_AGENCE soit créé.
     */
    AgenceInvitation ajouterAgent(String agenceUuid, AjouterAgentRequest request, Long requesterUserId);

    List<ProfilImmo> listerAgents(String agenceUuid);

    void retirerAgent(String agenceUuid, Long userIdAgent, Long requesterUserId);
}
