package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Visite;
import io.multi.immobilierservice.dto.LeadVisiteAdminView;
import io.multi.immobilierservice.mapper.VisiteRowMapper;
import io.multi.immobilierservice.query.VisiteQuery;
import io.multi.immobilierservice.repository.VisiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class VisiteRepositoryImpl implements VisiteRepository {

    private final JdbcClient jdbcClient;
    private final VisiteRowMapper rowMapper;

    @Override
    public Visite save(Visite v) {
        return jdbcClient.sql(VisiteQuery.INSERT_VISITE)
                .param("proprieteId", v.getProprieteId())
                .param("visiteurUserId", v.getVisiteurUserId())
                .param("dateVisite", v.getDateVisite())
                .param("heureVisite", v.getHeureVisite())
                .param("notesVisiteur", v.getNotesVisiteur())
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<Visite> findByUuid(String uuid) {
        return jdbcClient.sql(VisiteQuery.FIND_BY_UUID)
                .param("visiteUuid", uuid)
                .query(rowMapper).optional();
    }

    @Override
    public List<Visite> findByVisiteur(Long userId, int limit, int offset) {
        return jdbcClient.sql(VisiteQuery.FIND_BY_VISITEUR)
                .param("userId", userId).param("limit", limit).param("offset", offset)
                .query(rowMapper).list();
    }

    @Override
    public long countByVisiteur(Long userId) {
        return jdbcClient.sql(VisiteQuery.COUNT_BY_VISITEUR)
                .param("userId", userId).query(Long.class).single();
    }

    @Override
    public List<Visite> findByVendeur(Long vendeurUserId, int limit, int offset) {
        return jdbcClient.sql(VisiteQuery.FIND_BY_VENDEUR)
                .param("vendeurUserId", vendeurUserId).param("limit", limit).param("offset", offset)
                .query(rowMapper).list();
    }

    @Override
    public long countByVendeur(Long vendeurUserId) {
        return jdbcClient.sql(VisiteQuery.COUNT_BY_VENDEUR)
                .param("vendeurUserId", vendeurUserId).query(Long.class).single();
    }

    @Override
    public Optional<Visite> confirmer(String uuid) {
        return jdbcClient.sql(VisiteQuery.UPDATE_STATUT_CONFIRMER)
                .param("visiteUuid", uuid).query(rowMapper).optional();
    }

    @Override
    public Optional<Visite> effectuer(String uuid, String notesVendeur) {
        return jdbcClient.sql(VisiteQuery.UPDATE_STATUT_EFFECTUER)
                .param("visiteUuid", uuid).param("notesVendeur", notesVendeur)
                .query(rowMapper).optional();
    }

    @Override
    public Optional<Visite> annuler(String uuid, String motif) {
        return jdbcClient.sql(VisiteQuery.UPDATE_STATUT_ANNULER)
                .param("visiteUuid", uuid).param("motif", motif)
                .query(rowMapper).optional();
    }

    @Override
    public Optional<Long> findOwnerUserId(String uuid) {
        return jdbcClient.sql(VisiteQuery.FIND_OWNER_USER_ID)
                .param("visiteUuid", uuid).query(Long.class).optional();
    }

    @Override
    public List<LeadVisiteAdminView> findLeadsForAdmin(String statut, int limit, int offset) {
        return jdbcClient.sql(VisiteQuery.FIND_LEADS_FOR_ADMIN)
                .param("statut", statut)
                .param("limit", limit)
                .param("offset", offset)
                // Réutilise VisiteRowMapper pour v.* (incl. champs lead_*), puis lit les 2 colonnes jointes.
                .query((rs, n) -> LeadVisiteAdminView.builder()
                        .visite(rowMapper.mapRow(rs, n))
                        .proprieteUuid(rs.getString("propriete_uuid"))
                        .proprieteReference(rs.getString("propriete_reference"))
                        .proprieteTitre(rs.getString("propriete_titre"))
                        .build())
                .list();
    }

    @Override
    public long countLeadsForAdmin(String statut) {
        return jdbcClient.sql(VisiteQuery.COUNT_LEADS_FOR_ADMIN)
                .param("statut", statut).query(Long.class).single();
    }

    @Override
    public Optional<Visite> traiterLead(String visiteUuid, String leadStatut, Long adminUserId, String noteAdmin) {
        return jdbcClient.sql(VisiteQuery.UPDATE_LEAD_TRAITE)
                .param("visiteUuid", visiteUuid)
                .param("leadStatut", leadStatut)
                .param("adminUserId", adminUserId)
                .param("noteAdmin", noteAdmin)
                .query(rowMapper).optional();
    }
}
