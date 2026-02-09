package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.TypeVehicule;
import io.multi.billetterieservice.domain.Vehicule;
import io.multi.billetterieservice.dto.VehiculeRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.TypeVehiculeRepository;
import io.multi.billetterieservice.repository.VehiculeRepository;
import io.multi.billetterieservice.service.VehiculeService;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service pour la gestion des véhicules.
 * Utilise UserClient (Feign) pour communiquer avec userservice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VehiculeServiceImpl implements VehiculeService {

    private final VehiculeRepository vehiculeRepository;
    private final TypeVehiculeRepository typeVehiculeRepository;
    private final UserClient userClient;

    // Constantes pour les statuts
    private static final String STATUT_ACTIF = "ACTIF";
    private static final String STATUT_INACTIF = "INACTIF";
    private static final String STATUT_EN_MAINTENANCE = "EN_MAINTENANCE";
    private static final String STATUT_SUSPENDU = "SUSPENDU";

    // ========== LECTURE ==========

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getAll() {
        log.info("Récupération de tous les véhicules");
        return vehiculeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getAllActifs() {
        log.info("Récupération de tous les véhicules actifs");
        return vehiculeRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public Vehicule getByUuid(String uuid) {
        log.info("Récupération du véhicule: {}", uuid);
        return vehiculeRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Véhicule non trouvé: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public Vehicule getByImmatriculation(String immatriculation) {
        log.info("Récupération du véhicule par immatriculation: {}", immatriculation);
        return vehiculeRepository.findByImmatriculation(immatriculation)
                .orElseThrow(() -> new ApiException("Véhicule non trouvé: " + immatriculation));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getByUser(Long userId) {
        log.info("Récupération des véhicules de l'utilisateur: {}", userId);
        return vehiculeRepository.findByUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getMesVehicules(Long userId) {
        log.info("Récupération de mes véhicules: {}", userId);
        return vehiculeRepository.findByUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getByTypeVehicule(String typeVehiculeUuid) {
        log.info("Récupération des véhicules par type: {}", typeVehiculeUuid);
        return vehiculeRepository.findByTypeVehicule(typeVehiculeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getByStatut(String statut) {
        log.info("Récupération des véhicules par statut: {}", statut);
        return vehiculeRepository.findByStatut(statut);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getByNombrePlacesMin(int nombrePlacesMin) {
        log.info("Récupération des véhicules avec au moins {} places", nombrePlacesMin);
        return vehiculeRepository.findByNombrePlacesMin(nombrePlacesMin);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getClimatises() {
        log.info("Récupération des véhicules climatisés");
        return vehiculeRepository.findClimatises();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getAssuranceExpiree() {
        log.info("Récupération des véhicules avec assurance expirée");
        return vehiculeRepository.findAssuranceExpiree();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> getVisiteExpiree() {
        log.info("Récupération des véhicules avec visite technique expirée");
        return vehiculeRepository.findVisiteExpiree();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicule> search(String searchTerm) {
        log.info("Recherche des véhicules: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return vehiculeRepository.findAllActifs();
        }
        return vehiculeRepository.search(searchTerm.trim());
    }

    // ========== ÉCRITURE ==========

    @Override
    public Vehicule create(VehiculeRequest request, Long userId) {
        log.info("Création d'un véhicule: {} par userId: {}", request.getImmatriculation(), userId);

        // Vérifier que l'utilisateur existe via Feign
        User user = getUserById(userId);
        log.debug("Utilisateur trouvé: {} (ID: {})", user.getUsername(), user.getUserId());

        // Vérifier l'unicité de l'immatriculation
        if (vehiculeRepository.existsByImmatriculation(request.getImmatriculation())) {
            throw new ApiException("Un véhicule existe déjà avec cette immatriculation: " + request.getImmatriculation());
        }

        // Vérifier et récupérer le type de véhicule si fourni
        Long typeVehiculeId = null;
        if (request.getTypeVehiculeUuid() != null && !request.getTypeVehiculeUuid().isEmpty()) {
            TypeVehicule typeVehicule = typeVehiculeRepository.findByUuid(request.getTypeVehiculeUuid())
                    .orElseThrow(() -> new ApiException("Type de véhicule non trouvé: " + request.getTypeVehiculeUuid()));

            if (!Boolean.TRUE.equals(typeVehicule.getActif())) {
                throw new ApiException("Le type de véhicule n'est pas actif");
            }
            typeVehiculeId = typeVehicule.getTypeVehiculeId();
        }

        Vehicule vehicule = Vehicule.builder()
                .userId(user.getUserId())
                .typeVehiculeId(typeVehiculeId)
                .immatriculation(request.getImmatriculation().toUpperCase())
                .marque(request.getMarque())
                .modele(request.getModele())
                .anneeFabrication(request.getAnneeFabrication())
                .nombrePlaces(request.getNombrePlaces())
                .nomChauffeur(request.getNomChauffeur())
                .contactChauffeur(request.getContactChauffeur())
                .contactProprietaire(request.getContactProprietaire())
                .description(request.getDescription())
                .couleur(request.getCouleur())
                .climatise(request.getClimatise() != null ? request.getClimatise() : false)
                .imageUrl(request.getImageUrl())
                .documentAssuranceUrl(request.getDocumentAssuranceUrl())
                .dateExpirationAssurance(request.getDateExpirationAssurance())
                .documentVisiteTechniqueUrl(request.getDocumentVisiteTechniqueUrl())
                .dateExpirationVisite(request.getDateExpirationVisite())
                .statut(request.getStatut() != null ? request.getStatut() : STATUT_ACTIF)
                .build();

        Vehicule saved = vehiculeRepository.save(vehicule);
        log.info("Véhicule créé: {}", saved.getVehiculeUuid());

        return vehiculeRepository.findByUuid(saved.getVehiculeUuid()).orElse(saved);
    }

    @Override
    public Vehicule update(String uuid, VehiculeRequest request) {
        log.info("Mise à jour du véhicule: {}", uuid);

        Vehicule existing = getByUuid(uuid);

        // Vérifier l'unicité de l'immatriculation (hors lui-même)
        if (vehiculeRepository.existsByImmatriculationExcludingUuid(request.getImmatriculation(), uuid)) {
            throw new ApiException("Un véhicule existe déjà avec cette immatriculation: " + request.getImmatriculation());
        }

        // Vérifier et récupérer le type de véhicule si fourni
        Long typeVehiculeId = null;
        if (request.getTypeVehiculeUuid() != null && !request.getTypeVehiculeUuid().isEmpty()) {
            TypeVehicule typeVehicule = typeVehiculeRepository.findByUuid(request.getTypeVehiculeUuid())
                    .orElseThrow(() -> new ApiException("Type de véhicule non trouvé: " + request.getTypeVehiculeUuid()));
            typeVehiculeId = typeVehicule.getTypeVehiculeId();
        }

        existing.setTypeVehiculeId(typeVehiculeId);
        existing.setImmatriculation(request.getImmatriculation().toUpperCase());
        existing.setMarque(request.getMarque());
        existing.setModele(request.getModele());
        existing.setAnneeFabrication(request.getAnneeFabrication());
        existing.setNombrePlaces(request.getNombrePlaces());
        existing.setNomChauffeur(request.getNomChauffeur());
        existing.setContactChauffeur(request.getContactChauffeur());
        existing.setContactProprietaire(request.getContactProprietaire());
        existing.setDescription(request.getDescription());
        existing.setCouleur(request.getCouleur());
        existing.setClimatise(request.getClimatise());
        existing.setImageUrl(request.getImageUrl());
        existing.setDocumentAssuranceUrl(request.getDocumentAssuranceUrl());
        existing.setDateExpirationAssurance(request.getDateExpirationAssurance());
        existing.setDocumentVisiteTechniqueUrl(request.getDocumentVisiteTechniqueUrl());
        existing.setDateExpirationVisite(request.getDateExpirationVisite());
        if (request.getStatut() != null) {
            existing.setStatut(request.getStatut());
        }

        Vehicule updated = vehiculeRepository.update(existing);
        log.info("Véhicule mis à jour: {}", uuid);

        return vehiculeRepository.findByUuid(uuid).orElse(updated);
    }

    @Override
    public Vehicule updateStatut(String uuid, String statut) {
        log.info("Mise à jour du statut du véhicule {} -> {}", uuid, statut);

        Vehicule vehicule = getByUuid(uuid);

        // Valider le statut
        if (!isValidStatut(statut)) {
            throw new ApiException("Statut invalide: " + statut + ". Valeurs acceptées: ACTIF, INACTIF, EN_MAINTENANCE, SUSPENDU");
        }

        // Vérifier si des offres sont en cours avant de désactiver/suspendre
        if ((STATUT_INACTIF.equals(statut) || STATUT_SUSPENDU.equals(statut))
                && vehiculeRepository.hasOffres(uuid)) {
            throw new ApiException("Impossible de changer le statut: des offres sont associées à ce véhicule");
        }

        vehiculeRepository.updateStatut(uuid, statut);
        return vehiculeRepository.findByUuid(uuid).orElse(vehicule);
    }

    @Override
    public Vehicule activer(String uuid) {
        log.info("Activation du véhicule: {}", uuid);
        Vehicule vehicule = getByUuid(uuid);

        if (STATUT_ACTIF.equals(vehicule.getStatut())) {
            throw new ApiException("Le véhicule est déjà actif");
        }

        return updateStatut(uuid, STATUT_ACTIF);
    }

    @Override
    public Vehicule desactiver(String uuid) {
        log.info("Désactivation du véhicule: {}", uuid);
        return updateStatut(uuid, STATUT_INACTIF);
    }

    @Override
    public Vehicule mettreEnMaintenance(String uuid) {
        log.info("Mise en maintenance du véhicule: {}", uuid);
        return updateStatut(uuid, STATUT_EN_MAINTENANCE);
    }

    @Override
    public Vehicule suspendre(String uuid) {
        log.info("Suspension du véhicule: {}", uuid);
        return updateStatut(uuid, STATUT_SUSPENDU);
    }

    @Override
    public void delete(String uuid) {
        log.info("Suppression du véhicule: {}", uuid);

        Vehicule vehicule = getByUuid(uuid);

        // Vérifier s'il y a des offres associées
        if (vehiculeRepository.hasOffres(uuid)) {
            throw new ApiException("Impossible de supprimer: des offres sont associées à ce véhicule");
        }

        int deleted = vehiculeRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du véhicule");
        }

        log.info("Véhicule supprimé: {}", uuid);
    }

    // ========== STATISTIQUES ==========

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return vehiculeRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatut(String statut) {
        return vehiculeRepository.countByStatut(statut);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByUser(Long userId) {
        return vehiculeRepository.countByUser(userId);
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

    private boolean isValidStatut(String statut) {
        return STATUT_ACTIF.equals(statut)
                || STATUT_INACTIF.equals(statut)
                || STATUT_EN_MAINTENANCE.equals(statut)
                || STATUT_SUSPENDU.equals(statut);
    }
}