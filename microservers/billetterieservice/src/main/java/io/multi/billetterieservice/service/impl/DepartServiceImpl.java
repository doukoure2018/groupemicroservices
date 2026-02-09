package io.multi.billetterieservice.service.impl;


import io.multi.billetterieservice.domain.Depart;
import io.multi.billetterieservice.domain.Site;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.DepartRepository;
import io.multi.billetterieservice.repository.SiteRepository;
import io.multi.billetterieservice.service.DepartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DepartServiceImpl implements DepartService {

    private final DepartRepository departRepository;
    private final SiteRepository siteRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Depart> getAllDeparts() {
        log.info("Récupération de tous les départs");
        return departRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Depart> getAllDepartsActifs() {
        log.info("Récupération de tous les départs actifs");
        return departRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public Depart getDepartByUuid(String uuid) {
        log.info("Récupération du départ avec UUID: {}", uuid);
        return departRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Départ non trouvé avec l'UUID: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Depart> getDepartsBySite(String siteUuid) {
        log.info("Récupération des départs pour le site: {}", siteUuid);
        return departRepository.findBySiteUuid(siteUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Depart> getDepartsBySiteActifs(String siteUuid) {
        log.info("Récupération des départs actifs pour le site: {}", siteUuid);
        return departRepository.findBySiteUuidActifs(siteUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Depart> getDepartsByVille(String villeUuid) {
        log.info("Récupération des départs pour la ville: {}", villeUuid);
        return departRepository.findByVille(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Depart> searchDeparts(String searchTerm) {
        log.info("Recherche de départs avec le terme: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return departRepository.findAll();
        }
        return departRepository.searchByLibelle(searchTerm.trim());
    }

    @Override
    public Depart createDepart(Depart depart, String siteUuid) {
        log.info("Création d'un nouveau départ: {} pour site: {}", depart.getLibelle(), siteUuid);

        // Vérifier que le site existe
        Site site = siteRepository.findByUuid(siteUuid)
                .orElseThrow(() -> new ApiException("Site non trouvé avec l'UUID: " + siteUuid));

        // Vérifier l'unicité du libellé pour ce site
        if (departRepository.existsByLibelleAndSite(depart.getLibelle(), site.getSiteId())) {
            throw new ApiException("Un départ avec ce libellé existe déjà pour ce site");
        }

        depart.setSiteId(site.getSiteId());
        Depart savedDepart = departRepository.save(depart);

        // Recharger avec toutes les informations jointes
        return departRepository.findByUuid(savedDepart.getDepartUuid())
                .orElse(savedDepart);
    }

    @Override
    public Depart updateDepart(String uuid, Depart depart, String siteUuid) {
        log.info("Mise à jour du départ: {}", uuid);

        // Vérifier que le départ existe
        Depart existingDepart = departRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Départ non trouvé avec l'UUID: " + uuid));

        // Récupérer le site
        Long siteId = existingDepart.getSiteId();
        if (siteUuid != null && !siteUuid.isEmpty()) {
            Site site = siteRepository.findByUuid(siteUuid)
                    .orElseThrow(() -> new ApiException("Site non trouvé avec l'UUID: " + siteUuid));
            siteId = site.getSiteId();
        }

        // Vérifier l'unicité du libellé si modifié
        if (!existingDepart.getLibelle().equalsIgnoreCase(depart.getLibelle()) ||
                !existingDepart.getSiteId().equals(siteId)) {
            if (departRepository.existsByLibelleAndSiteExcludingUuid(depart.getLibelle(), siteId, uuid)) {
                throw new ApiException("Un départ avec ce libellé existe déjà pour ce site");
            }
        }

        // Mettre à jour
        existingDepart.setSiteId(siteId);
        existingDepart.setLibelle(depart.getLibelle());
        existingDepart.setDescription(depart.getDescription());
        existingDepart.setOrdreAffichage(depart.getOrdreAffichage());
        if (depart.getActif() != null) {
            existingDepart.setActif(depart.getActif());
        }

        Depart updatedDepart = departRepository.update(existingDepart);

        // Recharger avec toutes les informations jointes
        return departRepository.findByUuid(updatedDepart.getDepartUuid())
                .orElse(updatedDepart);
    }

    @Override
    public Depart toggleActif(String uuid) {
        log.info("Basculement du statut actif pour le départ: {}", uuid);

        Depart depart = departRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Départ non trouvé avec l'UUID: " + uuid));

        boolean newActif = !depart.getActif();
        departRepository.updateActif(uuid, newActif);
        depart.setActif(newActif);

        return departRepository.findByUuid(uuid).orElse(depart);
    }

    @Override
    public void deleteDepart(String uuid) {
        log.info("Suppression du départ: {}", uuid);

        // Vérifier que le départ existe
        Depart depart = departRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Départ non trouvé avec l'UUID: " + uuid));

        // Vérifier qu'il n'y a pas d'arrivées liées
        if (departRepository.hasArrivees(uuid)) {
            throw new ApiException("Impossible de supprimer ce départ car il possède des arrivées");
        }

        int deleted = departRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du départ");
        }

        log.info("Départ supprimé avec succès: {}", uuid);
    }
}

