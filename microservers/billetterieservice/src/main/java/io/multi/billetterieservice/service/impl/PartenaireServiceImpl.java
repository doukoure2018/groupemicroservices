package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Localisation;
import io.multi.billetterieservice.domain.Partenaire;
import io.multi.billetterieservice.dto.PartenaireRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.LocalisationRepository;
import io.multi.billetterieservice.repository.PartenaireRepository;
import io.multi.billetterieservice.service.PartenaireService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Implémentation du service pour la gestion des partenaires.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PartenaireServiceImpl implements PartenaireService {

    private final PartenaireRepository partenaireRepository;
    private final LocalisationRepository localisationRepository;

    // Constantes pour les statuts
    private static final String STATUT_ACTIF = "ACTIF";
    private static final String STATUT_INACTIF = "INACTIF";
    private static final String STATUT_SUSPENDU = "SUSPENDU";
    private static final String STATUT_EN_ATTENTE = "EN_ATTENTE";

    // ========== LECTURE ==========

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getAll() {
        log.info("Récupération de tous les partenaires");
        return partenaireRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getAllActifs() {
        log.info("Récupération de tous les partenaires actifs");
        return partenaireRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public Partenaire getByUuid(String uuid) {
        log.info("Récupération du partenaire: {}", uuid);
        return partenaireRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Partenaire non trouvé: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public Partenaire getByNom(String nom) {
        log.info("Récupération du partenaire par nom: {}", nom);
        return partenaireRepository.findByNom(nom)
                .orElseThrow(() -> new ApiException("Partenaire non trouvé: " + nom));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getByType(String typePartenaire) {
        log.info("Récupération des partenaires par type: {}", typePartenaire);
        return partenaireRepository.findByType(typePartenaire);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getByStatut(String statut) {
        log.info("Récupération des partenaires par statut: {}", statut);
        return partenaireRepository.findByStatut(statut);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getByVille(String villeUuid) {
        log.info("Récupération des partenaires par ville: {}", villeUuid);
        return partenaireRepository.findByVille(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getByRegion(String regionUuid) {
        log.info("Récupération des partenaires par région: {}", regionUuid);
        return partenaireRepository.findByRegion(regionUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> search(String searchTerm) {
        log.info("Recherche des partenaires: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return partenaireRepository.findAllActifs();
        }
        return partenaireRepository.search(searchTerm.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getPartenariatsExpires() {
        log.info("Récupération des partenariats expirés");
        return partenaireRepository.findPartenariatsExpires();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Partenaire> getPartenariatsExpirantBientot() {
        log.info("Récupération des partenariats expirant bientôt");
        return partenaireRepository.findPartenariatsExpirantBientot();
    }

    // ========== ÉCRITURE ==========

    @Override
    public Partenaire create(PartenaireRequest request) {
        log.info("Création d'un partenaire: {}", request.getNom());

        // Vérifier l'unicité du nom
        if (partenaireRepository.existsByNom(request.getNom())) {
            throw new ApiException("Un partenaire existe déjà avec ce nom: " + request.getNom());
        }

        // Vérifier l'unicité de l'email si fourni
        if (request.getEmail() != null && !request.getEmail().isEmpty()
                && partenaireRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Un partenaire existe déjà avec cet email: " + request.getEmail());
        }

        // Vérifier et récupérer la localisation si fournie
        Long localisationId = null;
        if (request.getLocalisationUuid() != null && !request.getLocalisationUuid().isEmpty()) {
            Localisation localisation = localisationRepository.findByUuid(request.getLocalisationUuid())
                    .orElseThrow(() -> new ApiException("Localisation non trouvée: " + request.getLocalisationUuid()));
            localisationId = localisation.getLocalisationId();
        }

        // Validation des dates
        validateDates(request);

        Partenaire partenaire = Partenaire.builder()
                .localisationId(localisationId)
                .nom(request.getNom())
                .typePartenaire(request.getTypePartenaire())
                .raisonSociale(request.getRaisonSociale())
                .numeroRegistre(request.getNumeroRegistre())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .adresse(request.getAdresse())
                .logoUrl(request.getLogoUrl())
                .commissionPourcentage(request.getCommissionPourcentage() != null
                        ? request.getCommissionPourcentage() : BigDecimal.ZERO)
                .commissionFixe(request.getCommissionFixe() != null
                        ? request.getCommissionFixe() : BigDecimal.ZERO)
                .responsableNom(request.getResponsableNom())
                .responsableTelephone(request.getResponsableTelephone())
                .statut(request.getStatut() != null ? request.getStatut() : STATUT_ACTIF)
                .dateDebutPartenariat(request.getDateDebutPartenariat())
                .dateFinPartenariat(request.getDateFinPartenariat())
                .build();

        Partenaire saved = partenaireRepository.save(partenaire);
        log.info("Partenaire créé: {}", saved.getPartenaireUuid());

        return partenaireRepository.findByUuid(saved.getPartenaireUuid()).orElse(saved);
    }

    @Override
    public Partenaire update(String uuid, PartenaireRequest request) {
        log.info("Mise à jour du partenaire: {}", uuid);

        Partenaire existing = getByUuid(uuid);

        // Vérifier l'unicité du nom (hors lui-même)
        if (partenaireRepository.existsByNomExcludingUuid(request.getNom(), uuid)) {
            throw new ApiException("Un partenaire existe déjà avec ce nom: " + request.getNom());
        }

        // Vérifier l'unicité de l'email (hors lui-même)
        if (request.getEmail() != null && !request.getEmail().isEmpty()
                && partenaireRepository.existsByEmailExcludingUuid(request.getEmail(), uuid)) {
            throw new ApiException("Un partenaire existe déjà avec cet email: " + request.getEmail());
        }

        // Vérifier et récupérer la localisation si fournie
        Long localisationId = null;
        if (request.getLocalisationUuid() != null && !request.getLocalisationUuid().isEmpty()) {
            Localisation localisation = localisationRepository.findByUuid(request.getLocalisationUuid())
                    .orElseThrow(() -> new ApiException("Localisation non trouvée: " + request.getLocalisationUuid()));
            localisationId = localisation.getLocalisationId();
        }

        // Validation des dates
        validateDates(request);

        existing.setLocalisationId(localisationId);
        existing.setNom(request.getNom());
        existing.setTypePartenaire(request.getTypePartenaire());
        existing.setRaisonSociale(request.getRaisonSociale());
        existing.setNumeroRegistre(request.getNumeroRegistre());
        existing.setTelephone(request.getTelephone());
        existing.setEmail(request.getEmail());
        existing.setAdresse(request.getAdresse());
        existing.setLogoUrl(request.getLogoUrl());
        existing.setCommissionPourcentage(request.getCommissionPourcentage());
        existing.setCommissionFixe(request.getCommissionFixe());
        existing.setResponsableNom(request.getResponsableNom());
        existing.setResponsableTelephone(request.getResponsableTelephone());
        if (request.getStatut() != null) {
            existing.setStatut(request.getStatut());
        }
        existing.setDateDebutPartenariat(request.getDateDebutPartenariat());
        existing.setDateFinPartenariat(request.getDateFinPartenariat());

        Partenaire updated = partenaireRepository.update(existing);
        log.info("Partenaire mis à jour: {}", uuid);

        return partenaireRepository.findByUuid(uuid).orElse(updated);
    }

    @Override
    public Partenaire updateStatut(String uuid, String statut) {
        log.info("Mise à jour du statut du partenaire {} -> {}", uuid, statut);

        Partenaire partenaire = getByUuid(uuid);

        if (!isValidStatut(statut)) {
            throw new ApiException("Statut invalide: " + statut +
                    ". Valeurs acceptées: ACTIF, INACTIF, SUSPENDU, EN_ATTENTE");
        }

        // Vérifier si des offres sont en cours avant de désactiver/suspendre
        if ((STATUT_INACTIF.equals(statut) || STATUT_SUSPENDU.equals(statut))
                && partenaireRepository.hasOffres(uuid)) {
            throw new ApiException("Impossible de changer le statut: des offres sont associées à ce partenaire");
        }

        partenaireRepository.updateStatut(uuid, statut);
        return partenaireRepository.findByUuid(uuid).orElse(partenaire);
    }

    @Override
    public Partenaire updateCommissions(String uuid, BigDecimal commissionPourcentage, BigDecimal commissionFixe) {
        log.info("Mise à jour des commissions du partenaire: {}", uuid);

        Partenaire partenaire = getByUuid(uuid);

        // Validation des commissions
        if (commissionPourcentage != null && commissionPourcentage.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("La commission en pourcentage ne peut pas être négative");
        }
        if (commissionPourcentage != null && commissionPourcentage.compareTo(new BigDecimal("100")) > 0) {
            throw new ApiException("La commission en pourcentage ne peut pas dépasser 100%");
        }
        if (commissionFixe != null && commissionFixe.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("La commission fixe ne peut pas être négative");
        }

        partenaireRepository.updateCommissions(uuid,
                commissionPourcentage != null ? commissionPourcentage : BigDecimal.ZERO,
                commissionFixe != null ? commissionFixe : BigDecimal.ZERO);

        return partenaireRepository.findByUuid(uuid).orElse(partenaire);
    }

    @Override
    public Partenaire activer(String uuid) {
        log.info("Activation du partenaire: {}", uuid);
        Partenaire partenaire = getByUuid(uuid);

        if (STATUT_ACTIF.equals(partenaire.getStatut())) {
            throw new ApiException("Le partenaire est déjà actif");
        }

        return updateStatut(uuid, STATUT_ACTIF);
    }

    @Override
    public Partenaire desactiver(String uuid) {
        log.info("Désactivation du partenaire: {}", uuid);
        return updateStatut(uuid, STATUT_INACTIF);
    }

    @Override
    public Partenaire suspendre(String uuid) {
        log.info("Suspension du partenaire: {}", uuid);
        return updateStatut(uuid, STATUT_SUSPENDU);
    }

    @Override
    public Partenaire mettreEnAttente(String uuid) {
        log.info("Mise en attente du partenaire: {}", uuid);
        return updateStatut(uuid, STATUT_EN_ATTENTE);
    }

    @Override
    public void delete(String uuid) {
        log.info("Suppression du partenaire: {}", uuid);

        Partenaire partenaire = getByUuid(uuid);

        // Vérifier s'il y a des offres associées
        if (partenaireRepository.hasOffres(uuid)) {
            throw new ApiException("Impossible de supprimer: des offres sont associées à ce partenaire");
        }

        int deleted = partenaireRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du partenaire");
        }

        log.info("Partenaire supprimé: {}", uuid);
    }

    // ========== STATISTIQUES ==========

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return partenaireRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatut(String statut) {
        return partenaireRepository.countByStatut(statut);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByType(String typePartenaire) {
        return partenaireRepository.countByType(typePartenaire);
    }

    // ========== CALCUL ==========

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculerCommission(String uuid, BigDecimal montant) {
        log.info("Calcul de la commission pour le partenaire {} et montant {}", uuid, montant);

        Partenaire partenaire = getByUuid(uuid);

        if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Le montant doit être positif");
        }

        BigDecimal commissionPourcentage = partenaire.getCommissionPourcentage() != null
                ? partenaire.getCommissionPourcentage() : BigDecimal.ZERO;
        BigDecimal commissionFixe = partenaire.getCommissionFixe() != null
                ? partenaire.getCommissionFixe() : BigDecimal.ZERO;

        // Calcul: (montant * commissionPourcentage / 100) + commissionFixe
        BigDecimal commissionCalculee = montant
                .multiply(commissionPourcentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                .add(commissionFixe);

        log.debug("Commission calculée: {} ({}% + {} fixe)", commissionCalculee, commissionPourcentage, commissionFixe);
        return commissionCalculee;
    }

    // ========== MÉTHODES PRIVÉES ==========

    private boolean isValidStatut(String statut) {
        return STATUT_ACTIF.equals(statut)
                || STATUT_INACTIF.equals(statut)
                || STATUT_SUSPENDU.equals(statut)
                || STATUT_EN_ATTENTE.equals(statut);
    }

    private void validateDates(PartenaireRequest request) {
        if (request.getDateDebutPartenariat() != null && request.getDateFinPartenariat() != null) {
            if (request.getDateFinPartenariat().isBefore(request.getDateDebutPartenariat())) {
                throw new ApiException("La date de fin de partenariat ne peut pas être antérieure à la date de début");
            }
        }
    }
}