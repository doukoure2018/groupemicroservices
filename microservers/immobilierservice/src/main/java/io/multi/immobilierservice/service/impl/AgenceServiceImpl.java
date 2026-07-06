package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.AgenceInvitation;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.AgenceRequest;
import io.multi.immobilierservice.dto.AjouterAgentRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.repository.AgenceRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.service.AgenceInvitationService;
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
    private final AgenceInvitationService invitationService;
    private final UserClient userClient;
    private final io.multi.immobilierservice.service.PhotoStorageService photoStorageService;
    private final io.multi.immobilierservice.service.ImmoNotificationProducer notificationProducer;

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
    public AgenceInvitation ajouterAgent(String agenceUuid, AjouterAgentRequest request, Long requesterUserId) {
        // Délègue à AgenceInvitationService : crée une invitation EN_ATTENTE.
        // Le user doit explicitement accepter via /immo/agences/invitations/{token}/accepter
        // pour que son profil AGENT_AGENCE soit créé (cf. V15 — fin du trou de sécurité Phase 4).
        return invitationService.inviter(agenceUuid, request, requesterUserId);
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

    // ---------- Onboarding conformité (V31) ----------

    @Override
    public java.util.Optional<Agence> findMonAgence(Long userId) {
        return agenceRepository.findByProprietaire(userId).stream().findFirst();
    }

    @Override
    @Transactional
    public Agence saveOnboarding(io.multi.immobilierservice.dto.OnboardingAgenceRequest request, Long userId) {
        Agence agence = findMonAgence(userId).orElseGet(() -> {
            fetchUserOrFail(userId);
            log.info("Onboarding : création de l'agence pour user {}", userId);
            return agenceRepository.save(Agence.builder()
                    .nom(request.getNom())
                    .proprietaireUserId(userId)
                    .build());
        });

        if ("EN_VALIDATION".equals(agence.getStatutVerification())) {
            throw new ApiException("Dossier déjà soumis à la conformité — modification impossible pendant l'examen");
        }
        if ("VERIFIE".equals(agence.getStatutVerification())) {
            throw new ApiException("Agence déjà vérifiée — utilisez la mise à jour classique du profil");
        }

        agence.setNom(request.getNom());
        agence.setRaisonSociale(request.getRaisonSociale());
        agence.setNumeroRegistre(request.getNumeroRegistre());
        agence.setAdresse(request.getAdresse());
        agence.setCommuneId(request.getCommuneId());
        agence.setRegionId(request.getRegionId());
        agence.setEmail(request.getEmail());
        agence.setTelephone(request.getTelephone());
        agence.setTelephoneWhatsapp(request.getTelephoneWhatsapp());
        agence.setDescription(request.getDescription());

        return agenceRepository.updateOnboarding(agence)
                .orElseThrow(() -> new ApiException("Échec de l'enregistrement du profil agence"));
    }

    @Override
    @Transactional
    public Agence uploadRccm(org.springframework.web.multipart.MultipartFile file, Long userId) {
        Agence agence = findMonAgence(userId)
                .orElseThrow(() -> new ApiException("Complétez d'abord les informations de votre agence"));
        if ("EN_VALIDATION".equals(agence.getStatutVerification())) {
            throw new ApiException("Dossier déjà soumis à la conformité — modification impossible pendant l'examen");
        }
        try {
            var upload = photoStorageService.uploadDocument(
                    file.getBytes(), file.getOriginalFilename(), file.getContentType(), null);
            return agenceRepository.updateDocumentKyc(agence.getAgenceUuid(), upload.getUrl())
                    .orElseThrow(() -> new ApiException("Échec du rattachement du document RCCM"));
        } catch (java.io.IOException e) {
            throw new ApiException("Lecture du fichier impossible : " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Agence soumettreConformite(Long userId) {
        Agence agence = findMonAgence(userId)
                .orElseThrow(() -> new ApiException("Complétez d'abord les informations de votre agence"));
        if ("EN_VALIDATION".equals(agence.getStatutVerification())) {
            throw new ApiException("Dossier déjà en cours d'examen par la conformité");
        }
        if ("VERIFIE".equals(agence.getStatutVerification())) {
            throw new ApiException("Agence déjà vérifiée");
        }
        // Contrôle de complétude avant soumission
        if (isBlank(agence.getNumeroRegistre()) || isBlank(agence.getAdresse())
                || agence.getCommuneId() == null || agence.getRegionId() == null
                || isBlank(agence.getEmail()) || isBlank(agence.getTelephone())) {
            throw new ApiException("Dossier incomplet : renseignez RCCM/NIF, adresse, commune, région, email et téléphone");
        }
        if (isBlank(agence.getDocumentsKycUrl())) {
            throw new ApiException("Dossier incomplet : le document RCCM doit être uploadé");
        }
        log.info("Agence {} soumise à la conformité par user {}", agence.getAgenceUuid(), userId);
        return agenceRepository.soumettreConformite(agence.getAgenceUuid())
                .orElseThrow(() -> new ApiException("Échec de la soumission à la conformité"));
    }

    // ---------- Backoffice conformité (rôle ADMIN_CONFORMITE) ----------

    @Override
    public List<Agence> listEnValidation(int limit, int offset) {
        return agenceRepository.findEnValidation(limit, offset);
    }

    @Override
    public long countEnValidation() {
        return agenceRepository.countEnValidation();
    }

    @Override
    @Transactional
    public Agence approuverConformite(String agenceUuid, Long adminUserId) {
        Agence agence = ensureEnValidation(agenceUuid);
        Agence updated = agenceRepository.decisionConformite(agenceUuid, "VERIFIE", null)
                .orElseThrow(() -> new ApiException("Échec de l'approbation de l'agence " + agenceUuid));
        log.info("Conformité : agence {} APPROUVÉE par admin {}", agenceUuid, adminUserId);
        publishDecisionConformite(io.multi.immobilierservice.event.EventType.IMMO_AGENCE_APPROUVEE, updated, null);
        return updated;
    }

    @Override
    @Transactional
    public Agence rejeterConformite(String agenceUuid, String motif, Long adminUserId) {
        if (isBlank(motif)) {
            throw new ApiException("Le motif de rejet est obligatoire");
        }
        Agence agence = ensureEnValidation(agenceUuid);
        Agence updated = agenceRepository.decisionConformite(agenceUuid, "REJETE", motif)
                .orElseThrow(() -> new ApiException("Échec du rejet de l'agence " + agenceUuid));
        log.info("Conformité : agence {} REJETÉE par admin {} (motif={})", agenceUuid, adminUserId, motif);
        publishDecisionConformite(io.multi.immobilierservice.event.EventType.IMMO_AGENCE_REJETEE, updated, motif);
        return updated;
    }

    private Agence ensureEnValidation(String agenceUuid) {
        Agence agence = getByUuid(agenceUuid);
        if (!"EN_VALIDATION".equals(agence.getStatutVerification())) {
            throw new ApiException("Ce dossier n'est pas en attente de validation (statut : "
                    + agence.getStatutVerification() + ")");
        }
        return agence;
    }

    /** Email de décision à l'agence (email pro, fallback email du propriétaire). Best-effort. */
    private void publishDecisionConformite(io.multi.immobilierservice.event.EventType type, Agence agence, String motif) {
        try {
            String email = agence.getEmail();
            String contactNom = agence.getNom();
            if (isBlank(email)) {
                User proprietaire = fetchUserOrFail(agence.getProprietaireUserId());
                email = proprietaire.getEmail();
            }
            if (isBlank(email)) {
                log.warn("Décision conformité {} : aucun email pour l'agence {}", type, agence.getAgenceUuid());
                return;
            }
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("agenceEmail", email);
            data.put("agenceNom", contactNom);
            data.put("agenceUuid", agence.getAgenceUuid());
            data.put("numeroRegistre", agence.getNumeroRegistre());
            data.put("motif", motif != null ? motif : "");
            data.put("dateDecision", java.time.OffsetDateTime.now().toString());
            notificationProducer.publish(type, type.name() + ":" + agence.getAgenceUuid(), data);
        } catch (Exception e) {
            log.error("Échec publish {} pour agence {} : {}", type, agence.getAgenceUuid(), e.getMessage());
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private void ensureOwner(Agence agence, Long userId) {
        // Agence = ressource PUBLIQUE (GET sans auth) → 403.
        if (!agence.getProprietaireUserId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas propriétaire de cette agence");
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
