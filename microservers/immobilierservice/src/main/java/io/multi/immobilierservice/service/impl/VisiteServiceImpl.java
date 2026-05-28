package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.VisiteCreateRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.repository.FavoriRepository;
import io.multi.immobilierservice.repository.VisiteRepository;
import io.multi.immobilierservice.service.VisiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisiteServiceImpl implements VisiteService {

    private final VisiteRepository visiteRepository;
    private final FavoriRepository favoriRepository;  // réutilise lookupProprieteIdByUuid

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
            // TODO Phase 11 : Kafka VISITE_DEMANDEE → email vendeur
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
        // TODO Phase 11 : Kafka VISITE_CONFIRMEE → email visiteur
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
}
