package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ContactCreateRequest;
import io.multi.immobilierservice.dto.ContactView;
import io.multi.immobilierservice.dto.LeadAdminView;
import io.multi.immobilierservice.dto.ProprietaireView;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.exception.NotFoundException;
import io.multi.immobilierservice.repository.ContactRepository;
import io.multi.immobilierservice.repository.FavoriRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.service.ContactService;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import io.multi.immobilierservice.utils.UserDisplayUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final FavoriRepository favoriRepository;  // réutilise lookupProprieteIdByUuid
    private final UserClient userClient;
    private final ProprieteRepository proprieteRepository;
    private final ProfilImmoRepository profilImmoRepository;
    private final ImmoNotificationProducer notificationProducer;

    /** Rôle des comptes recevant les leads contact/visite (intermédiation Phase 1). */
    private static final String ROLE_BACKOFFICE = "ADMIN_BACKOFFICE";

    @Override
    @Transactional
    public Contact creer(String proprieteUuid, ContactCreateRequest req, Long userId) {
        // Vérifier l'existence de la propriété
        Long proprieteId = favoriRepository.lookupProprieteIdByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));

        // Snapshot : récupérer les coordonnées du demandeur au moment T (figées en BD).
        // Si UserClient échoue, on refuse la création — sans nom/email, le vendeur
        // ne peut pas recontacter. C'est volontairement strict.
        User demandeur;
        try {
            demandeur = userClient.getUserById(userId);
        } catch (Exception e) {
            log.error("Feign UserClient échec pour userId={}: {}", userId, e.getMessage());
            throw new ApiException("Service utilisateur indisponible, réessayez plus tard");
        }
        if (demandeur == null || demandeur.getUserId() == null) {
            throw new ApiException("Utilisateur introuvable");
        }

        String nomComplet = ((demandeur.getFirstName() != null ? demandeur.getFirstName() : "")
                + " " + (demandeur.getLastName() != null ? demandeur.getLastName() : "")).trim();

        Contact c = Contact.builder()
                .proprieteId(proprieteId)
                .demandeurUserId(userId)
                .nomDemandeur(nomComplet.isBlank() ? demandeur.getUsername() : nomComplet)
                .telephoneDemandeur(demandeur.getPhone())
                .emailDemandeur(demandeur.getEmail())
                .message(req.getMessage())
                .typeDemande(req.getTypeDemande() != null ? req.getTypeDemande() : "INFO")
                .build();
        Contact saved = contactRepository.save(c);
        log.info("Contact créé : uuid={} de user {} sur propriete {}",
                saved.getContactUuid(), userId, proprieteUuid);
        publishContactRecu(saved, proprieteUuid, proprieteId);
        return saved;
    }

    /**
     * Publie IMMO_CONTACT_RECU vers le(s) compte(s) BACK-OFFICE (intermédiation Phase 1).
     * Le vendeur n'est PLUS destinataire : le back-office reçoit le lead (prospect +
     * propriété + coordonnées propriétaire à relayer) par email + SMS. Un event est publié
     * par compte back-office (référence d'idempotence suffixée par userId). Payload
     * auto-suffisant (snapshot au moment T). Échec = log + skip, jamais de rollback.
     */
    private void publishContactRecu(Contact contact, String proprieteUuid, Long proprieteId) {
        try {
            Propriete propriete = proprieteRepository.findById(proprieteId).orElse(null);
            if (propriete == null) {
                log.warn("Notification CONTACT_RECU skip : propriété {} introuvable", proprieteUuid);
                return;
            }

            // Coordonnées du propriétaire (ex-vendeur) — incluses dans le lead pour que le
            // back-office puisse le recontacter. Best-effort : si le lookup échoue, on notifie
            // quand même (le lead reste exploitable via la référence de l'annonce).
            String proprietaireNom = "", proprietaireTelephone = "", proprietaireEmail = "";
            ProfilImmo vendeurProfil = profilImmoRepository.findById(propriete.getProfilId()).orElse(null);
            if (vendeurProfil != null) {
                try {
                    User proprietaire = userClient.getUserById(vendeurProfil.getUserId());
                    if (proprietaire != null) {
                        proprietaireNom = UserDisplayUtils.nomComplet(proprietaire);
                        proprietaireTelephone = proprietaire.getPhone() != null ? proprietaire.getPhone() : "";
                        proprietaireEmail = proprietaire.getEmail() != null ? proprietaire.getEmail() : "";
                    }
                } catch (Exception e) {
                    log.warn("Lookup propriétaire Feign échec userId={} : {} — lead envoyé sans coordonnées propriétaire",
                            vendeurProfil.getUserId(), e.getMessage());
                }
            }

            // Destinataires = comptes ADMIN_BACKOFFICE (intermédiation). Vendeur OUT.
            List<User> backoffices;
            try {
                backoffices = userClient.getUsersByRole(ROLE_BACKOFFICE);
            } catch (Exception e) {
                log.error("Lookup back-office Feign échec : {} — CONTACT_RECU non notifié", e.getMessage());
                return;
            }
            if (backoffices == null || backoffices.isEmpty()) {
                log.warn("Notification CONTACT_RECU skip : aucun compte {} configuré", ROLE_BACKOFFICE);
                return;
            }

            String prixAffiche = formatPrix(propriete);
            int notifies = 0;
            for (User bo : backoffices) {
                if (bo == null || bo.getEmail() == null || bo.getEmail().isBlank()) continue;

                Map<String, Object> data = new HashMap<>();
                data.put("backofficeEmail", bo.getEmail());
                data.put("backofficeNom", UserDisplayUtils.nomComplet(bo));
                data.put("backofficeTelephone", bo.getPhone() != null ? bo.getPhone() : "");
                data.put("smsEnabled", true);   // back-office : toujours SMS (pas d'opt-out MVP)
                // Propriété
                data.put("proprieteUuid", proprieteUuid);
                data.put("proprieteReference", propriete.getReference());
                data.put("proprieteTitre", propriete.getTitre());
                data.put("proprieteTypeAnnonce", propriete.getTypeAnnonce() != null ? propriete.getTypeAnnonce() : "");
                data.put("proprietePrix", prixAffiche);
                data.put("proprieteAdresse", propriete.getAdresseComplete() != null ? propriete.getAdresseComplete() : "");
                // Propriétaire à relayer
                data.put("proprietaireNom", proprietaireNom);
                data.put("proprietaireTelephone", proprietaireTelephone);
                data.put("proprietaireEmail", proprietaireEmail);
                // Prospect (demandeur)
                data.put("visiteurNom", contact.getNomDemandeur());
                data.put("visiteurTelephone", contact.getTelephoneDemandeur() != null ? contact.getTelephoneDemandeur() : "");
                data.put("visiteurEmail", contact.getEmailDemandeur() != null ? contact.getEmailDemandeur() : "");
                data.put("message", contact.getMessage() != null ? contact.getMessage() : "");
                data.put("typeDemande", contact.getTypeDemande());
                data.put("dateContact", contact.getCreatedAt() != null ? contact.getCreatedAt().toString() : "");

                // Idempotence par destinataire : {EVENT}:{contactUuid}:{userId}
                String reference = EventType.IMMO_CONTACT_RECU.name() + ":" + contact.getContactUuid()
                        + ":" + bo.getUserId();
                notificationProducer.publish(EventType.IMMO_CONTACT_RECU, reference, data);
                notifies++;
            }
            log.info("Lead CONTACT_RECU routé vers {} compte(s) back-office (vendeur NON notifié) — contact {}",
                    notifies, contact.getContactUuid());
        } catch (Exception e) {
            // L'event publish ne doit JAMAIS faire rollback la création du contact.
            log.error("Échec publication CONTACT_RECU pour contact {} : {} — contact persisté quand même",
                    contact.getContactUuid(), e.getMessage());
        }
    }

    /** Affichage prix lead : "Prix sur demande" ou "{montant} {devise}". */
    private String formatPrix(Propriete p) {
        if (Boolean.TRUE.equals(p.getPrixSurDemande()) || p.getPrix() == null) {
            return "Prix sur demande";
        }
        String devise = p.getDevise() != null ? p.getDevise() : "";
        return (p.getPrix().toPlainString() + " " + devise).trim();
    }

    @Override
    public List<ContactView> findMesContactsRecus(Long vendeurUserId, int limit, int offset) {
        List<Contact> contacts = contactRepository.findRecusByVendeur(vendeurUserId, limit, offset);
        // Enrichissement live : on re-fetch les infos actuelles des demandeurs.
        // Pattern : 1 appel Feign par contact unique (cache éventuel à voir si N>100).
        // En cas d'échec : ContactView contient le snapshot uniquement (champs *Live = null).
        return contacts.stream()
                .map(this::toViewEnrichedLive)
                .toList();
    }

    private ContactView toViewEnrichedLive(Contact c) {
        ContactView view = ContactView.fromContact(c);
        try {
            User u = userClient.getUserById(c.getDemandeurUserId());
            if (u != null) {
                String nomLive = ((u.getFirstName() != null ? u.getFirstName() : "")
                        + " " + (u.getLastName() != null ? u.getLastName() : "")).trim();
                view.setNomLive(nomLive.isBlank() ? u.getUsername() : nomLive);
                view.setTelephoneLive(u.getPhone());
                view.setEmailLive(u.getEmail());
            }
        } catch (Exception e) {
            log.warn("Enrichissement live échoué pour user {} : {} — fallback snapshot",
                    c.getDemandeurUserId(), e.getMessage());
        }
        return view;
    }

    @Override
    public long countMesContactsRecus(Long vendeurUserId) {
        return contactRepository.countRecusByVendeur(vendeurUserId);
    }

    @Override
    public List<Contact> findMesContactsEnvoyes(Long userId, int limit, int offset) {
        return contactRepository.findEnvoyesByUser(userId, limit, offset);
    }

    @Override
    public long countMesContactsEnvoyes(Long userId) {
        return contactRepository.countEnvoyesByUser(userId);
    }

    @Override
    @Transactional
    public Contact marquerVu(String contactUuid, Long requesterUserId) {
        Optional<Long> vendeurUserId = contactRepository.findVendeurUserId(contactUuid);
        if (vendeurUserId.isEmpty()) {
            throw new ApiException("Contact introuvable : " + contactUuid);
        }
        if (!vendeurUserId.get().equals(requesterUserId)) {
            // L'annonce est publique → le vendeur est connaissable → 403 (pas 404)
            throw new ForbiddenException("Vous n'êtes pas le destinataire de ce contact");
        }
        return contactRepository.markVu(contactUuid)
                .orElseThrow(() -> new ApiException("Échec mise à jour"));
    }

    // ── Intermédiation Phase 1 : leads back-office ──

    @Override
    public List<LeadAdminView> findLeadsForAdmin(String statut, int limit, int offset) {
        String s = (statut != null && !statut.isBlank()) ? statut : "NOUVEAU";
        return contactRepository.findLeadsForAdmin(s, limit, offset);
    }

    @Override
    public long countLeadsForAdmin(String statut) {
        String s = (statut != null && !statut.isBlank()) ? statut : "NOUVEAU";
        return contactRepository.countLeadsForAdmin(s);
    }

    @Override
    @Transactional
    public Contact traiterLead(String contactUuid, String action, String noteAdmin, Long adminUserId) {
        // 404 si le lead n'existe pas du tout (NotFoundException → 404).
        contactRepository.findByUuid(contactUuid)
                .orElseThrow(() -> new NotFoundException("Lead contact introuvable : " + contactUuid));

        String leadStatut = switch (action) {
            case "TRAITE", "REJETE" -> action;
            default -> throw new ApiException("action invalide : " + action);
        };

        // UPDATE conditionnel (WHERE lead_statut='NOUVEAU') : empty = déjà traité → on refuse,
        // sans réécrire traite_par/traite_at.
        return contactRepository.traiterLead(contactUuid, leadStatut, adminUserId, noteAdmin)
                .orElseThrow(() -> new ApiException("Lead déjà traité — action ignorée"));
    }

    @Override
    public ProprietaireView getProprietaireByPropriete(String proprieteUuid) {
        Propriete propriete = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new NotFoundException("Propriété introuvable : " + proprieteUuid));
        ProfilImmo profil = profilImmoRepository.findById(propriete.getProfilId())
                .orElseThrow(() -> new NotFoundException("Profil propriétaire introuvable"));
        User u;
        try {
            u = userClient.getUserById(profil.getUserId());
        } catch (Exception e) {
            log.error("Lookup propriétaire Feign échec userId={} : {}", profil.getUserId(), e.getMessage());
            throw new ApiException("Service utilisateur indisponible, réessayez plus tard");
        }
        if (u == null) {
            throw new NotFoundException("Propriétaire introuvable");
        }
        return ProprietaireView.builder()
                .userId(u.getUserId())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .telephone(u.getPhone())
                .address(u.getAddress())
                .typeProfil(profil.getTypeProfil())
                .build();
    }
}
