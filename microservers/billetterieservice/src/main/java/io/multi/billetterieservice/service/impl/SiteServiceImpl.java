package io.multi.billetterieservice.service.impl;

import io.multi.billetterieservice.domain.Localisation;
import io.multi.billetterieservice.domain.Site;
import io.multi.billetterieservice.exception.ApiException;
import io.multi.billetterieservice.repository.LocalisationRepository;
import io.multi.billetterieservice.repository.SiteRepository;
import io.multi.billetterieservice.service.SiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SiteServiceImpl implements SiteService {

    private final SiteRepository siteRepository;
    private final LocalisationRepository localisationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Site> getAllSites() {
        log.info("Récupération de tous les sites");
        return siteRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Site> getAllSitesActifs() {
        log.info("Récupération de tous les sites actifs");
        return siteRepository.findAllActifs();
    }

    @Override
    @Transactional(readOnly = true)
    public Site getSiteByUuid(String uuid) {
        log.info("Récupération du site avec UUID: {}", uuid);
        return siteRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Site non trouvé avec l'UUID: " + uuid));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Site> getSitesByTypeSite(String typeSite) {
        log.info("Récupération des sites de type: {}", typeSite);
        return siteRepository.findByTypeSite(typeSite);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Site> getSitesByLocalisation(String localisationUuid) {
        log.info("Récupération des sites pour la localisation: {}", localisationUuid);
        Localisation localisation = localisationRepository.findByUuid(localisationUuid)
                .orElseThrow(() -> new ApiException("Localisation non trouvée avec l'UUID: " + localisationUuid));
        return siteRepository.findByLocalisation(localisation.getLocalisationId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Site> getSitesByVille(String villeUuid) {
        log.info("Récupération des sites pour la ville: {}", villeUuid);
        return siteRepository.findByVille(villeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Site> getSitesByCommune(String communeUuid) {
        log.info("Récupération des sites pour la commune: {}", communeUuid);
        return siteRepository.findByCommune(communeUuid);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Site> searchSites(String searchTerm) {
        log.info("Recherche de sites avec le terme: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return siteRepository.findAll();
        }
        return siteRepository.searchByNom(searchTerm.trim());
    }

    @Override
    public Site createSite(Site site, String localisationUuid) {
        log.info("Création d'un nouveau site: {} pour localisation: {}", site.getNom(), localisationUuid);

        // Vérifier que la localisation existe
        Localisation localisation = localisationRepository.findByUuid(localisationUuid)
                .orElseThrow(() -> new ApiException("Localisation non trouvée avec l'UUID: " + localisationUuid));

        // Vérifier l'unicité du nom pour cette localisation
        if (siteRepository.existsByNomAndLocalisation(site.getNom(), localisation.getLocalisationId())) {
            throw new ApiException("Un site avec ce nom existe déjà à cette localisation");
        }

        site.setLocalisationId(localisation.getLocalisationId());
        Site savedSite = siteRepository.save(site);

        // Recharger avec toutes les informations jointes
        return siteRepository.findByUuid(savedSite.getSiteUuid())
                .orElse(savedSite);
    }

    @Override
    public Site updateSite(String uuid, Site site, String localisationUuid) {
        log.info("Mise à jour du site: {}", uuid);

        // Vérifier que le site existe
        Site existingSite = siteRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Site non trouvé avec l'UUID: " + uuid));

        // Récupérer la localisation
        Long localisationId = existingSite.getLocalisationId();
        if (localisationUuid != null && !localisationUuid.isEmpty()) {
            Localisation localisation = localisationRepository.findByUuid(localisationUuid)
                    .orElseThrow(() -> new ApiException("Localisation non trouvée avec l'UUID: " + localisationUuid));
            localisationId = localisation.getLocalisationId();
        }

        // Vérifier l'unicité du nom si modifié
        if (!existingSite.getNom().equalsIgnoreCase(site.getNom()) ||
                !existingSite.getLocalisationId().equals(localisationId)) {
            if (siteRepository.existsByNomAndLocalisationExcludingUuid(site.getNom(), localisationId, uuid)) {
                throw new ApiException("Un site avec ce nom existe déjà à cette localisation");
            }
        }

        // Mettre à jour
        existingSite.setLocalisationId(localisationId);
        existingSite.setNom(site.getNom());
        existingSite.setDescription(site.getDescription());
        existingSite.setTypeSite(site.getTypeSite());
        existingSite.setCapaciteVehicules(site.getCapaciteVehicules());
        existingSite.setTelephone(site.getTelephone());
        existingSite.setEmail(site.getEmail());
        existingSite.setHoraireOuverture(site.getHoraireOuverture());
        existingSite.setHoraireFermeture(site.getHoraireFermeture());
        existingSite.setImageUrl(site.getImageUrl());
        if (site.getActif() != null) {
            existingSite.setActif(site.getActif());
        }

        Site updatedSite = siteRepository.update(existingSite);

        // Recharger avec toutes les informations jointes
        return siteRepository.findByUuid(updatedSite.getSiteUuid())
                .orElse(updatedSite);
    }

    @Override
    public Site toggleActif(String uuid) {
        log.info("Basculement du statut actif pour le site: {}", uuid);

        Site site = siteRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Site non trouvé avec l'UUID: " + uuid));

        boolean newActif = !site.getActif();
        siteRepository.updateActif(uuid, newActif);
        site.setActif(newActif);

        return siteRepository.findByUuid(uuid).orElse(site);
    }

    @Override
    public void deleteSite(String uuid) {
        log.info("Suppression du site: {}", uuid);

        // Vérifier que le site existe
        Site site = siteRepository.findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Site non trouvé avec l'UUID: " + uuid));

        // Vérifier qu'il n'y a pas de départs liés
        if (siteRepository.hasDeparts(uuid)) {
            throw new ApiException("Impossible de supprimer ce site car il possède des départs");
        }

        // Vérifier qu'il n'y a pas d'arrivées liées
        if (siteRepository.hasArrivees(uuid)) {
            throw new ApiException("Impossible de supprimer ce site car il possède des arrivées");
        }

        int deleted = siteRepository.deleteByUuid(uuid);
        if (deleted == 0) {
            throw new ApiException("Erreur lors de la suppression du site");
        }

        log.info("Site supprimé avec succès: {}", uuid);
    }
}


