package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Arrivee;
import io.multi.billetterieservice.domain.Depart;
import io.multi.billetterieservice.domain.Site;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.ArriveeRepository;
import io.multi.billetterieservice.repository.DepartRepository;
import io.multi.billetterieservice.repository.SiteRepository;
import io.multi.billetterieservice.service.ArriveeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ArriveeServiceImpl implements ArriveeService {

    private final ArriveeRepository arriveeRepository;
    private final SiteRepository siteRepository;
    private final DepartRepository departRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getAllArrivees() {
        log.info("Récupération de toutes les arrivées");
        return arriveeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getAllArriveesActifs() {
        log.info("Récupération de toutes les arrivées actives");
        return arriveeRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public Arrivee getArriveeByUuid(String uuid) {
        log.info("Récupération de l'arrivée avec UUID: {}", uuid);
        return arriveeRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Arrivée non trouvée avec l'UUID: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getArriveesBySite(String siteUuid) {
        log.info("Récupération des arrivées pour le site: {}", siteUuid);
        return arriveeRepository.findBySiteUuid(siteUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getArriveesByDepart(String departUuid) {
        log.info("Récupération des arrivées pour le départ: {}", departUuid);
        return arriveeRepository.findByDepartUuid(departUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getArriveesByVilleArrivee(String villeUuid) {
        log.info("Récupération des arrivées pour la ville d'arrivée: {}", villeUuid);
        return arriveeRepository.findByVilleArrivee(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getArriveesByVilleDepart(String villeUuid) {
        log.info("Récupération des arrivées pour la ville de départ: {}", villeUuid);
        return arriveeRepository.findByVilleDepart(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> getArriveesByDepartAndVilleArrivee(String departUuid, String villeArriveeUuid) {
        log.info("Récupération des arrivées pour le départ: {} et ville d'arrivée: {}", departUuid, villeArriveeUuid);
        return arriveeRepository.findByDepartAndVilleArrivee(departUuid, villeArriveeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Arrivee> searchArrivees(String searchTerm) {
        log.info("Recherche d'arrivées avec le terme: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return arriveeRepository.findAll();
        }
        return arriveeRepository.searchByLibelle(searchTerm.trim());
    }

    @Override
    public Arrivee createArrivee(Arrivee arrivee, String siteUuid, String departUuid) {
        log.info("Création d'une nouvelle arrivée: {} pour site: {} et départ: {}",
                arrivee.getLibelle(), siteUuid, departUuid);

        // Vérifier que le site d'arrivée existe
        Site site = siteRepository.findByUuid(siteUuid)
                .orElseThrow(() -> new ApiException("Site d'arrivée non trouvé avec l'UUID: " + siteUuid));

        // Vérifier que le départ existe
        Depart depart = departRepository.findByUuid(departUuid)
                .orElseThrow(() -> new ApiException("Départ non trouvé avec l'UUID: " + departUuid));

        // Vérifier que le site d'arrivée est différent du site de départ
        if (site.getSiteId().equals(depart.getSiteId())) {
            throw new ApiException("Le site d'arrivée ne peut pas être le même que le site de départ");
        }

        // Vérifier l'unicité du libellé pour ce site et ce départ
        if (arriveeRepository.existsByLibelleAndSiteAndDepart(arrivee.getLibelle(), site.getSiteId(), depart.getDepartId())) {
            throw new ApiException("Une arrivée avec ce libellé existe déjà pour ce site et ce départ");
        }

        arrivee.setSiteId(site.getSiteId());
        arrivee.setDepartId(depart.getDepartId());

        // Définir le libelle_depart si non fourni
        if (arrivee.getLibelleDepart() == null || arrivee.getLibelleDepart().isEmpty()) {
            arrivee.setLibelleDepart(depart.getLibelle());
        }

        Arrivee savedArrivee = arriveeRepository.save(arrivee);

        // Recharger avec toutes les informations jointes
        return arriveeRepository.findByUuid(savedArrivee.getArriveeUuid())
                .orElse(savedArrivee);
    }

    @Override
    public Arrivee updateArrivee(String uuid, Arrivee arrivee, String siteUuid, String departUuid) {
        log.info("Mise à jour de l'arrivée: {}", uuid);

        // Vérifier que l'arrivée existe
        Arrivee existingArrivee = arriveeRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Arrivée non trouvée avec l'UUID: " + uuid));

        // Récupérer le site d'arrivée
        Long siteId = existingArrivee.getSiteId();
        if (siteUuid != null && !siteUuid.isEmpty()) {
            Site site = siteRepository.findByUuid(siteUuid)
                    .orElseThrow(() -> new ApiException("Site d'arrivée non trouvé avec l'UUID: " + siteUuid));
            siteId = site.getSiteId();
        }

        // Récupérer le départ
        Long departId = existingArrivee.getDepartId();
        Depart depart = null;
        if (departUuid != null && !departUuid.isEmpty()) {
            depart = departRepository.findByUuid(departUuid)
                    .orElseThrow(() -> new ApiException("Départ non trouvé avec l'UUID: " + departUuid));
            departId = depart.getDepartId();

            // Vérifier que le site d'arrivée est différent du site de départ
            if (siteId.equals(depart.getSiteId())) {
                throw new ApiException("Le site d'arrivée ne peut pas être le même que le site de départ");
            }
        }

        // Vérifier l'unicité du libellé si modifié
        if (!existingArrivee.getLibelle().equalsIgnoreCase(arrivee.getLibelle()) ||
                !existingArrivee.getSiteId().equals(siteId) ||
                !existingArrivee.getDepartId().equals(departId)) {
            if (arriveeRepository.existsByLibelleAndSiteAndDepartExcludingUuid(arrivee.getLibelle(), siteId, departId, uuid)) {
                throw new ApiException("Une arrivée avec ce libellé existe déjà pour ce site et ce départ");
            }
        }

        // Mettre à jour
        existingArrivee.setSiteId(siteId);
        existingArrivee.setDepartId(departId);
        existingArrivee.setLibelle(arrivee.getLibelle());
        existingArrivee.setLibelleDepart(arrivee.getLibelleDepart());
        existingArrivee.setDescription(arrivee.getDescription());
        existingArrivee.setOrdreAffichage(arrivee.getOrdreAffichage());
        if (arrivee.getActif() != null) {
            existingArrivee.setActif(arrivee.getActif());
        }

        Arrivee updatedArrivee = arriveeRepository.update(existingArrivee);

        // Recharger avec toutes les informations jointes
        return arriveeRepository.findByUuid(updatedArrivee.getArriveeUuid())
                .orElse(updatedArrivee);
    }

    @Override
    public Arrivee toggleActif(String uuid) {
        log.info("Basculement du statut actif pour l'arrivée: {}", uuid);

        Arrivee arrivee = arriveeRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Arrivée non trouvée avec l'UUID: " + uuid));

        boolean newActif = !arrivee.getActif();
        arriveeRepository.updateActif(uuid, newActif);
        arrivee.setActif(newActif);

        return arriveeRepository.findByUuid(uuid).orElse(arrivee);
    }

    @Override
    public void deleteArrivee(String uuid) {
        log.info("Suppression de l'arrivée: {}", uuid);

        // Vérifier que l'arrivée existe
        Arrivee arrivee = arriveeRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Arrivée non trouvée avec l'UUID: " + uuid));

        // Vérifier qu'il n'y a pas de trajets liés (à implémenter plus tard)
        if (arriveeRepository.hasTrajets(uuid)) {
            throw new ApiException("Impossible de supprimer cette arrivée car elle est utilisée dans des trajets");
        }

        int deleted = arriveeRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression de l'arrivée");
        }

        log.info("Arrivée supprimée avec succès: {}", uuid);
    }
}