package io.multi.billetterieservice.service;


import io.multi.billetterieservice.domain.Depart;

import java.util.List;

public interface DepartService {

    List<Depart> getAllDeparts();

    List<Depart> getAllDepartsActifs();

    Depart getDepartByUuid(String uuid);

    List<Depart> getDepartsBySite(String siteUuid);

    List<Depart> getDepartsBySiteActifs(String siteUuid);

    List<Depart> getDepartsByVille(String villeUuid);

    List<Depart> searchDeparts(String searchTerm);

    Depart createDepart(Depart depart, String siteUuid);

    Depart updateDepart(String uuid, Depart depart, String siteUuid);

    Depart toggleActif(String uuid);

    void deleteDepart(String uuid);
}