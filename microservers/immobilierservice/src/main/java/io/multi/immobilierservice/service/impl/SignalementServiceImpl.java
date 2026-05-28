package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.domain.Signalement;
import io.multi.immobilierservice.dto.SignalementCreateRequest;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.repository.FavoriRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.repository.SignalementRepository;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import io.multi.immobilierservice.service.SignalementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalementServiceImpl implements SignalementService {

    /** Seuil informatif : alerte admin si une propriété atteint N signalements distincts. */
    private static final int SEUIL_ALERTE_ADMIN = 3;

    private final SignalementRepository signalementRepository;
    private final ProprieteRepository proprieteRepository;
    private final FavoriRepository favoriRepository;
    private final ImmoNotificationProducer notificationProducer;

    /** Email destinataire pour les alertes seuil (configurable ; pas un user en BD). */
    @Value("${immo.moderation.admin-email:moderation@digi-creditrural-io.com}")
    private String moderationAdminEmail;

    @Override
    @Transactional
    public Signalement creer(String proprieteUuid, SignalementCreateRequest req, Long userId) {
        Long proprieteId = favoriRepository.lookupProprieteIdByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));

        // Anti-doublon : un user ne peut pas spammer 10 signalements sur le même bien
        if (signalementRepository.existsSignalementOfUser(userId, proprieteId)) {
            throw new ApiException("Vous avez déjà signalé cette annonce, en attente de traitement");
        }

        Signalement s = signalementRepository.save(Signalement.builder()
                .userId(userId)
                .proprieteId(proprieteId)
                .motif(req.getMotif())
                .description(req.getDescription())
                .build());

        // Notification admin si seuil atteint (PAS de bascule auto — décision 10b-β).
        int nbDistinct = signalementRepository.countDistinctUsersForPropriete(proprieteId);
        if (nbDistinct >= SEUIL_ALERTE_ADMIN) {
            log.warn("[SEUIL ALERTE] propriete uuid={} a maintenant {} signalements distincts (≥ {})",
                    proprieteUuid, nbDistinct, SEUIL_ALERTE_ADMIN);
            publishSignalementSeuil(proprieteUuid, proprieteId, nbDistinct);
        }

        log.info("Signalement créé : uuid={} user={} propriete={} motif={}",
                s.getSignalementUuid(), userId, proprieteUuid, req.getMotif());
        return s;
    }

    @Override
    public List<Signalement> findForAdmin(String statut, int limit, int offset) {
        String s = (statut != null && !statut.isBlank()) ? statut : "EN_ATTENTE";
        return signalementRepository.findForAdmin(s, limit, offset);
    }

    @Override
    public long countForAdmin(String statut) {
        String s = (statut != null && !statut.isBlank()) ? statut : "EN_ATTENTE";
        return signalementRepository.countForAdmin(s);
    }

    @Override
    @Transactional
    public Signalement traiter(String signalementUuid, String action, String notesAdmin, Long adminUserId) {
        Signalement existant = signalementRepository.findByUuid(signalementUuid)
                .orElseThrow(() -> new ApiException("Signalement introuvable : " + signalementUuid));
        if (!"EN_ATTENTE".equals(existant.getStatut())) {
            throw new ApiException("Signalement déjà " + existant.getStatut().toLowerCase());
        }

        String nouveauStatut;
        boolean retirerPropriete;
        switch (action) {
            case "RETIRE" -> { nouveauStatut = "TRAITE";  retirerPropriete = true;  }
            case "REJETE" -> { nouveauStatut = "REJETE";  retirerPropriete = false; }
            case "LAISSE" -> { nouveauStatut = "TRAITE";  retirerPropriete = false; }
            default -> throw new ApiException("action invalide : " + action);
        }

        Signalement updated = signalementRepository.traiter(signalementUuid, nouveauStatut, adminUserId, notesAdmin)
                .orElseThrow(() -> new ApiException("Échec mise à jour signalement"));

        if (retirerPropriete) {
            // On a propriete_id ; le repository.rejeter() attend l'uuid → lookup d'abord.
            var propriete = proprieteRepository.findById(existant.getProprieteId());
            if (propriete.isPresent()) {
                String motifRetrait = "Retrait suite signalement (" + existant.getMotif() + ")"
                        + (notesAdmin != null && !notesAdmin.isBlank() ? " — " + notesAdmin : "");
                proprieteRepository.rejeter(propriete.get().getProprieteUuid(), motifRetrait);
                log.info("Propriété {} passée à RETIRE suite signalement {}",
                        propriete.get().getProprieteUuid(), signalementUuid);
            } else {
                log.warn("Action RETIRE : propriété {} introuvable (déjà supprimée ?)",
                        existant.getProprieteId());
            }
        }

        log.info("Signalement {} traité par admin {} : action={} → statut={}",
                signalementUuid, adminUserId, action, nouveauStatut);
        return updated;
    }

    /**
     * Publie IMMO_SIGNALEMENT_SEUIL → email admin. Idempotent par propriete_uuid :
     * une seule alerte par bien, même si le compteur dépasse 3 plusieurs fois
     * (les rejeu/franchissements successifs ne re-spamment pas l'admin).
     */
    private void publishSignalementSeuil(String proprieteUuid, Long proprieteId, int nbDistinct) {
        try {
            Propriete propriete = proprieteRepository.findById(proprieteId).orElse(null);
            if (propriete == null) return;
            Map<String, Object> data = new HashMap<>();
            data.put("adminEmail", moderationAdminEmail);
            data.put("proprieteUuid", proprieteUuid);
            data.put("proprieteReference", propriete.getReference());
            data.put("proprieteTitre", propriete.getTitre());
            data.put("nbSignalementsDistincts", String.valueOf(nbDistinct));
            data.put("derniersMotifs", ""); // optionnel, peut être enrichi plus tard
            notificationProducer.publish(EventType.IMMO_SIGNALEMENT_SEUIL,
                    EventType.IMMO_SIGNALEMENT_SEUIL.name() + ":" + proprieteUuid, data);
        } catch (Exception e) {
            log.error("Échec publish SIGNALEMENT_SEUIL pour {} : {}", proprieteUuid, e.getMessage());
        }
    }
}
