package io.multi.billetterieservice.service;


import io.multi.billetterieservice.domain.Arrivee;

import java.util.List;

public interface ArriveeService {

    List<Arrivee> getAllArrivees();

    List<Arrivee> getAllArriveesActifs();

    Arrivee getArriveeByUuid(String uuid);

    List<Arrivee> getArriveesBySite(String siteUuid);

    List<Arrivee> getArriveesByDepart(String departUuid);

    List<Arrivee> getArriveesByVilleArrivee(String villeUuid);

    List<Arrivee> getArriveesByVilleDepart(String villeUuid);

    List<Arrivee> getArriveesByDepartAndVilleArrivee(String departUuid, String villeArriveeUuid);

    List<Arrivee> searchArrivees(String searchTerm);

    Arrivee createArrivee(Arrivee arrivee, String siteUuid, String departUuid);

    Arrivee updateArrivee(String uuid, Arrivee arrivee, String siteUuid, String departUuid);

    Arrivee toggleActif(String uuid);

    void deleteArrivee(String uuid);
}













