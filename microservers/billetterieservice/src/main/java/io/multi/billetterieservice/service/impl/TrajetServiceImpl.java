package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Arrivee;
import io.multi.billetterieservice.domain.Depart;
import io.multi.billetterieservice.domain.Trajet;
import io.multi.billetterieservice.dto.TrajetRequest;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.ArriveeRepository;
import io.multi.billetterieservice.repository.DepartRepository;
import io.multi.billetterieservice.repository.TrajetRepository;
import io.multi.billetterieservice.service.TrajetService;
import io.multi.clients.UserClient;
import io.multi.clients.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Implémentation du service pour la gestion des trajets.
 * Utilise UserClient (Feign) pour communiquer avec userservice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TrajetServiceImpl implements TrajetService {

    private final TrajetRepository trajetRepository;
    private final DepartRepository departRepository;
    private final ArriveeRepository arriveeRepository;
    private final UserClient userClient;

    // ========== LECTURE ==========

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getAll() {
        log.info("Récupération de tous les trajets");
        return trajetRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getAllActifs() {
        log.info("Récupération de tous les trajets actifs");
        return trajetRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public Trajet getByUuid(String uuid) {
        log.info("Récupération du trajet: {}", uuid);
        return trajetRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Trajet non trouvé avec l'UUID: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getByDepart(String departUuid) {
        log.info("Récupération des trajets pour le départ: {}", departUuid);
        departRepository.findByUuid(departUuid)
                .orElseThrow(() -> new ApiException("Point de départ non trouvé: " + departUuid));
        return trajetRepository.findByDepartUuid(departUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getByArrivee(String arriveeUuid) {
        log.info("Récupération des trajets pour l'arrivée: {}", arriveeUuid);
        arriveeRepository.findByUuid(arriveeUuid)
                .orElseThrow(() -> new ApiException("Point d'arrivée non trouvé: " + arriveeUuid));
        return trajetRepository.findByArriveeUuid(arriveeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public Trajet getByDepartAndArrivee(String departUuid, String arriveeUuid) {
        log.info("Récupération du trajet départ={} -> arrivée={}", departUuid, arriveeUuid);
        return trajetRepository.findByDepartAndArrivee(departUuid, arriveeUuid)
                .orElseThrow(() -> new ApiException("Trajet non trouvé pour cette combinaison départ/arrivée"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getByVilleDepart(String villeUuid) {
        log.info("Récupération des trajets partant de la ville: {}", villeUuid);
        return trajetRepository.findByVilleDepart(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getByVilleArrivee(String villeUuid) {
        log.info("Récupération des trajets arrivant dans la ville: {}", villeUuid);
        return trajetRepository.findByVilleArrivee(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getByVilles(String villeDepartUuid, String villeArriveeUuid) {
        log.info("Récupération des trajets entre {} et {}", villeDepartUuid, villeArriveeUuid);
        return trajetRepository.findByVilles(villeDepartUuid, villeArriveeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> getByUser(Long userId) {
        log.info("Récupération des trajets créés par l'utilisateur: {}", userId);
        return trajetRepository.findByUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trajet> search(String searchTerm) {
        log.info("Recherche des trajets avec le terme: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return trajetRepository.findAllActifs();
        }
        return trajetRepository.searchByLibelle(searchTerm.trim());
    }

    // ========== ÉCRITURE ==========

    @Override
    public Trajet create(TrajetRequest request, Long userId) {
        log.info("Création d'un nouveau trajet: {} -> {} par userId: {}",
                request.getDepartUuid(), request.getArriveeUuid(), userId);

        // Vérifier que l'utilisateur existe via Feign (userservice)
        User user = getUserById(userId);
        log.debug("Utilisateur trouvé: {} (ID: {})", user.getUsername(), user.getUserId());

        // Vérifier que le départ existe et est actif
        Depart depart = departRepository.findByUuid(request.getDepartUuid())
                .orElseThrow(() -> new ApiException("Point de départ non trouvé: " + request.getDepartUuid()));

        if (!Boolean.TRUE.equals(depart.getActif())) {
            throw new ApiException("Le point de départ n'est pas actif");
        }

        // Vérifier que l'arrivée existe et est active
        Arrivee arrivee = arriveeRepository.findByUuid(request.getArriveeUuid())
                .orElseThrow(() -> new ApiException("Point d'arrivée non trouvé: " + request.getArriveeUuid()));

        if (!Boolean.TRUE.equals(arrivee.getActif())) {
            throw new ApiException("Le point d'arrivée n'est pas actif");
        }

        // Vérifier que l'arrivée est bien liée au départ
        if (!depart.getDepartId().equals(arrivee.getDepartId())) {
            throw new ApiException("Le point d'arrivée n'est pas associé à ce point de départ");
        }

        // Vérifier l'unicité du trajet
        if (trajetRepository.existsByDepartAndArrivee(request.getDepartUuid(), request.getArriveeUuid())) {
            throw new ApiException("Un trajet existe déjà pour cette combinaison départ/arrivée");
        }

        // Générer le libellé si non fourni
        String libelleTrajet = request.getLibelleTrajet();
        if (libelleTrajet == null || libelleTrajet.trim().isEmpty()) {
            libelleTrajet = generateLibelleTrajet(depart, arrivee);
        }

        // Créer le trajet
        Trajet trajet = Trajet.builder()
                .departId(depart.getDepartId())
                .arriveeId(arrivee.getArriveeId())
                .userId(user.getUserId())
                .libelleTrajet(libelleTrajet)
                .distanceKm(request.getDistanceKm())
                .dureeEstimeeMinutes(request.getDureeEstimeeMinutes())
                .montantBase(request.getMontantBase())
                .montantBagages(request.getMontantBagages() != null ? request.getMontantBagages() : BigDecimal.ZERO)
                .devise(request.getDevise() != null ? request.getDevise() : "GNF")
                .description(request.getDescription())
                .instructions(request.getInstructions())
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();

        Trajet savedTrajet = trajetRepository.save(trajet);
        log.info("Trajet créé avec succès: {}", savedTrajet.getTrajetUuid());

        return trajetRepository.findByUuid(savedTrajet.getTrajetUuid()).orElse(savedTrajet);
    }

    @Override
    public Trajet update(String uuid, TrajetRequest request) {
        log.info("Mise à jour du trajet: {}", uuid);

        Trajet existingTrajet = trajetRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Trajet non trouvé: " + uuid));

        Depart depart = departRepository.findByUuid(request.getDepartUuid())
                .orElseThrow(() -> new ApiException("Point de départ non trouvé: " + request.getDepartUuid()));

        Arrivee arrivee = arriveeRepository.findByUuid(request.getArriveeUuid())
                .orElseThrow(() -> new ApiException("Point d'arrivée non trouvé: " + request.getArriveeUuid()));

        if (!depart.getDepartId().equals(arrivee.getDepartId())) {
            throw new ApiException("Le point d'arrivée n'est pas associé à ce point de départ");
        }

        boolean routeChanged = !existingTrajet.getDepartId().equals(depart.getDepartId())
                || !existingTrajet.getArriveeId().equals(arrivee.getArriveeId());

        if (routeChanged && trajetRepository.existsByDepartAndArriveeExcludingUuid(
                request.getDepartUuid(), request.getArriveeUuid(), uuid)) {
            throw new ApiException("Un trajet existe déjà pour cette combinaison départ/arrivée");
        }

        String libelleTrajet = request.getLibelleTrajet();
        if (libelleTrajet == null || libelleTrajet.trim().isEmpty()) {
            libelleTrajet = generateLibelleTrajet(depart, arrivee);
        }

        existingTrajet.setDepartId(depart.getDepartId());
        existingTrajet.setArriveeId(arrivee.getArriveeId());
        existingTrajet.setLibelleTrajet(libelleTrajet);
        existingTrajet.setDistanceKm(request.getDistanceKm());
        existingTrajet.setDureeEstimeeMinutes(request.getDureeEstimeeMinutes());
        existingTrajet.setMontantBase(request.getMontantBase());
        existingTrajet.setMontantBagages(request.getMontantBagages());
        existingTrajet.setDevise(request.getDevise());
        existingTrajet.setDescription(request.getDescription());
        existingTrajet.setInstructions(request.getInstructions());
        if (request.getActif() != null) {
            existingTrajet.setActif(request.getActif());
        }

        Trajet updatedTrajet = trajetRepository.update(existingTrajet);
        log.info("Trajet mis à jour avec succès: {}", uuid);

        return trajetRepository.findByUuid(uuid).orElse(updatedTrajet);
    }

    @Override
    public Trajet updateMontants(String uuid, BigDecimal montantBase, BigDecimal montantBagages) {
        log.info("Mise à jour des montants du trajet: {}", uuid);

        if (!trajetRepository.findByUuid(uuid).isPresent()) {
            throw new ApiException("Trajet non trouvé: " + uuid);
        }

        if (montantBase == null || montantBase.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Le montant de base doit être positif");
        }

        return trajetRepository.updateMontants(uuid, montantBase,
                montantBagages != null ? montantBagages : BigDecimal.ZERO);
    }

    @Override
    public Trajet activate(String uuid) {
        log.info("Activation du trajet: {}", uuid);
        Trajet trajet = getByUuid(uuid);

        if (Boolean.TRUE.equals(trajet.getActif())) {
            throw new ApiException("Le trajet est déjà actif");
        }

        trajetRepository.updateActif(uuid, true);
        return trajetRepository.findByUuid(uuid).orElse(trajet);
    }

    @Override
    public Trajet deactivate(String uuid) {
        log.info("Désactivation du trajet: {}", uuid);
        Trajet trajet = getByUuid(uuid);

        if (!Boolean.TRUE.equals(trajet.getActif())) {
            throw new ApiException("Le trajet est déjà inactif");
        }

        if (trajetRepository.hasOffres(uuid)) {
            throw new ApiException("Impossible de désactiver: des offres sont associées à ce trajet");
        }

        trajetRepository.updateActif(uuid, false);
        return trajetRepository.findByUuid(uuid).orElse(trajet);
    }

    @Override
    public Trajet toggleActif(String uuid) {
        log.info("Basculement du statut actif du trajet: {}", uuid);
        Trajet trajet = getByUuid(uuid);

        if (Boolean.TRUE.equals(trajet.getActif())) {
            return deactivate(uuid);
        } else {
            return activate(uuid);
        }
    }

    @Override
    public void delete(String uuid) {
        log.info("Suppression du trajet: {}", uuid);

        Trajet trajet = getByUuid(uuid);

        if (trajetRepository.hasOffres(uuid)) {
            throw new ApiException("Impossible de supprimer: des offres sont associées à ce trajet");
        }

        int deleted = trajetRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du trajet");
        }

        log.info("Trajet supprimé avec succès: {}", uuid);
    }

    // ========== STATISTIQUES ==========

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return trajetRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countActifs() {
        return trajetRepository.countActifs();
    }

    // ========== MÉTHODES PRIVÉES ==========

    /**
     * Récupère l'utilisateur via Feign (userservice)
     */
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

    /**
     * Génère un libellé automatique pour le trajet basé sur les villes
     */
    private String generateLibelleTrajet(Depart depart, Arrivee arrivee) {
        String villeDepart = depart.getVilleLibelle() != null ? depart.getVilleLibelle() : depart.getSiteNom();
        String villeArrivee = arrivee.getVilleLibelle() != null ? arrivee.getVilleLibelle() : arrivee.getSiteNom();
        return villeDepart + " - " + villeArrivee;
    }
}