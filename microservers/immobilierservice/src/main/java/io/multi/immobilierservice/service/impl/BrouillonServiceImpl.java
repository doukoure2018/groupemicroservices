package io.multi.immobilierservice.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.immobilierservice.domain.Brouillon;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.BrouillonSaveRequest;
import io.multi.immobilierservice.dto.ProprieteCreateRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.NotFoundException;
import io.multi.immobilierservice.repository.BrouillonRepository;
import io.multi.immobilierservice.service.BrouillonService;
import io.multi.immobilierservice.service.ProprieteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrouillonServiceImpl implements BrouillonService {

    private final BrouillonRepository brouillonRepository;
    private final ProprieteService proprieteService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Brouillon create(BrouillonSaveRequest request, Long userId) {
        String json = serialize(request.getDonneesJson());
        Brouillon saved = brouillonRepository.save(userId, json, request.getEtapeActuelle());
        log.info("Brouillon créé : uuid={} userId={} étape={}",
                saved.getBrouillonUuid(), userId, saved.getEtapeActuelle());
        return saved;
    }

    @Override
    @Transactional
    public Brouillon update(String brouillonUuid, BrouillonSaveRequest request, Long userId) {
        ensureOwner(brouillonUuid, userId);
        String json = serialize(request.getDonneesJson());
        return brouillonRepository.update(brouillonUuid, json, request.getEtapeActuelle())
                .orElseThrow(() -> new ApiException("Échec mise à jour brouillon"));
    }

    @Override
    public Brouillon getByUuid(String brouillonUuid, Long userId) {
        // Ressource PRIVÉE : 404 si introuvable OU si non-owner (anti-fuite d'information).
        Brouillon b = brouillonRepository.findByUuid(brouillonUuid)
                .orElseThrow(() -> new NotFoundException("Brouillon introuvable : " + brouillonUuid));
        if (!b.getUserId().equals(userId)) {
            throw new NotFoundException("Brouillon introuvable : " + brouillonUuid);
        }
        return b;
    }

    @Override
    public List<Brouillon> findMine(Long userId) {
        return brouillonRepository.findByUser(userId);
    }

    @Override
    @Transactional
    public void supprimer(String brouillonUuid, Long userId) {
        ensureOwner(brouillonUuid, userId);
        brouillonRepository.deleteByUuid(brouillonUuid);
    }

    @Override
    @Transactional
    public Propriete materialiser(String brouillonUuid, Long userId) {
        // Ressource PRIVÉE : 404 si introuvable OU si non-owner.
        Brouillon b = brouillonRepository.findByUuid(brouillonUuid)
                .orElseThrow(() -> new NotFoundException("Brouillon introuvable : " + brouillonUuid));
        if (!b.getUserId().equals(userId)) {
            throw new NotFoundException("Brouillon introuvable : " + brouillonUuid);
        }

        ProprieteCreateRequest req = toCreateRequest(b.getDonneesJson());
        Propriete propriete = proprieteService.create(req, userId);
        brouillonRepository.linkPropriete(brouillonUuid, propriete.getProprieteId());
        // Supprime le brouillon : la propriété (BROUILLON) prend le relais
        brouillonRepository.deleteByUuid(brouillonUuid);
        log.info("Brouillon {} matérialisé en propriété {}",
                brouillonUuid, propriete.getProprieteUuid());
        return propriete;
    }

    // ---- helpers ----

    /**
     * Convertit le JSONB (organisé par étapes) en {@link ProprieteCreateRequest}.
     * Validations : champs minimums obligatoires (typeAnnonce, typeBienCode).
     */
    @SuppressWarnings("unchecked")
    private ProprieteCreateRequest toCreateRequest(Map<String, Object> donnees) {
        if (donnees == null || donnees.isEmpty()) {
            throw new ApiException("Brouillon vide — impossible de matérialiser");
        }
        Map<String, Object> etape1 = (Map<String, Object>) donnees.getOrDefault("etape1", Map.of());
        Map<String, Object> etape2 = (Map<String, Object>) donnees.getOrDefault("etape2", Map.of());
        Map<String, Object> etape3 = (Map<String, Object>) donnees.getOrDefault("etape3", Map.of());
        Map<String, Object> etape4 = (Map<String, Object>) donnees.getOrDefault("etape4", Map.of());

        ProprieteCreateRequest req = new ProprieteCreateRequest();

        // Étape 1
        req.setTypeAnnonce(requireString(etape1, "typeAnnonce", "etape1.typeAnnonce"));
        req.setDureeLocation(asString(etape1.get("dureeLocation")));
        req.setTypeBienCode(requireString(etape1, "typeBienCode", "etape1.typeBienCode"));

        // Étape 2
        req.setLocalisationUuid(asString(etape2.get("localisationUuid")));
        req.setAdresseComplete(asString(etape2.get("adresseComplete")));
        req.setLatitude(asDouble(etape2.get("latitude")));
        req.setLongitude(asDouble(etape2.get("longitude")));
        req.setAfficherAdresseExacte(asBoolean(etape2.get("afficherAdresseExacte"), false));

        // Étape 3
        req.setPrix(asBigDecimal(etape3.get("prix")));
        if (etape3.get("devise") instanceof String d) req.setDevise(d);
        req.setPeriode(asString(etape3.get("periode")));
        req.setPrixSurDemande(asBoolean(etape3.get("prixSurDemande"), false));
        req.setPrixNegociable(asBoolean(etape3.get("prixNegociable"), false));
        Integer chambres = asInt(etape3.get("nombreChambres"));
        if (chambres != null) req.setNombreChambres(chambres);
        Integer sb = asInt(etape3.get("nombreSallesBain"));
        if (sb != null) req.setNombreSallesBain(sb);
        req.setSurfaceM2(asBigDecimal(etape3.get("surfaceM2")));
        req.setNombreEtages(asInt(etape3.get("nombreEtages")));
        req.setEtageSituation(asInt(etape3.get("etageSituation")));
        req.setAnneeConstruction(asInt(etape3.get("anneeConstruction")));
        req.setMoisCaution(asInt(etape3.get("moisCaution")));
        req.setMoisAvance(asInt(etape3.get("moisAvance")));
        req.setMoisHonoraire(asInt(etape3.get("moisHonoraire")));
        Object dateDispo = etape3.get("dateDisponibilite");
        if (dateDispo instanceof String s && !s.isBlank()) {
            req.setDateDisponibilite(LocalDate.parse(s));
        }
        if (etape3.get("commoditesCodes") instanceof List<?> l) {
            req.setCommoditesCodes(l.stream().map(String::valueOf).toList());
        }

        // Étape 4
        req.setDescription(asString(etape4.get("description")));
        req.setTitre(asString(etape4.get("titre")));
        req.setNomContactPublic(asString(etape4.get("nomContactPublic")));
        req.setTelephoneContact(asString(etape4.get("telephoneContact")));

        return req;
    }

    private String serialize(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data == null ? Map.of() : data);
        } catch (Exception e) {
            throw new ApiException("Sérialisation JSON brouillon impossible : " + e.getMessage());
        }
    }

    private void ensureOwner(String brouillonUuid, Long userId) {
        // Ressource PRIVÉE : 404 si introuvable OU si non-owner (anti-fuite).
        Brouillon b = brouillonRepository.findByUuid(brouillonUuid)
                .orElseThrow(() -> new NotFoundException("Brouillon introuvable : " + brouillonUuid));
        if (!b.getUserId().equals(userId)) {
            throw new NotFoundException("Brouillon introuvable : " + brouillonUuid);
        }
    }

    // ---- type coercions ----

    private static String requireString(Map<String, Object> m, String key, String fullPath) {
        Object v = m.get(key);
        if (v == null || (v instanceof String s && s.isBlank())) {
            throw new ApiException("Champ obligatoire manquant : " + fullPath);
        }
        return v.toString();
    }

    private static String asString(Object v) {
        return v == null ? null : v.toString();
    }

    private static Integer asInt(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private static Double asDouble(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private static BigDecimal asBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return new BigDecimal(n.toString());
        try { return new BigDecimal(v.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private static Boolean asBoolean(Object v, boolean defaultValue) {
        if (v == null) return defaultValue;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(v.toString());
    }
}
