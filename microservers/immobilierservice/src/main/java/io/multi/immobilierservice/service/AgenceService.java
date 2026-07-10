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

    // ---------- Onboarding conformité (V31) ----------

    /** L'agence de l'utilisateur connecté (la première active), ou empty si pas encore créée. */
    java.util.Optional<Agence> findMonAgence(Long userId);

    /** Crée ou complète l'agence de l'utilisateur avec les infos d'onboarding. */
    Agence saveOnboarding(io.multi.immobilierservice.dto.OnboardingAgenceRequest request, Long userId);

    /** Upload du document RCCM (MinIO) et rattachement à l'agence de l'utilisateur. */
    Agence uploadRccm(org.springframework.web.multipart.MultipartFile file, Long userId);

    /** Soumet le dossier à la conformité (statut EN_VALIDATION) après contrôle de complétude. */
    Agence soumettreConformite(Long userId);

    // ---------- Backoffice conformité (rôle ADMIN_CONFORMITE) ----------

    /** File d'attente des dossiers agence EN_VALIDATION (plus anciens d'abord). */
    List<Agence> listEnValidation(int limit, int offset);

    long countEnValidation();

    /** Approuve le dossier → VERIFIE + email à l'agence. */
    Agence approuverConformite(String agenceUuid, Long adminUserId);

    /** Rejette le dossier → REJETE + motif + email à l'agence. */
    Agence rejeterConformite(String agenceUuid, String motif, Long adminUserId);

    /** Flux du document RCCM d'une agence (depuis MinIO), pour la conformité. */
    io.multi.immobilierservice.dto.DocumentStream getRccmStream(String agenceUuid);

    // ---------- Écran admin : agences + activités ----------

    /** Liste des agences avec compteurs d'activité + nom du représentant (Feign). */
    java.util.List<io.multi.immobilierservice.dto.AgenceActiviteView> listActivite(int limit, int offset);

    long countActives();

    /** Détail d'une agence : compteurs, représentant, annonces, agents. */
    java.util.Map<String, Object> getActiviteDetail(String agenceUuid);
}
