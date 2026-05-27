package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.AgenceInvitation;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.AjouterAgentRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.repository.AgenceInvitationRepository;
import io.multi.immobilierservice.repository.AgenceRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.service.AgenceInvitationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgenceInvitationServiceImpl implements AgenceInvitationService {

    private final AgenceInvitationRepository invitationRepository;
    private final AgenceRepository agenceRepository;
    private final ProfilImmoRepository profilImmoRepository;
    private final UserClient userClient;

    @Value("${immo.invitations.duree-jours:7}")
    private int dureeJours;

    @Override
    @Transactional
    public AgenceInvitation inviter(String agenceUuid, AjouterAgentRequest request, Long requesterUserId) {
        Agence agence = agenceRepository.findByUuid(agenceUuid)
                .orElseThrow(() -> new ApiException("Agence introuvable : " + agenceUuid));
        if (!agence.getProprietaireUserId().equals(requesterUserId)) {
            throw new ApiException("Vous n'êtes pas propriétaire de cette agence");
        }

        // Vérifier que le user à inviter existe (via Feign UserClient)
        User userInvite;
        try {
            userInvite = userClient.getUserById(request.getUserId());
        } catch (Exception e) {
            throw new ApiException("Impossible de récupérer l'utilisateur " + request.getUserId());
        }
        if (userInvite == null || userInvite.getUserId() == null) {
            throw new ApiException("Utilisateur introuvable : " + request.getUserId());
        }
        if (request.getUserId().equals(requesterUserId)) {
            throw new ApiException("Vous ne pouvez pas vous inviter vous-même");
        }

        // Refuser si le user a déjà un profil immo (peu importe son type)
        profilImmoRepository.findByUserId(request.getUserId()).ifPresent(p -> {
            throw new ApiException("L'utilisateur " + userInvite.getEmail()
                    + " a déjà un profil immobilier (" + p.getTypeProfil() + ")");
        });

        // Refuser si une invitation EN_ATTENTE existe déjà pour ce couple
        invitationRepository.findActiveByAgenceAndUser(agence.getAgenceId(), request.getUserId())
                .ifPresent(inv -> {
                    throw new ApiException("Une invitation EN_ATTENTE existe déjà (uuid="
                            + inv.getInvitationUuid() + ")");
                });

        String token = UUID.randomUUID().toString().replace("-", "");
        OffsetDateTime dateExpiration = OffsetDateTime.now().plusDays(dureeJours);

        AgenceInvitation invitation = invitationRepository.save(
                agence.getAgenceId(),
                request.getUserId(),
                requesterUserId,
                token,
                request.getBio(),
                request.getTelephoneContact(),
                dateExpiration
        );

        log.info("Invitation agent créée : uuid={} agence={} user={} expire={}",
                invitation.getInvitationUuid(), agenceUuid, request.getUserId(), dateExpiration);

        // TODO Phase 11 : publier Kafka INVITATION_AGENT_ENVOYEE → email + notif in-app
        return invitation;
    }

    @Override
    public List<AgenceInvitation> mesInvitations(Long userId) {
        return invitationRepository.findPendingForUser(userId);
    }

    @Override
    public List<AgenceInvitation> listForAgence(String agenceUuid, Long requesterUserId) {
        Agence agence = agenceRepository.findByUuid(agenceUuid)
                .orElseThrow(() -> new ApiException("Agence introuvable : " + agenceUuid));
        if (!agence.getProprietaireUserId().equals(requesterUserId)) {
            throw new ApiException("Vous n'êtes pas propriétaire de cette agence");
        }
        return invitationRepository.findForAgence(agence.getAgenceId());
    }

    @Override
    @Transactional
    public ProfilImmo accepter(String token, Long userId) {
        AgenceInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Invitation introuvable"));
        validatePending(invitation, userId);

        // Re-vérifier l'unicité du profil (au cas où le user en aurait créé un entre temps)
        profilImmoRepository.findByUserId(userId).ifPresent(p -> {
            throw new ApiException("Vous avez déjà un profil immobilier (" + p.getTypeProfil() + ")");
        });

        ProfilImmo profil = ProfilImmo.builder()
                .userId(userId)
                .typeProfil("AGENT_AGENCE")
                .agenceId(invitation.getAgenceId())
                .bio(invitation.getBioProposee())
                .telephoneContact(invitation.getTelephonePropose())
                .build();
        ProfilImmo saved = profilImmoRepository.save(profil);

        invitationRepository.updateStatut(invitation.getInvitationId(), "ACCEPTEE", null);

        log.info("Invitation {} acceptée → profil AGENT_AGENCE {} créé",
                invitation.getInvitationUuid(), saved.getProfilUuid());
        return saved;
    }

    @Override
    @Transactional
    public AgenceInvitation refuser(String token, Long userId, String motif) {
        AgenceInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Invitation introuvable"));
        validatePending(invitation, userId);

        return invitationRepository.updateStatut(invitation.getInvitationId(), "REFUSEE", motif)
                .orElseThrow(() -> new ApiException("Échec mise à jour invitation"));
    }

    @Override
    @Transactional
    public AgenceInvitation revoquer(String invitationUuid, Long requesterUserId) {
        AgenceInvitation invitation = invitationRepository.findByUuid(invitationUuid)
                .orElseThrow(() -> new ApiException("Invitation introuvable"));
        if (!invitation.getInviteParUserId().equals(requesterUserId)) {
            throw new ApiException("Vous n'êtes pas l'émetteur de cette invitation");
        }
        if (!"EN_ATTENTE".equals(invitation.getStatut())) {
            throw new ApiException("Seules les invitations EN_ATTENTE peuvent être révoquées");
        }
        return invitationRepository.updateStatut(invitation.getInvitationId(), "REVOQUEE", null)
                .orElseThrow(() -> new ApiException("Échec révocation"));
    }

    private void validatePending(AgenceInvitation invitation, Long userId) {
        if (!invitation.getInviteUserId().equals(userId)) {
            throw new ApiException("Cette invitation ne vous est pas destinée");
        }
        if (!"EN_ATTENTE".equals(invitation.getStatut())) {
            throw new ApiException("Invitation déjà " + invitation.getStatut().toLowerCase());
        }
        if (invitation.getDateExpiration().isBefore(OffsetDateTime.now())) {
            // Marque comme expirée silencieusement
            invitationRepository.updateStatut(invitation.getInvitationId(), "EXPIREE", null);
            throw new ApiException("Invitation expirée le " + invitation.getDateExpiration());
        }
    }
}
