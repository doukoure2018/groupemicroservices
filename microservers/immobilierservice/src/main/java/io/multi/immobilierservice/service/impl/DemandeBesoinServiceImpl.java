package io.multi.immobilierservice.service.impl;

import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import io.multi.immobilierservice.domain.Agence;
import io.multi.immobilierservice.domain.DemandeBesoin;
import io.multi.immobilierservice.dto.DemandeCreateRequest;
import io.multi.immobilierservice.event.EventType;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.repository.AgenceRepository;
import io.multi.immobilierservice.repository.DemandeBesoinRepository;
import io.multi.immobilierservice.service.DemandeBesoinService;
import io.multi.immobilierservice.service.ImmoNotificationProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemandeBesoinServiceImpl implements DemandeBesoinService {

    private final DemandeBesoinRepository demandeRepository;
    private final AgenceRepository agenceRepository;
    private final ImmoNotificationProducer notificationProducer;
    private final UserClient userClient;

    @Override
    @Transactional
    public DemandeBesoin create(DemandeCreateRequest request, Long userId) {
        String commoditesJson = request.getCommoditeIds() == null || request.getCommoditeIds().isEmpty()
                ? null
                : request.getCommoditeIds().stream().map(String::valueOf)
                        .collect(Collectors.joining(",", "[", "]"));

        DemandeBesoin demande = demandeRepository.save(DemandeBesoin.builder()
                .userId(userId)
                .typeAnnonce(request.getTypeAnnonce())
                .typeBienId(request.getTypeBienId())
                .communeId(request.getCommuneId())
                .quartierId(request.getQuartierId())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .devise(request.getDevise())
                .nbChambresMin(request.getNbChambresMin())
                .commoditeIdsJson(commoditesJson)
                .description(request.getDescription())
                .contactTelephone(request.getContactTelephone())
                .contactWhatsapp(request.getContactWhatsapp())
                .build());

        diffuserAuxAgences(demande);
        return demande;
    }

    /**
     * Diffusion : agences VERIFIEES de la commune du besoin, fallback région,
     * fallback toutes. Un événement Kafka par agence (idempotent par
     * demande+agence). Best-effort : un échec de diffusion ne bloque pas la création.
     */
    private void diffuserAuxAgences(DemandeBesoin demande) {
        try {
            List<Agence> cibles = agenceRepository.findVerifieesByCommune(demande.getCommuneId());
            String niveau = "COMMUNE";
            if (cibles.isEmpty() && demande.getRegionId() != null) {
                cibles = agenceRepository.findVerifieesByRegion(demande.getRegionId());
                niveau = "REGION";
            }
            if (cibles.isEmpty()) {
                cibles = agenceRepository.findVerifieesAll();
                niveau = "TOUTES";
            }
            log.info("Diffusion demande {} : {} agence(s) ciblée(s) (niveau {})",
                    demande.getReference(), cibles.size(), niveau);

            String clientNom = lookupClientNom(demande.getUserId());
            for (Agence agence : cibles) {
                String email = agence.getEmail();
                if (email == null || email.isBlank()) continue;
                Map<String, Object> data = new HashMap<>();
                data.put("agenceEmail", email);
                data.put("agenceNom", agence.getNom());
                data.put("reference", demande.getReference());
                data.put("typeAnnonce", demande.getTypeAnnonce());
                data.put("typeBienLibelle", nullSafe(demande.getTypeBienLibelle()));
                data.put("communeLibelle", nullSafe(demande.getCommuneLibelle()));
                data.put("quartierLibelle", nullSafe(demande.getQuartierLibelle()));
                data.put("regionLibelle", nullSafe(demande.getRegionLibelle()));
                data.put("budgetMin", demande.getBudgetMin() != null ? demande.getBudgetMin().toPlainString() : "");
                data.put("budgetMax", demande.getBudgetMax() != null ? demande.getBudgetMax().toPlainString() : "");
                data.put("devise", nullSafe(demande.getDevise()));
                data.put("nbChambresMin", demande.getNbChambresMin() != null ? demande.getNbChambresMin().toString() : "");
                data.put("description", nullSafe(demande.getDescription()));
                data.put("clientNom", clientNom);
                data.put("contactTelephone", nullSafe(demande.getContactTelephone()));
                data.put("contactWhatsapp", nullSafe(demande.getContactWhatsapp()));
                notificationProducer.publish(EventType.IMMO_DEMANDE_BESOIN,
                        EventType.IMMO_DEMANDE_BESOIN.name() + ":" + demande.getDemandeUuid() + ":" + agence.getAgenceUuid(),
                        data);
            }
        } catch (Exception e) {
            log.error("Échec diffusion demande {} : {}", demande.getDemandeUuid(), e.getMessage());
        }
    }

    @Override
    public List<DemandeBesoin> mesDemandes(Long userId) {
        return demandeRepository.findMesDemandes(userId);
    }

    @Override
    public Map<String, Object> pourMonAgence(Long userId, String scope, int limit, int offset) {
        Agence agence = agenceRepository.findByProprietaire(userId).stream().findFirst()
                .orElseThrow(() -> new ApiException("Aucune agence associée à votre compte"));
        if (!"VERIFIE".equals(agence.getStatutVerification())) {
            throw new ForbiddenException("Votre agence doit être validée par la conformité pour consulter les demandes");
        }

        Map<String, Object> result = new HashMap<>();
        boolean zoneConnue = agence.getCommuneId() != null || agence.getRegionId() != null;
        if ("TOUTES".equalsIgnoreCase(scope) || !zoneConnue) {
            result.put("demandes", demandeRepository.findActivesAll(limit, offset));
            result.put("total", demandeRepository.countActivesAll());
            result.put("scope", "TOUTES");
        } else {
            result.put("demandes", demandeRepository.findActivesZone(agence.getCommuneId(), agence.getRegionId(), limit, offset));
            result.put("total", demandeRepository.countActivesZone(agence.getCommuneId(), agence.getRegionId()));
            result.put("scope", "ZONE");
        }
        result.put("limit", limit);
        result.put("offset", offset);
        return result;
    }

    @Override
    @Transactional
    public DemandeBesoin annuler(String demandeUuid, Long userId) {
        DemandeBesoin demande = demandeRepository.findByUuid(demandeUuid)
                .orElseThrow(() -> new ApiException("Demande introuvable : " + demandeUuid));
        if (!demande.getUserId().equals(userId)) {
            throw new ForbiddenException("Vous n'êtes pas l'auteur de cette demande");
        }
        if (!"ACTIVE".equals(demande.getStatut())) {
            throw new ApiException("Cette demande n'est plus active (statut : " + demande.getStatut() + ")");
        }
        return demandeRepository.updateStatut(demandeUuid, "ANNULEE")
                .orElseThrow(() -> new ApiException("Échec de l'annulation"));
    }

    private String lookupClientNom(Long userId) {
        try {
            User user = userClient.getUserById(userId);
            if (user != null) {
                String prenom = user.getFirstName() != null ? user.getFirstName() : "";
                String nom = user.getLastName() != null ? user.getLastName() : "";
                return (prenom + " " + nom).trim();
            }
        } catch (Exception e) {
            log.warn("Lookup client {} impossible : {}", userId, e.getMessage());
        }
        return "";
    }

    private static String nullSafe(String s) {
        return s != null ? s : "";
    }
}
