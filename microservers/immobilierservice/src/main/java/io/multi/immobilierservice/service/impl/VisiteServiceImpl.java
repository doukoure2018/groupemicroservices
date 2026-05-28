package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.VisiteCreateRequest;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.repository.FavoriRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.repository.UserLookupRepository;
import io.multi.immobilierservice.repository.VisiteRepository;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import io.multi.immobilierservice.service.PreferencesNotificationService;
import io.multi.immobilierservice.service.VisiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisiteServiceImpl implements VisiteService {

    private final VisiteRepository visiteRepository;
    private final FavoriRepository favoriRepository;  // réutilise lookupProprieteIdByUuid
    private final ProprieteRepository proprieteRepository;
    private final ProfilImmoRepository profilImmoRepository;
    private final UserLookupRepository userLookupRepository;
    private final ImmoNotificationProducer notificationProducer;
    private final PreferencesNotificationService preferencesService;

    @Override
    @Transactional
    public Visite demander(String proprieteUuid, VisiteCreateRequest req, Long visiteurUserId) {
        Long proprieteId = favoriRepository.lookupProprieteIdByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));

        Visite v = Visite.builder()
                .proprieteId(proprieteId)
                .visiteurUserId(visiteurUserId)
                .dateVisite(req.getDateVisite())
                .heureVisite(req.getHeureVisite())
                .notesVisiteur(req.getNotesVisiteur())
                .build();
        try {
            Visite saved = visiteRepository.save(v);
            log.info("Visite demandée : uuid={} user={} propriete={} date={}",
                    saved.getVisiteUuid(), visiteurUserId, proprieteUuid, saved.getDateVisite());
            publishVisiteDemandee(saved, proprieteUuid, proprieteId, visiteurUserId);
            return saved;
        } catch (DuplicateKeyException e) {
            // Index uq_immo_visite_active garantit unicité (DEMANDEE/CONFIRMEE)
            throw new ApiException("Vous avez déjà une visite en cours sur ce bien — "
                    + "annulez la précédente avant d'en demander une nouvelle");
        }
    }

    @Override
    public List<Visite> findMesVisitesVisiteur(Long userId, int limit, int offset) {
        return visiteRepository.findByVisiteur(userId, limit, offset);
    }

    @Override
    public long countMesVisitesVisiteur(Long userId) {
        return visiteRepository.countByVisiteur(userId);
    }

    @Override
    public List<Visite> findVisitesSurMesAnnonces(Long vendeurUserId, int limit, int offset) {
        return visiteRepository.findByVendeur(vendeurUserId, limit, offset);
    }

    @Override
    public long countVisitesSurMesAnnonces(Long vendeurUserId) {
        return visiteRepository.countByVendeur(vendeurUserId);
    }

    @Override
    @Transactional
    public Visite confirmer(String visiteUuid, Long vendeurUserId) {
        ensureVendeurOwner(visiteUuid, vendeurUserId);
        Visite v = visiteRepository.confirmer(visiteUuid)
                .orElseThrow(() -> new ApiException(
                        "Confirmation impossible — la visite n'est pas en statut DEMANDEE"));
        publishVisiteConfirmee(v, vendeurUserId);
        return v;
    }

    @Override
    @Transactional
    public Visite effectuer(String visiteUuid, Long vendeurUserId, String notesVendeur) {
        ensureVendeurOwner(visiteUuid, vendeurUserId);
        return visiteRepository.effectuer(visiteUuid, notesVendeur)
                .orElseThrow(() -> new ApiException(
                        "Marquage effectuée impossible — visite doit être CONFIRMEE"));
    }

    @Override
    @Transactional
    public Visite annuler(String visiteUuid, Long requesterUserId, String motif) {
        Visite existante = visiteRepository.findByUuid(visiteUuid)
                .orElseThrow(() -> new ApiException("Visite introuvable : " + visiteUuid));
        // Autorisation : soit le visiteur lui-même, soit le vendeur (owner du bien)
        Long ownerUserId = visiteRepository.findOwnerUserId(visiteUuid).orElse(null);
        boolean isVisiteur = existante.getVisiteurUserId().equals(requesterUserId);
        boolean isVendeur = ownerUserId != null && ownerUserId.equals(requesterUserId);
        if (!isVisiteur && !isVendeur) {
            throw new ForbiddenException("Vous ne pouvez pas annuler cette visite");
        }
        return visiteRepository.annuler(visiteUuid, motif)
                .orElseThrow(() -> new ApiException(
                        "Annulation impossible — la visite est déjà " + existante.getStatut().toLowerCase()));
    }

    private void ensureVendeurOwner(String visiteUuid, Long vendeurUserId) {
        Long ownerUserId = visiteRepository.findOwnerUserId(visiteUuid)
                .orElseThrow(() -> new ApiException("Visite introuvable : " + visiteUuid));
        if (!ownerUserId.equals(vendeurUserId)) {
            throw new ForbiddenException("Seul le propriétaire du bien peut effectuer cette action");
        }
    }

    /** Publie IMMO_VISITE_DEMANDEE → email vendeur. Snapshot complet pour template. */
    private void publishVisiteDemandee(Visite visite, String proprieteUuid, Long proprieteId, Long visiteurUserId) {
        try {
            Propriete propriete = proprieteRepository.findById(proprieteId).orElse(null);
            if (propriete == null) return;
            ProfilImmo vendeurProfil = profilImmoRepository.findById(propriete.getProfilId()).orElse(null);
            if (vendeurProfil == null) return;
            var vendeur = userLookupRepository.findById(vendeurProfil.getUserId()).orElse(null);
            if (vendeur == null || vendeur.email() == null) return;
            var visiteur = userLookupRepository.findById(visiteurUserId).orElse(null);

            Map<String, Object> data = new HashMap<>();
            data.put("vendeurEmail", vendeur.email());
            data.put("vendeurNom", vendeur.nomComplet());
            data.put("proprieteUuid", proprieteUuid);
            data.put("proprieteReference", propriete.getReference());
            data.put("proprieteTitre", propriete.getTitre());
            data.put("visiteurNom", visiteur != null ? visiteur.nomComplet() : "Utilisateur");
            data.put("dateVisite", visite.getDateVisite() != null ? visite.getDateVisite().toString() : "");
            data.put("heureVisite", visite.getHeureVisite() != null ? visite.getHeureVisite().toString() : "");
            data.put("notesVisiteur", visite.getNotesVisiteur() != null ? visite.getNotesVisiteur() : "");

            notificationProducer.publish(
                    EventType.IMMO_VISITE_DEMANDEE,
                    EventType.IMMO_VISITE_DEMANDEE.name() + ":" + visite.getVisiteUuid(),
                    data);
        } catch (Exception e) {
            log.error("Échec publish VISITE_DEMANDEE pour visite {} : {}", visite.getVisiteUuid(), e.getMessage());
        }
    }

    /** Publie IMMO_VISITE_CONFIRMEE → email + (peut-être) SMS visiteur. */
    private void publishVisiteConfirmee(Visite visite, Long vendeurUserId) {
        try {
            Propriete propriete = proprieteRepository.findById(visite.getProprieteId()).orElse(null);
            if (propriete == null) return;
            var vendeur = userLookupRepository.findById(vendeurUserId).orElse(null);
            var visiteur = userLookupRepository.findById(visite.getVisiteurUserId()).orElse(null);
            if (visiteur == null || visiteur.email() == null) return;

            // Snapshot des préférences SMS du visiteur (destinataire du SMS).
            boolean smsEnabled = preferencesService.getOrDefaults(visite.getVisiteurUserId()).isVisiteConfirmeeSms();

            Map<String, Object> data = new HashMap<>();
            data.put("visiteurEmail", visiteur.email());
            data.put("visiteurNom", visiteur.nomComplet());
            data.put("visiteurTelephone", visiteur.phone() != null ? visiteur.phone() : "");
            data.put("smsEnabled", smsEnabled);
            data.put("proprieteUuid", propriete.getProprieteUuid());
            data.put("proprieteReference", propriete.getReference());
            data.put("proprieteTitre", propriete.getTitre());
            data.put("vendeurNom", vendeur != null ? vendeur.nomComplet() : "");
            data.put("vendeurTelephone", vendeur != null && vendeur.phone() != null ? vendeur.phone() : "");
            data.put("dateVisite", visite.getDateVisite() != null ? visite.getDateVisite().toString() : "");
            data.put("heureVisite", visite.getHeureVisite() != null ? visite.getHeureVisite().toString() : "");

            notificationProducer.publish(
                    EventType.IMMO_VISITE_CONFIRMEE,
                    EventType.IMMO_VISITE_CONFIRMEE.name() + ":" + visite.getVisiteUuid(),
                    data);
        } catch (Exception e) {
            log.error("Échec publish VISITE_CONFIRMEE pour visite {} : {}", visite.getVisiteUuid(), e.getMessage());
        }
    }
}
