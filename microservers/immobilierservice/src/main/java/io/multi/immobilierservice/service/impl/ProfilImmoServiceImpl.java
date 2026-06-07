package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.ProfilImmoRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.exception.NotFoundException;
import io.multi.immobilierservice.repository.AgenceRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.service.ProfilImmoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfilImmoServiceImpl implements ProfilImmoService {

    private final ProfilImmoRepository profilImmoRepository;
    private final AgenceRepository agenceRepository;
    private final UserClient userClient;

    @Override
    @Transactional
    public ProfilImmo create(ProfilImmoRequest request, Long userId) {
        // Vérifier que l'utilisateur existe
        User user = fetchUserOrFail(userId);
        log.info("Création profil immo pour user {} ({}), type={}",
                user.getEmail(), userId, request.getTypeProfil());

        // Vérifier unicité (1 profil par user)
        profilImmoRepository.findByUserId(userId).ifPresent(p -> {
            throw new ApiException("Un profil immobilier existe déjà pour cet utilisateur ("
                    + p.getTypeProfil() + ")");
        });

        // Si AGENT_AGENCE, résoudre l'agence
        Long agenceId = null;
        if ("AGENT_AGENCE".equals(request.getTypeProfil())) {
            if (request.getAgenceUuid() == null || request.getAgenceUuid().isBlank()) {
                throw new ApiException("agenceUuid est requis pour type_profil=AGENT_AGENCE");
            }
            Agence agence = agenceRepository.findByUuid(request.getAgenceUuid())
                    .orElseThrow(() -> new NotFoundException("Agence introuvable : " + request.getAgenceUuid()));
            agenceId = agence.getAgenceId();
        } else if (request.getAgenceUuid() != null) {
            throw new ApiException("agenceUuid ne doit être fourni que pour type_profil=AGENT_AGENCE");
        }

        ProfilImmo profil = ProfilImmo.builder()
                .userId(userId)
                .typeProfil(request.getTypeProfil())
                .agenceId(agenceId)
                .documentsKycUrl(request.getDocumentsKycUrl())
                .bio(request.getBio())
                .telephoneContact(request.getTelephoneContact())
                .build();
        return profilImmoRepository.save(profil);
    }

    @Override
    @Transactional
    public ProfilImmo update(String profilUuid, ProfilImmoRequest request, Long userId) {
        ProfilImmo existant = getByUuid(profilUuid);
        ensureOwner(existant, userId);

        existant.setBio(request.getBio());
        existant.setTelephoneContact(request.getTelephoneContact());
        existant.setDocumentsKycUrl(request.getDocumentsKycUrl());

        return profilImmoRepository.update(existant)
                .orElseThrow(() -> new ApiException("Échec mise à jour profil " + profilUuid));
    }

    @Override
    public ProfilImmo getByUuid(String profilUuid) {
        return profilImmoRepository.findByUuid(profilUuid)
                .orElseThrow(() -> new NotFoundException("Profil introuvable : " + profilUuid));
    }

    @Override
    public ProfilImmo getByUserId(Long userId) {
        return profilImmoRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Aucun profil immobilier pour user " + userId));
    }

    @Override
    @Transactional
    public ProfilImmo verifier(String profilUuid, String statut) {
        return profilImmoRepository.updateStatutVerification(profilUuid, statut)
                .orElseThrow(() -> new NotFoundException("Profil introuvable : " + profilUuid));
    }

    @Override
    @Transactional
    public void softDelete(String profilUuid, Long userId) {
        ProfilImmo profil = getByUuid(profilUuid);
        ensureOwner(profil, userId);
        profilImmoRepository.softDelete(profilUuid);
    }

    private void ensureOwner(ProfilImmo profil, Long userId) {
        // Profil vendeur = ressource PUBLIQUE (accessible en GET sans auth) → 403.
        if (!profil.getUserId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas propriétaire de ce profil");
        }
    }

    private User fetchUserOrFail(Long userId) {
        try {
            User user = userClient.getUserById(userId);
            if (user == null || user.getUserId() == null) {
                throw new NotFoundException("Utilisateur introuvable : " + userId);
            }
            return user;
        } catch (Exception e) {
            log.error("Erreur Feign UserClient pour userId={}: {}", userId, e.getMessage());
            throw new ApiException("Impossible de récupérer l'utilisateur " + userId);
        }
    }
}
