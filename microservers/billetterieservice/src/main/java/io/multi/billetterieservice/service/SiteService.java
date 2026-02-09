package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Site;

import java.util.List;

public interface SiteService {

    List<Site> getAllSites();

    List<Site> getAllSitesActifs();

    Site getSiteByUuid(String uuid);

    List<Site> getSitesByTypeSite(String typeSite);

    List<Site> getSitesByLocalisation(String localisationUuid);

    List<Site> getSitesByVille(String villeUuid);

    List<Site> getSitesByCommune(String communeUuid);

    List<Site> searchSites(String searchTerm);

    Site createSite(Site site, String localisationUuid);

    Site updateSite(String uuid, Site site, String localisationUuid);

    Site toggleActif(String uuid);

    void deleteSite(String uuid);
}