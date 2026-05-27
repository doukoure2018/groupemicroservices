package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.AgenceRequest;
import io.multi.immobilierservice.dto.AjouterAgentRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.repository.AgenceRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.service.AgenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgenceServiceImpl implements AgenceService {

    private final AgenceRepository agenceRepository;
    private final ProfilImmoRepository profilImmoRepository;
    private final UserClient userClient;

    @Override
    @Transactional
    public Agence create(AgenceRequest request, Long proprietaireUserId) {
        // Vérifier que le user existe via Feign
        User user = fetchUserOrFail(proprietaireUserId);
        log.info("Création agence par user {} ({})", user.getEmail(), proprietaireUserId);

        Agence agence = Agence.builder()
                .nom(request.getNom())
                .raisonSociale(request.getRaisonSociale())
                .numeroRegistre(request.getNumeroRegistre())
                .logoUrl(request.getLogoUrl())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .description(request.getDescription())
                .siteWeb(request.getSiteWeb())
                .reseauxSociauxJson(request.getReseauxSociauxJson())
                .documentsKycUrl(request.getDocumentsKycUrl())
                .dateCreationAgence(request.getDateCreationAgence())
                .proprietaireUserId(proprietaireUserId)
                .build();
        // localisationId : résolution par uuid à implémenter en Phase 6 (requête sur localisations existante)
        return agenceRepository.save(agence);
    }

    @Override
    @Transactional
    public Agence update(String agenceUuid, AgenceRequest request, Long userId) {
        Agence existant = getByUuid(agenceUuid);
        ensureOwner(existant, userId);

        existant.setNom(request.getNom());
        existant.setRaisonSociale(request.getRaisonSociale());
        existant.setNumeroRegistre(request.getNumeroRegistre());
        existant.setLogoUrl(request.getLogoUrl());
        existant.setTelephone(request.getTelephone());
        existant.setEmail(request.getEmail());
        existant.setDescription(request.getDescription());
        existant.setSiteWeb(request.getSiteWeb());
        existant.setReseauxSociauxJson(request.getReseauxSociauxJson());
        existant.setDocumentsKycUrl(request.getDocumentsKycUrl());
        existant.setDateCreationAgence(request.getDateCreationAgence());

        return agenceRepository.update(existant)
                .orElseThrow(() -> new ApiException("Échec mise à jour agence " + agenceUuid));
    }

    @Override
    public Agence getByUuid(String agenceUuid) {
        return agenceRepository.findByUuid(agenceUuid)
                .orElseThrow(() -> new ApiException("Agence introuvable : " + agenceUuid));
    }

    @Override
    public List<Agence> findAll(int limit, int offset) {
        return agenceRepository.findAll(limit, offset);
    }

    @Override
    public List<Agence> findMine(Long userId) {
        return agenceRepository.findByProprietaire(userId);
    }

    @Override
    @Transactional
    public Agence verifier(String agenceUuid, String statut) {
        return agenceRepository.updateStatutVerification(agenceUuid, statut)
                .orElseThrow(() -> new ApiException("Agence introuvable : " + agenceUuid));
    }

    @Override
    @Transactional
    public void softDelete(String agenceUuid, Long userId) {
        Agence agence = getByUuid(agenceUuid);
        ensureOwner(agence, userId);
        agenceRepository.softDelete(agenceUuid);
    }

    @Override
    @Transactional
    public ProfilImmo ajouterAgent(String agenceUuid, AjouterAgentRequest request, Long requesterUserId) {
        Agence agence = getByUuid(agenceUuid);
        ensureOwner(agence, requesterUserId);

        // Vérifier que l'agent (user à ajouter) existe via Feign
        User agentUser = fetchUserOrFail(request.getUserId());

        // Vérifier qu'il n'a pas déjà un profil immo
        profilImmoRepository.findByUserId(request.getUserId()).ifPresent(p -> {
            throw new ApiException("L'utilisateur " + agentUser.getEmail()
                    + " a déjà un profil immobilier (" + p.getTypeProfil() + ")");
        });

        ProfilImmo profil = ProfilImmo.builder()
                .userId(request.getUserId())
                .typeProfil("AGENT_AGENCE")
                .agenceId(agence.getAgenceId())
                .bio(request.getBio())
                .telephoneContact(request.getTelephoneContact())
                .build();
        return profilImmoRepository.save(profil);
    }

    @Override
    public List<ProfilImmo> listerAgents(String agenceUuid) {
        Agence agence = getByUuid(agenceUuid);
        return profilImmoRepository.findByAgence(agence.getAgenceId());
    }

    @Override
    @Transactional
    public void retirerAgent(String agenceUuid, Long userIdAgent, Long requesterUserId) {
        Agence agence = getByUuid(agenceUuid);
        ensureOwner(agence, requesterUserId);

        ProfilImmo profil = profilImmoRepository.findByUserId(userIdAgent)
                .orElseThrow(() -> new ApiException("Aucun profil immo pour user " + userIdAgent));
        if (!"AGENT_AGENCE".equals(profil.getTypeProfil())
                || !agence.getAgenceId().equals(profil.getAgenceId())) {
            throw new ApiException("L'utilisateur n'est pas un agent de cette agence");
        }
        profilImmoRepository.softDelete(profil.getProfilUuid());
    }

    private void ensureOwner(Agence agence, Long userId) {
        if (!agence.getProprietaireUserId().equals(userId)) {
            throw new ApiException("Vous n'êtes pas propriétaire de cette agence");
        }
    }

    private User fetchUserOrFail(Long userId) {
        try {
            User user = userClient.getUserById(userId);
            if (user == null || user.getUserId() == null) {
                throw new ApiException("Utilisateur introuvable : " + userId);
            }
            return user;
        } catch (Exception e) {
            log.error("Erreur Feign UserClient pour userId={}: {}", userId, e.getMessage());
            throw new ApiException("Impossible de récupérer l'utilisateur " + userId);
        }
    }
}
