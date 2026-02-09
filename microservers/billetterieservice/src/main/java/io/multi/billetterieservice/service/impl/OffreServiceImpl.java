package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Offre;
import io.multi.billetterieservice.domain.Trajet;
import io.multi.billetterieservice.domain.Vehicule;
import io.multi.billetterieservice.dto.OffreRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.OffreRepository;
import io.multi.billetterieservice.repository.TrajetRepository;
import io.multi.billetterieservice.repository.VehiculeRepository;
import io.multi.billetterieservice.service.OffreService;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implémentation du service pour la gestion des offres de transport.
 * Utilise UserClient (Feign) pour communiquer avec userservice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OffreServiceImpl implements OffreService {

    private final OffreRepository offreRepository;
    private final TrajetRepository trajetRepository;
    private final VehiculeRepository vehiculeRepository;
    private final UserClient userClient;

    // Constantes pour les statuts
    private static final String STATUT_EN_ATTENTE = "EN_ATTENTE";
    private static final String STATUT_OUVERT = "OUVERT";
    private static final String STATUT_FERME = "FERME";
    private static final String STATUT_CLOTURE = "CLOTURE";
    private static final String STATUT_ANNULE = "ANNULE";
    private static final String STATUT_EN_COURS = "EN_COURS";
    private static final String STATUT_TERMINE = "TERMINE";
    private static final String STATUT_SUSPENDU = "SUSPENDU";

    // ========== LECTURE ==========

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getAll() {
        log.info("Récupération de toutes les offres");
        return offreRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getAllOuvertes() {
        log.info("Récupération de toutes les offres ouvertes");
        return offreRepository.findAllOuvertes();
    }

    @Override
    @Transactional(readOnly = true)
    public Offre getByUuid(String uuid) {
        log.info("Récupération de l'offre: {}", uuid);
        return offreRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Offre non trouvée: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public Offre getByToken(String token) {
        log.info("Récupération de l'offre par token: {}", token);
        return offreRepository.findByToken(token)
                .orElseThrow(() -> new ApiException("Offre non trouvée avec le token: " + token));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByTrajet(String trajetUuid) {
        log.info("Récupération des offres par trajet: {}", trajetUuid);
        return offreRepository.findByTrajet(trajetUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByVehicule(String vehiculeUuid) {
        log.info("Récupération des offres par véhicule: {}", vehiculeUuid);
        return offreRepository.findByVehicule(vehiculeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getMesOffres(Long userId) {
        log.info("Récupération de mes offres: {}", userId);
        return offreRepository.findByUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByStatut(String statut) {
        log.info("Récupération des offres par statut: {}", statut);
        return offreRepository.findByStatut(statut);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByDateDepart(LocalDate dateDepart) {
        log.info("Récupération des offres par date de départ: {}", dateDepart);
        return offreRepository.findByDateDepart(dateDepart);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByVilles(String villeDepartUuid, String villeArriveeUuid) {
        log.info("Récupération des offres entre {} et {}", villeDepartUuid, villeArriveeUuid);
        return offreRepository.findByVilles(villeDepartUuid, villeArriveeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByVillesAndDate(String villeDepartUuid, String villeArriveeUuid, LocalDate dateDepart) {
        log.info("Récupération des offres entre {} et {} le {}", villeDepartUuid, villeArriveeUuid, dateDepart);
        return offreRepository.findByVillesAndDate(villeDepartUuid, villeArriveeUuid, dateDepart);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getAvecPlacesDisponibles(int nombrePlaces) {
        log.info("Récupération des offres avec au moins {} places disponibles", nombrePlaces);
        return offreRepository.findAvecPlacesDisponibles(nombrePlaces);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByVilleDepart(String villeDepartUuid) {
        log.info("Récupération des offres au départ de: {}", villeDepartUuid);
        return offreRepository.findByVilleDepart(villeDepartUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getByVilleArrivee(String villeArriveeUuid) {
        log.info("Récupération des offres à destination de: {}", villeArriveeUuid);
        return offreRepository.findByVilleArrivee(villeArriveeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getAujourdHui() {
        log.info("Récupération des offres d'aujourd'hui");
        return offreRepository.findAujourdHui();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getAVenir() {
        log.info("Récupération des offres à venir");
        return offreRepository.findAVenir();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getPassees() {
        log.info("Récupération des offres passées");
        return offreRepository.findPassees();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> getEnPromotion() {
        log.info("Récupération des offres en promotion");
        return offreRepository.findEnPromotion();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Offre> search(String searchTerm) {
        log.info("Recherche des offres: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return offreRepository.findAllOuvertes();
        }
        return offreRepository.search(searchTerm.trim());
    }

    // ========== ÉCRITURE ==========

    @Override
    public Offre create(OffreRequest request, Long userId) {
        log.info("Création d'une offre par userId: {}", userId);

        // Vérifier que l'utilisateur existe via Feign
        User user = getUserById(userId);
        log.debug("Utilisateur trouvé: {} (ID: {})", user.getUsername(), user.getUserId());

        // Vérifier et récupérer le trajet
        Trajet trajet = trajetRepository.findByUuid(request.getTrajetUuid())
                .orElseThrow(() -> new ApiException("Trajet non trouvé: " + request.getTrajetUuid()));

        if (!Boolean.TRUE.equals(trajet.getActif())) {
            throw new ApiException("Le trajet n'est pas actif");
        }

        // Vérifier et récupérer le véhicule
        Vehicule vehicule = vehiculeRepository.findByUuid(request.getVehiculeUuid())
                .orElseThrow(() -> new ApiException("Véhicule non trouvé: " + request.getVehiculeUuid()));

        if (!"ACTIF".equals(vehicule.getStatut())) {
            throw new ApiException("Le véhicule n'est pas actif");
        }

        // Vérifier que le véhicule appartient à l'utilisateur
        if (!vehicule.getUserId().equals(user.getUserId())) {
            throw new ApiException("Ce véhicule ne vous appartient pas");
        }

        // Vérifier qu'il n'y a pas déjà une offre active pour ce véhicule à cette date
        if (offreRepository.existsOffreActiveVehiculeDate(request.getVehiculeUuid(), request.getDateDepart())) {
            throw new ApiException("Une offre existe déjà pour ce véhicule à cette date");
        }

        // Vérifier que le nombre de places ne dépasse pas la capacité du véhicule
        if (request.getNombrePlacesTotal() > vehicule.getNombrePlaces()) {
            throw new ApiException("Le nombre de places (" + request.getNombrePlacesTotal() +
                    ") dépasse la capacité du véhicule (" + vehicule.getNombrePlaces() + ")");
        }

        // Validation de la promotion
        if (request.getMontantPromotion() != null && request.getMontantPromotion().compareTo(BigDecimal.ZERO) > 0) {
            if (request.getMontantPromotion().compareTo(request.getMontant()) >= 0) {
                throw new ApiException("Le montant de promotion doit être inférieur au montant normal");
            }
        }

        // Générer un token unique
        String token = generateToken();

        Offre offre = Offre.builder()
                .tokenOffre(token)
                .trajetId(trajet.getTrajetId())
                .vehiculeId(vehicule.getVehiculeId())
                .userId(user.getUserId())
                .dateDepart(request.getDateDepart())
                .heureDepart(request.getHeureDepart())
                .heureArriveeEstimee(request.getHeureArriveeEstimee())
                .nombrePlacesTotal(request.getNombrePlacesTotal())
                .nombrePlacesDisponibles(request.getNombrePlacesTotal())
                .nombrePlacesReservees(0)
                .montant(request.getMontant())
                .montantPromotion(request.getMontantPromotion())
                .devise(request.getDevise() != null ? request.getDevise() : "GNF")
                .statut(STATUT_EN_ATTENTE)
                .niveauRemplissage(0)
                .pointRendezvous(request.getPointRendezvous())
                .conditions(request.getConditions())
                .annulationAutorisee(request.getAnnulationAutorisee() != null ? request.getAnnulationAutorisee() : true)
                .delaiAnnulationHeures(request.getDelaiAnnulationHeures() != null ? request.getDelaiAnnulationHeures() : 24)
                .build();

        Offre saved = offreRepository.save(offre);
        log.info("Offre créée: {} (token: {})", saved.getOffreUuid(), token);

        return offreRepository.findByUuid(saved.getOffreUuid()).orElse(saved);
    }

    @Override
    public Offre update(String uuid, OffreRequest request) {
        log.info("Mise à jour de l'offre: {}", uuid);

        Offre existing = getByUuid(uuid);

        // Vérifier que l'offre peut être modifiée
        if (!canModify(existing)) {
            throw new ApiException("Cette offre ne peut plus être modifiée (statut: " + existing.getStatut() + ")");
        }

        // Si la date change, vérifier le conflit
        if (!existing.getDateDepart().equals(request.getDateDepart())) {
            if (offreRepository.existsOffreActiveVehiculeDateExcluding(
                    existing.getVehiculeUuid(), request.getDateDepart(), uuid)) {
                throw new ApiException("Une offre existe déjà pour ce véhicule à cette date");
            }
        }

        // Validation de la promotion
        if (request.getMontantPromotion() != null && request.getMontantPromotion().compareTo(BigDecimal.ZERO) > 0) {
            if (request.getMontantPromotion().compareTo(request.getMontant()) >= 0) {
                throw new ApiException("Le montant de promotion doit être inférieur au montant normal");
            }
        }

        // Recalculer les places disponibles si le total change
        int newDisponibles = existing.getNombrePlacesDisponibles();
        if (!existing.getNombrePlacesTotal().equals(request.getNombrePlacesTotal())) {
            int difference = request.getNombrePlacesTotal() - existing.getNombrePlacesTotal();
            newDisponibles = existing.getNombrePlacesDisponibles() + difference;
            if (newDisponibles < 0) {
                throw new ApiException("Impossible de réduire le nombre de places en dessous des places déjà réservées");
            }
        }

        existing.setDateDepart(request.getDateDepart());
        existing.setHeureDepart(request.getHeureDepart());
        existing.setHeureArriveeEstimee(request.getHeureArriveeEstimee());
        existing.setNombrePlacesTotal(request.getNombrePlacesTotal());
        existing.setNombrePlacesDisponibles(newDisponibles);
        existing.setMontant(request.getMontant());
        existing.setMontantPromotion(request.getMontantPromotion());
        existing.setDevise(request.getDevise());
        existing.setPointRendezvous(request.getPointRendezvous());
        existing.setConditions(request.getConditions());
        existing.setAnnulationAutorisee(request.getAnnulationAutorisee());
        existing.setDelaiAnnulationHeures(request.getDelaiAnnulationHeures());

        // Recalculer le niveau de remplissage
        int niveauRemplissage = calculateNiveauRemplissage(existing.getNombrePlacesReservees(), request.getNombrePlacesTotal());
        offreRepository.updatePlaces(uuid, newDisponibles, existing.getNombrePlacesReservees(), niveauRemplissage);

        Offre updated = offreRepository.update(existing);
        log.info("Offre mise à jour: {}", uuid);

        return offreRepository.findByUuid(uuid).orElse(updated);
    }

    // ========== GESTION DES STATUTS ==========

    @Override
    public Offre ouvrir(String uuid) {
        log.info("Ouverture de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (!STATUT_EN_ATTENTE.equals(offre.getStatut()) && !STATUT_FERME.equals(offre.getStatut())) {
            throw new ApiException("Impossible d'ouvrir l'offre (statut actuel: " + offre.getStatut() + ")");
        }

        offreRepository.updateStatut(uuid, STATUT_OUVERT);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre fermer(String uuid) {
        log.info("Fermeture de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (!STATUT_OUVERT.equals(offre.getStatut())) {
            throw new ApiException("Impossible de fermer l'offre (statut actuel: " + offre.getStatut() + ")");
        }

        offreRepository.updateStatut(uuid, STATUT_FERME);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre cloturer(String uuid) {
        log.info("Clôture de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (STATUT_CLOTURE.equals(offre.getStatut()) || STATUT_ANNULE.equals(offre.getStatut())) {
            throw new ApiException("L'offre est déjà clôturée ou annulée");
        }

        offreRepository.cloturer(uuid);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre annuler(String uuid) {
        log.info("Annulation de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (STATUT_EN_COURS.equals(offre.getStatut())) {
            throw new ApiException("Impossible d'annuler une offre en cours");
        }

        if (STATUT_TERMINE.equals(offre.getStatut())) {
            throw new ApiException("Impossible d'annuler une offre terminée");
        }

        // Vérifier s'il y a des réservations confirmées
        if (offreRepository.hasReservations(uuid)) {
            throw new ApiException("Impossible d'annuler: des réservations sont confirmées. Veuillez d'abord les annuler.");
        }

        offreRepository.updateStatut(uuid, STATUT_ANNULE);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre demarrer(String uuid) {
        log.info("Démarrage de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (!STATUT_OUVERT.equals(offre.getStatut()) && !STATUT_FERME.equals(offre.getStatut())) {
            throw new ApiException("Impossible de démarrer l'offre (statut actuel: " + offre.getStatut() + ")");
        }

        offreRepository.updateStatut(uuid, STATUT_EN_COURS);
        enregistrerDepartEffectif(uuid);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre terminer(String uuid) {
        log.info("Terminaison de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (!STATUT_EN_COURS.equals(offre.getStatut())) {
            throw new ApiException("L'offre doit être en cours pour être terminée");
        }

        offreRepository.updateStatut(uuid, STATUT_TERMINE);
        enregistrerArriveeEffective(uuid);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre suspendre(String uuid) {
        log.info("Suspension de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (!STATUT_OUVERT.equals(offre.getStatut())) {
            throw new ApiException("Seule une offre ouverte peut être suspendue");
        }

        offreRepository.updateStatut(uuid, STATUT_SUSPENDU);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre reprendre(String uuid) {
        log.info("Reprise de l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        if (!STATUT_SUSPENDU.equals(offre.getStatut())) {
            throw new ApiException("Seule une offre suspendue peut être reprise");
        }

        offreRepository.updateStatut(uuid, STATUT_OUVERT);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    // ========== GESTION DES PLACES ==========

    @Override
    public Offre reserverPlaces(String uuid, int nombrePlaces) {
        log.info("Réservation de {} places pour l'offre: {}", nombrePlaces, uuid);
        Offre offre = getByUuid(uuid);

        if (nombrePlaces <= 0) {
            throw new ApiException("Le nombre de places doit être positif");
        }

        if (offre.getNombrePlacesDisponibles() < nombrePlaces) {
            throw new ApiException("Pas assez de places disponibles. Disponibles: " + offre.getNombrePlacesDisponibles());
        }

        int newDisponibles = offre.getNombrePlacesDisponibles() - nombrePlaces;
        int newReservees = offre.getNombrePlacesReservees() + nombrePlaces;
        int niveauRemplissage = calculateNiveauRemplissage(newReservees, offre.getNombrePlacesTotal());

        offreRepository.updatePlaces(uuid, newDisponibles, newReservees, niveauRemplissage);

        // Si plus de places disponibles, fermer automatiquement
        if (newDisponibles == 0) {
            offreRepository.updateStatut(uuid, STATUT_FERME);
        }

        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre libererPlaces(String uuid, int nombrePlaces) {
        log.info("Libération de {} places pour l'offre: {}", nombrePlaces, uuid);
        Offre offre = getByUuid(uuid);

        if (nombrePlaces <= 0) {
            throw new ApiException("Le nombre de places doit être positif");
        }

        if (offre.getNombrePlacesReservees() < nombrePlaces) {
            throw new ApiException("Impossible de libérer plus de places que réservées");
        }

        int newDisponibles = offre.getNombrePlacesDisponibles() + nombrePlaces;
        int newReservees = offre.getNombrePlacesReservees() - nombrePlaces;
        int niveauRemplissage = calculateNiveauRemplissage(newReservees, offre.getNombrePlacesTotal());

        offreRepository.updatePlaces(uuid, newDisponibles, newReservees, niveauRemplissage);

        // Si l'offre était fermée (complet) et qu'on libère des places, la rouvrir
        if (STATUT_FERME.equals(offre.getStatut()) && newDisponibles > 0) {
            offreRepository.updateStatut(uuid, STATUT_OUVERT);
        }

        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    // ========== GESTION DES PROMOTIONS ==========

    @Override
    public Offre appliquerPromotion(String uuid, BigDecimal montantPromotion) {
        log.info("Application d'une promotion sur l'offre: {} -> {}", uuid, montantPromotion);
        Offre offre = getByUuid(uuid);

        if (montantPromotion == null || montantPromotion.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Le montant de promotion doit être positif");
        }

        if (montantPromotion.compareTo(offre.getMontant()) >= 0) {
            throw new ApiException("Le montant de promotion doit être inférieur au montant normal");
        }

        offreRepository.updatePromotion(uuid, montantPromotion);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre supprimerPromotion(String uuid) {
        log.info("Suppression de la promotion sur l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        offreRepository.updatePromotion(uuid, null);
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    // ========== GESTION DES DATES EFFECTIVES ==========

    @Override
    public Offre enregistrerDepartEffectif(String uuid) {
        log.info("Enregistrement du départ effectif pour l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        offreRepository.updateDatesEffectives(uuid, OffsetDateTime.now(), offre.getDateArriveeEffective());
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    @Override
    public Offre enregistrerArriveeEffective(String uuid) {
        log.info("Enregistrement de l'arrivée effective pour l'offre: {}", uuid);
        Offre offre = getByUuid(uuid);

        offreRepository.updateDatesEffectives(uuid, offre.getDateDepartEffectif(), OffsetDateTime.now());
        return offreRepository.findByUuid(uuid).orElse(offre);
    }

    // ========== SUPPRESSION ==========

    @Override
    public void delete(String uuid) {
        log.info("Suppression de l'offre: {}", uuid);

        Offre offre = getByUuid(uuid);

        if (offreRepository.hasReservations(uuid)) {
            throw new ApiException("Impossible de supprimer: des réservations sont associées à cette offre");
        }

        if (STATUT_EN_COURS.equals(offre.getStatut())) {
            throw new ApiException("Impossible de supprimer une offre en cours");
        }

        int deleted = offreRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression de l'offre");
        }

        log.info("Offre supprimée: {}", uuid);
    }

    // ========== STATISTIQUES ==========

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return offreRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatut(String statut) {
        return offreRepository.countByStatut(statut);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByUser(Long userId) {
        return offreRepository.countByUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAujourdHui() {
        return offreRepository.countAujourdHui();
    }

    @Override
    @Transactional(readOnly = true)
    public long countOuvertes() {
        return offreRepository.countOuvertes();
    }

    // ========== MÉTHODES PRIVÉES ==========

    private User getUserById(Long userId) {
        try {
            User user = userClient.getUserById(userId);
            if (user == null) {
                throw new ApiException("Utilisateur non trouvé avec l'ID: " + userId);
            }
            return user;
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'utilisateur {}: {}", userId, e.getMessage());
            throw new ApiException("Impossible de récupérer l'utilisateur: " + e.getMessage());
        }
    }

    private String generateToken() {
        String token;
        do {
            token = "OFF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (offreRepository.existsByToken(token));
        return token;
    }

    private boolean canModify(Offre offre) {
        return STATUT_EN_ATTENTE.equals(offre.getStatut())
                || STATUT_OUVERT.equals(offre.getStatut())
                || STATUT_FERME.equals(offre.getStatut());
    }

    private int calculateNiveauRemplissage(int placesReservees, int placesTotal) {
        if (placesTotal == 0) return 0;
        return (int) Math.round((double) placesReservees / placesTotal * 100);
    }
}