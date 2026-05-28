package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ContactCreateRequest;
import io.multi.immobilierservice.dto.ContactView;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.repository.ContactRepository;
import io.multi.immobilierservice.repository.FavoriRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.service.ContactService;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import io.multi.immobilierservice.service.PreferencesNotificationService;
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
    private final PreferencesNotificationService preferencesService;

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
     * Publie un événement IMMO_CONTACT_RECU avec payload auto-suffisant pour l'email
     * (snapshot des coordonnées vendeur + visiteur + propriété au moment T). Si la
     * récupération des infos vendeur échoue, on log et on skip — le contact reste
     * créé en BD, le vendeur le verra dans son interface "mes contacts".
     */
    private void publishContactRecu(Contact contact, String proprieteUuid, Long proprieteId) {
        try {
            Propriete propriete = proprieteRepository.findById(proprieteId).orElse(null);
            if (propriete == null) {
                log.warn("Notification CONTACT_RECU skip : propriété {} introuvable", proprieteUuid);
                return;
            }
            ProfilImmo vendeurProfil = profilImmoRepository.findById(propriete.getProfilId()).orElse(null);
            if (vendeurProfil == null) {
                log.warn("Notification CONTACT_RECU skip : profil {} introuvable", propriete.getProfilId());
                return;
            }
            User vendeur = userClient.getUserById(vendeurProfil.getUserId());
            if (vendeur == null || vendeur.getEmail() == null) {
                log.warn("Notification CONTACT_RECU skip : vendeur {} introuvable ou sans email",
                        vendeurProfil.getUserId());
                return;
            }
            String vendeurNom = ((vendeur.getFirstName() != null ? vendeur.getFirstName() : "")
                    + " " + (vendeur.getLastName() != null ? vendeur.getLastName() : "")).trim();
            if (vendeurNom.isBlank()) vendeurNom = vendeur.getUsername();

            // Snapshot des préférences SMS du vendeur (destinataire du SMS).
            // Si désactivé après le publish, le SMS partira quand même (choix MVP).
            boolean smsEnabled = preferencesService.getOrDefaults(vendeurProfil.getUserId()).isContactSms();

            Map<String, Object> data = new HashMap<>();
            data.put("vendeurEmail", vendeur.getEmail());
            data.put("vendeurNom", vendeurNom);
            data.put("vendeurTelephone", vendeur.getPhone() != null ? vendeur.getPhone() : "");
            data.put("smsEnabled", smsEnabled);
            data.put("proprieteUuid", proprieteUuid);
            data.put("proprieteReference", propriete.getReference());
            data.put("proprieteTitre", propriete.getTitre());
            data.put("visiteurNom", contact.getNomDemandeur());
            data.put("visiteurTelephone", contact.getTelephoneDemandeur() != null ? contact.getTelephoneDemandeur() : "");
            data.put("visiteurEmail", contact.getEmailDemandeur() != null ? contact.getEmailDemandeur() : "");
            data.put("message", contact.getMessage() != null ? contact.getMessage() : "");
            data.put("typeDemande", contact.getTypeDemande());
            data.put("dateContact", contact.getCreatedAt() != null
                    ? contact.getCreatedAt().toString() : "");

            String reference = EventType.IMMO_CONTACT_RECU.name() + ":" + contact.getContactUuid();
            notificationProducer.publish(EventType.IMMO_CONTACT_RECU, reference, data);
        } catch (Exception e) {
            // L'event publish ne doit JAMAIS faire rollback la création du contact.
            log.error("Échec publication CONTACT_RECU pour contact {} : {} — contact persisté quand même",
                    contact.getContactUuid(), e.getMessage());
        }
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
}
