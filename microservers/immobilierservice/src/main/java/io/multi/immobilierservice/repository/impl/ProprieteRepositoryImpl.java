package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.mapper.CommoditeRowMapper;
import io.multi.immobilierservice.mapper.ProprieteRowMapper;
import io.multi.immobilierservice.query.ProprieteQuery;
import io.multi.immobilierservice.repository.ProprieteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Slf4j
public class ProprieteRepositoryImpl implements ProprieteRepository {

    private final JdbcClient jdbcClient;
    private final ProprieteRowMapper proprieteRowMapper;
    private final CommoditeRowMapper commoditeRowMapper;

    @Override
    public Propriete save(Propriete p) {
        return jdbcClient.sql(ProprieteQuery.INSERT_PROPRIETE)
                .param("profilId", p.getProfilId())
                .param("agenceId", p.getAgenceId())
                .param("typeAnnonce", p.getTypeAnnonce())
                .param("dureeLocation", p.getDureeLocation())
                .param("typeBienId", p.getTypeBienId())
                .param("titre", p.getTitre())
                .param("description", p.getDescription())
                .param("prix", p.getPrix())
                .param("devise", p.getDevise() != null ? p.getDevise() : "GNF")
                .param("periode", p.getPeriode())
                .param("prixSurDemande", Boolean.TRUE.equals(p.getPrixSurDemande()))
                .param("prixNegociable", Boolean.TRUE.equals(p.getPrixNegociable()))
                .param("nombreChambres", p.getNombreChambres() != null ? p.getNombreChambres() : 0)
                .param("nombreSallesBain", p.getNombreSallesBain() != null ? p.getNombreSallesBain() : 1)
                .param("surfaceM2", p.getSurfaceM2())
                .param("nombreEtages", p.getNombreEtages())
                .param("etageSituation", p.getEtageSituation())
                .param("anneeConstruction", p.getAnneeConstruction())
                .param("moisCaution", p.getMoisCaution())
                .param("moisAvance", p.getMoisAvance())
                .param("moisHonoraire", p.getMoisHonoraire())
                .param("localisationId", p.getLocalisationId())
                .param("adresseComplete", p.getAdresseComplete())
                .param("latitude", p.getLatitude())
                .param("longitude", p.getLongitude())
                .param("afficherAdresseExacte", Boolean.TRUE.equals(p.getAfficherAdresseExacte()))
                .param("dateDisponibilite", p.getDateDisponibilite())
                .param("statut", p.getStatut() != null ? p.getStatut() : "BROUILLON")
                .param("nomContactPublic", p.getNomContactPublic())
                .param("telephoneContact", p.getTelephoneContact())
                .query(proprieteRowMapper)
                .single();
    }

    @Override
    public Optional<Propriete> update(String proprieteUuid, Propriete u) {
        return jdbcClient.sql(ProprieteQuery.UPDATE_PROPRIETE)
                .param("proprieteUuid", proprieteUuid)
                .param("titre", u.getTitre())
                .param("description", u.getDescription())
                .param("dureeLocation", u.getDureeLocation())
                .param("prix", u.getPrix())
                .param("devise", u.getDevise())
                .param("periode", u.getPeriode())
                .param("prixSurDemande", u.getPrixSurDemande())
                .param("prixNegociable", u.getPrixNegociable())
                .param("nombreChambres", u.getNombreChambres())
                .param("nombreSallesBain", u.getNombreSallesBain())
                .param("surfaceM2", u.getSurfaceM2())
                .param("nombreEtages", u.getNombreEtages())
                .param("etageSituation", u.getEtageSituation())
                .param("anneeConstruction", u.getAnneeConstruction())
                .param("moisCaution", u.getMoisCaution())
                .param("moisAvance", u.getMoisAvance())
                .param("moisHonoraire", u.getMoisHonoraire())
                .param("localisationId", u.getLocalisationId())
                .param("adresseComplete", u.getAdresseComplete())
                .param("latitude", u.getLatitude())
                .param("longitude", u.getLongitude())
                .param("afficherAdresseExacte", u.getAfficherAdresseExacte())
                .param("dateDisponibilite", u.getDateDisponibilite())
                .param("nomContactPublic", u.getNomContactPublic())
                .param("telephoneContact", u.getTelephoneContact())
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public Optional<Propriete> updateStatut(String proprieteUuid, String statut) {
        return jdbcClient.sql(ProprieteQuery.UPDATE_STATUT)
                .param("proprieteUuid", proprieteUuid)
                .param("statut", statut)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public Optional<Propriete> findByUuid(String proprieteUuid) {
        return jdbcClient.sql(ProprieteQuery.FIND_BY_UUID)
                .param("proprieteUuid", proprieteUuid)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public Optional<Propriete> findById(Long proprieteId) {
        return jdbcClient.sql(ProprieteQuery.FIND_BY_ID)
                .param("proprieteId", proprieteId)
                .query(proprieteRowMapper)
                .optional();
    }

    @Override
    public List<Propriete> findByProfil(Long profilId, int limit, int offset) {
        return jdbcClient.sql(ProprieteQuery.FIND_BY_PROFIL)
                .param("profilId", profilId)
                .param("limit", limit)
                .param("offset", offset)
                .query(proprieteRowMapper)
                .list();
    }

    @Override
    public void incrementVues(String proprieteUuid) {
        jdbcClient.sql(ProprieteQuery.INCREMENT_VUES)
                .param("proprieteUuid", proprieteUuid)
                .update();
    }

    @Override
    public Optional<Long> lookupLocalisationIdByUuid(String localisationUuid) {
        return jdbcClient.sql(ProprieteQuery.LOOKUP_LOCALISATION_ID)
                .param("uuid", localisationUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public void replaceCommodites(Long proprieteId, List<Long> commoditeIds) {
        jdbcClient.sql(ProprieteQuery.CLEAR_COMMODITES)
                .param("proprieteId", proprieteId)
                .update();
        if (commoditeIds == null) return;
        for (Long commoditeId : commoditeIds) {
            jdbcClient.sql(ProprieteQuery.INSERT_COMMODITE)
                    .param("proprieteId", proprieteId)
                    .param("commoditeId", commoditeId)
                    .update();
        }
    }

    @Override
    public List<Commodite> findCommoditesOfPropriete(Long proprieteId) {
        return jdbcClient.sql(ProprieteQuery.FIND_COMMODITES_OF_PROPRIETE)
                .param("proprieteId", proprieteId)
                .query(commoditeRowMapper)
                .list();
    }
}
