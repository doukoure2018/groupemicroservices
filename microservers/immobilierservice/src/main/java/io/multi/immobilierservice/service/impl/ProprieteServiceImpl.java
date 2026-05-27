package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.domain.TypeBien;
import io.multi.immobilierservice.dto.ProprieteCreateRequest;
import io.multi.immobilierservice.dto.ProprieteUpdateRequest;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.repository.*;
import io.multi.immobilierservice.service.ProprieteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProprieteServiceImpl implements ProprieteService {

    private final ProprieteRepository proprieteRepository;
    private final PhotoRepository photoRepository;
    private final TypeBienRepository typeBienRepository;
    private final CommoditeRepository commoditeRepository;
    private final ProfilImmoRepository profilImmoRepository;

    @Override
    @Transactional
    public Propriete create(ProprieteCreateRequest req, Long userId) {
        ProfilImmo profil = getProfilOrFail(userId);
        if (Boolean.FALSE.equals(profil.getActif())) {
            throw new ApiException("Votre profil immobilier est désactivé");
        }
        TypeBien typeBien = typeBienRepository.findByCode(req.getTypeBienCode())
                .orElseThrow(() -> new ApiException("Type de bien inconnu : " + req.getTypeBienCode()));

        // Validations métier
        if ("LOCATION".equals(req.getTypeAnnonce()) && req.getDureeLocation() == null) {
            throw new ApiException("dureeLocation est requis pour type_annonce=LOCATION");
        }
        if ("LOCATION".equals(req.getTypeAnnonce()) && req.getPeriode() == null
                && !Boolean.TRUE.equals(req.getPrixSurDemande())) {
            throw new ApiException("periode est requise pour une location");
        }
        if (req.getLatitude() != null && req.getLongitude() == null
                || req.getLongitude() != null && req.getLatitude() == null) {
            throw new ApiException("latitude et longitude doivent être fournis ensemble");
        }

        Long localisationId = null;
        if (req.getLocalisationUuid() != null && !req.getLocalisationUuid().isBlank()) {
            localisationId = proprieteRepository.lookupLocalisationIdByUuid(req.getLocalisationUuid())
                    .orElseThrow(() -> new ApiException("Localisation introuvable : " + req.getLocalisationUuid()));
        }

        Propriete toSave = Propriete.builder()
                .profilId(profil.getProfilId())
                .agenceId(profil.getAgenceId())
                .typeAnnonce(req.getTypeAnnonce())
                .dureeLocation(req.getDureeLocation())
                .typeBienId(typeBien.getTypeBienId())
                .titre(req.getTitre())
                .description(req.getDescription())
                .prix(req.getPrix())
                .devise(req.getDevise() != null ? req.getDevise() : "GNF")
                .periode(req.getPeriode())
                .prixSurDemande(req.getPrixSurDemande())
                .prixNegociable(req.getPrixNegociable())
                .nombreChambres(req.getNombreChambres())
                .nombreSallesBain(req.getNombreSallesBain())
                .surfaceM2(req.getSurfaceM2())
                .nombreEtages(req.getNombreEtages())
                .etageSituation(req.getEtageSituation())
                .anneeConstruction(req.getAnneeConstruction())
                .moisCaution(req.getMoisCaution())
                .moisAvance(req.getMoisAvance())
                .moisHonoraire(req.getMoisHonoraire())
                .localisationId(localisationId)
                .adresseComplete(req.getAdresseComplete())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .afficherAdresseExacte(req.getAfficherAdresseExacte())
                .dateDisponibilite(req.getDateDisponibilite())
                .statut("BROUILLON")
                .nomContactPublic(req.getNomContactPublic())
                .telephoneContact(req.getTelephoneContact())
                .build();

        Propriete saved = proprieteRepository.save(toSave);
        log.info("Propriété créée : ref={} uuid={}", saved.getReference(), saved.getProprieteUuid());

        // Associer les commodités
        applyCommodites(saved.getProprieteId(), req.getCommoditesCodes());

        return enrich(saved);
    }

    @Override
    @Transactional
    public Propriete update(String proprieteUuid, ProprieteUpdateRequest req, Long userId) {
        Propriete existing = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        ensureOwner(existing, userId);

        Long localisationId = null;
        if (req.getLocalisationUuid() != null && !req.getLocalisationUuid().isBlank()) {
            localisationId = proprieteRepository.lookupLocalisationIdByUuid(req.getLocalisationUuid())
                    .orElseThrow(() -> new ApiException("Localisation introuvable : " + req.getLocalisationUuid()));
        }

        Propriete updates = Propriete.builder()
                .titre(req.getTitre())
                .description(req.getDescription())
                .dureeLocation(req.getDureeLocation())
                .prix(req.getPrix())
                .devise(req.getDevise())
                .periode(req.getPeriode())
                .prixSurDemande(req.getPrixSurDemande())
                .prixNegociable(req.getPrixNegociable())
                .nombreChambres(req.getNombreChambres())
                .nombreSallesBain(req.getNombreSallesBain())
                .surfaceM2(req.getSurfaceM2())
                .nombreEtages(req.getNombreEtages())
                .etageSituation(req.getEtageSituation())
                .anneeConstruction(req.getAnneeConstruction())
                .moisCaution(req.getMoisCaution())
                .moisAvance(req.getMoisAvance())
                .moisHonoraire(req.getMoisHonoraire())
                .localisationId(localisationId)
                .adresseComplete(req.getAdresseComplete())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .afficherAdresseExacte(req.getAfficherAdresseExacte())
                .dateDisponibilite(req.getDateDisponibilite())
                .nomContactPublic(req.getNomContactPublic())
                .telephoneContact(req.getTelephoneContact())
                .build();

        Propriete updated = proprieteRepository.update(proprieteUuid, updates)
                .orElseThrow(() -> new ApiException("Échec mise à jour propriété"));

        if (req.getCommoditesCodes() != null) {
            applyCommodites(updated.getProprieteId(), req.getCommoditesCodes());
        }

        return enrich(updated);
    }

    @Override
    @Transactional
    public Propriete getByUuid(String proprieteUuid, boolean incrementVues) {
        if (incrementVues) {
            proprieteRepository.incrementVues(proprieteUuid);
        }
        Propriete propriete = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        return enrich(propriete);
    }

    @Override
    public List<Propriete> findMine(Long userId, int limit, int offset) {
        ProfilImmo profil = getProfilOrFail(userId);
        List<Propriete> list = proprieteRepository.findByProfil(profil.getProfilId(), limit, offset);
        list.forEach(this::enrich);
        return list;
    }

    @Override
    @Transactional
    public Propriete publier(String proprieteUuid, Long userId) {
        // Note : la modération hybride (auto-publish si VERIFIE, sinon EN_ATTENTE_VALIDATION)
        // sera implémentée en Phase 9. Ici on passe simplement à PUBLIE.
        return changeStatut(proprieteUuid, userId, "PUBLIE",
                List.of("BROUILLON", "EN_ATTENTE_VALIDATION", "RETIRE"));
    }

    @Override
    @Transactional
    public Propriete retirer(String proprieteUuid, Long userId) {
        return changeStatut(proprieteUuid, userId, "RETIRE",
                List.of("PUBLIE", "EN_ATTENTE_VALIDATION", "BROUILLON"));
    }

    @Override
    @Transactional
    public Propriete marquerVendu(String proprieteUuid, Long userId) {
        Propriete p = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable"));
        if (!"VENTE".equals(p.getTypeAnnonce())) {
            throw new ApiException("Seules les annonces de type VENTE peuvent être marquées vendues");
        }
        return changeStatut(proprieteUuid, userId, "VENDU", List.of("PUBLIE", "RESERVE"));
    }

    @Override
    @Transactional
    public Propriete marquerLoue(String proprieteUuid, Long userId) {
        Propriete p = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable"));
        if (!"LOCATION".equals(p.getTypeAnnonce())) {
            throw new ApiException("Seules les annonces de type LOCATION peuvent être marquées louées");
        }
        return changeStatut(proprieteUuid, userId, "LOUE", List.of("PUBLIE", "RESERVE"));
    }

    @Override
    @Transactional
    public void supprimer(String proprieteUuid, Long userId) {
        Propriete p = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable"));
        ensureOwner(p, userId);
        // Soft delete : statut RETIRE. La suppression physique reste rare (FK CASCADE).
        proprieteRepository.updateStatut(proprieteUuid, "RETIRE");
    }

    // ---- helpers ----

    private Propriete changeStatut(String proprieteUuid, Long userId, String nouveauStatut, List<String> statutsAutorises) {
        Propriete p = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        ensureOwner(p, userId);
        if (!statutsAutorises.contains(p.getStatut())) {
            throw new ApiException("Transition interdite depuis le statut " + p.getStatut()
                    + " vers " + nouveauStatut);
        }
        Propriete updated = proprieteRepository.updateStatut(proprieteUuid, nouveauStatut)
                .orElseThrow(() -> new ApiException("Échec changement de statut"));
        return enrich(updated);
    }

    private void applyCommodites(Long proprieteId, List<String> codes) {
        if (codes == null) return;
        List<Commodite> commodites = commoditeRepository.findByCodes(codes);
        if (commodites.size() != codes.size()) {
            List<String> trouves = commodites.stream().map(Commodite::getCode).toList();
            List<String> manquants = codes.stream().filter(c -> !trouves.contains(c)).toList();
            throw new ApiException("Commodités inconnues : " + manquants);
        }
        proprieteRepository.replaceCommodites(proprieteId,
                commodites.stream().map(Commodite::getCommoditeId).toList());
    }

    private Propriete enrich(Propriete p) {
        if (p == null) return null;
        // Photos
        List<Photo> photos = photoRepository.findByPropriete(p.getProprieteId());
        p.setPhotos(photos);
        p.setPhotoCouverture(photos.stream()
                .filter(ph -> Boolean.TRUE.equals(ph.getEstCouverture()))
                .findFirst()
                .orElseGet(() -> photos.isEmpty() ? null : photos.get(0)));
        // Commodités
        p.setCommodites(proprieteRepository.findCommoditesOfPropriete(p.getProprieteId()));
        // Type de bien : skip pour l'instant (chargé via DTO côté API si besoin)
        return p;
    }

    private ProfilImmo getProfilOrFail(Long userId) {
        return profilImmoRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(
                        "Vous devez créer un profil immobilier avant de publier (POST /immo/profils)"));
    }

    private void ensureOwner(Propriete p, Long userId) {
        Optional<ProfilImmo> profil = profilImmoRepository.findByUserId(userId);
        if (profil.isEmpty() || !profil.get().getProfilId().equals(p.getProfilId())) {
            throw new ApiException("Vous n'êtes pas propriétaire de cette annonce");
        }
    }
}
