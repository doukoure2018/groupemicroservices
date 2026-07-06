package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.DemandeBesoin;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.mapper.DemandeBesoinRowMapper;
import io.multi.immobilierservice.query.DemandeBesoinQuery;
import io.multi.immobilierservice.repository.DemandeBesoinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Slf4j
public class DemandeBesoinRepositoryImpl implements DemandeBesoinRepository {

    private final JdbcClient jdbcClient;
    private final DemandeBesoinRowMapper rowMapper;

    @Override
    public DemandeBesoin save(DemandeBesoin demande) {
        // INSERT ... RETURNING * ne porte pas les libellés joints : on relit enrichi.
        String uuid = jdbcClient.sql(DemandeBesoinQuery.INSERT_DEMANDE)
                .param("userId", demande.getUserId())
                .param("typeAnnonce", demande.getTypeAnnonce())
                .param("typeBienId", demande.getTypeBienId())
                .param("communeId", demande.getCommuneId())
                .param("quartierId", demande.getQuartierId())
                .param("budgetMin", demande.getBudgetMin())
                .param("budgetMax", demande.getBudgetMax())
                .param("devise", demande.getDevise())
                .param("nbChambresMin", demande.getNbChambresMin())
                .param("commoditeIdsJson", demande.getCommoditeIdsJson())
                .param("description", demande.getDescription())
                .param("contactTelephone", demande.getContactTelephone())
                .param("contactWhatsapp", demande.getContactWhatsapp())
                .query((rs, i) -> rs.getString("demande_uuid"))
                .single();
        return findByUuid(uuid)
                .orElseThrow(() -> new ApiException("Demande créée mais relecture impossible : " + uuid));
    }

    @Override
    public Optional<DemandeBesoin> findByUuid(String demandeUuid) {
        return jdbcClient.sql(DemandeBesoinQuery.FIND_BY_UUID)
                .param("demandeUuid", demandeUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<DemandeBesoin> findMesDemandes(Long userId) {
        return jdbcClient.sql(DemandeBesoinQuery.FIND_MES_DEMANDES)
                .param("userId", userId)
                .query(rowMapper)
                .list();
    }

    @Override
    public List<DemandeBesoin> findActivesZone(Long communeId, Long regionId, int limit, int offset) {
        return jdbcClient.sql(DemandeBesoinQuery.FIND_ACTIVES_ZONE)
                .param("communeId", communeId)
                .param("regionId", regionId)
                .param("limit", limit)
                .param("offset", offset)
                .query(rowMapper)
                .list();
    }

    @Override
    public long countActivesZone(Long communeId, Long regionId) {
        return jdbcClient.sql(DemandeBesoinQuery.COUNT_ACTIVES_ZONE)
                .param("communeId", communeId)
                .param("regionId", regionId)
                .query(Long.class)
                .single();
    }

    @Override
    public List<DemandeBesoin> findActivesAll(int limit, int offset) {
        return jdbcClient.sql(DemandeBesoinQuery.FIND_ACTIVES_ALL)
                .param("limit", limit)
                .param("offset", offset)
                .query(rowMapper)
                .list();
    }

    @Override
    public long countActivesAll() {
        return jdbcClient.sql(DemandeBesoinQuery.COUNT_ACTIVES_ALL)
                .query(Long.class)
                .single();
    }

    @Override
    public Optional<DemandeBesoin> updateStatut(String demandeUuid, String statut) {
        // RETURNING * sans jointures : on relit enrichi si présent.
        Optional<String> uuid = jdbcClient.sql(DemandeBesoinQuery.UPDATE_STATUT)
                .param("demandeUuid", demandeUuid)
                .param("statut", statut)
                .query((rs, i) -> rs.getString("demande_uuid"))
                .optional();
        return uuid.flatMap(this::findByUuid);
    }
}
