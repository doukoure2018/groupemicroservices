package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Contact;
import io.multi.immobilierservice.dto.LeadAdminView;
import io.multi.immobilierservice.mapper.ContactRowMapper;
import io.multi.immobilierservice.query.ContactQuery;
import io.multi.immobilierservice.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ContactRepositoryImpl implements ContactRepository {

    private final JdbcClient jdbcClient;
    private final ContactRowMapper rowMapper;

    @Override
    public Contact save(Contact c) {
        return jdbcClient.sql(ContactQuery.INSERT_CONTACT)
                .param("proprieteId", c.getProprieteId())
                .param("demandeurUserId", c.getDemandeurUserId())
                .param("nomDemandeur", c.getNomDemandeur())
                .param("telephoneDemandeur", c.getTelephoneDemandeur())
                .param("emailDemandeur", c.getEmailDemandeur())
                .param("message", c.getMessage())
                .param("typeDemande", c.getTypeDemande())
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<Contact> findByUuid(String contactUuid) {
        return jdbcClient.sql(ContactQuery.FIND_BY_UUID)
                .param("contactUuid", contactUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Contact> findRecusByVendeur(Long vendeurUserId, int limit, int offset) {
        return jdbcClient.sql(ContactQuery.FIND_RECUS_BY_VENDEUR)
                .param("vendeurUserId", vendeurUserId)
                .param("limit", limit)
                .param("offset", offset)
                .query(rowMapper)
                .list();
    }

    @Override
    public long countRecusByVendeur(Long vendeurUserId) {
        return jdbcClient.sql(ContactQuery.COUNT_RECUS_BY_VENDEUR)
                .param("vendeurUserId", vendeurUserId)
                .query(Long.class)
                .single();
    }

    @Override
    public List<Contact> findEnvoyesByUser(Long userId, int limit, int offset) {
        return jdbcClient.sql(ContactQuery.FIND_ENVOYES_BY_USER)
                .param("userId", userId)
                .param("limit", limit)
                .param("offset", offset)
                .query(rowMapper)
                .list();
    }

    @Override
    public long countEnvoyesByUser(Long userId) {
        return jdbcClient.sql(ContactQuery.COUNT_ENVOYES_BY_USER)
                .param("userId", userId)
                .query(Long.class)
                .single();
    }

    @Override
    public Optional<Contact> markVu(String contactUuid) {
        return jdbcClient.sql(ContactQuery.MARK_VU)
                .param("contactUuid", contactUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public Optional<Long> findVendeurUserId(String contactUuid) {
        return jdbcClient.sql(ContactQuery.FIND_VENDEUR_USER_ID)
                .param("contactUuid", contactUuid)
                .query(Long.class)
                .optional();
    }

    @Override
    public List<LeadAdminView> findLeadsForAdmin(String statut, int limit, int offset) {
        return jdbcClient.sql(ContactQuery.FIND_LEADS_FOR_ADMIN)
                .param("statut", statut)
                .param("limit", limit)
                .param("offset", offset)
                // Réutilise ContactRowMapper pour c.* (incl. champs lead_*), puis lit les 2 colonnes jointes.
                .query((rs, n) -> LeadAdminView.builder()
                        .contact(rowMapper.mapRow(rs, n))
                        .proprieteReference(rs.getString("propriete_reference"))
                        .proprieteTitre(rs.getString("propriete_titre"))
                        .build())
                .list();
    }

    @Override
    public long countLeadsForAdmin(String statut) {
        return jdbcClient.sql(ContactQuery.COUNT_LEADS_FOR_ADMIN)
                .param("statut", statut)
                .query(Long.class)
                .single();
    }

    @Override
    public Optional<Contact> traiterLead(String contactUuid, String leadStatut, Long adminUserId, String noteAdmin) {
        return jdbcClient.sql(ContactQuery.UPDATE_LEAD_TRAITE)
                .param("contactUuid", contactUuid)
                .param("leadStatut", leadStatut)
                .param("adminUserId", adminUserId)
                .param("noteAdmin", noteAdmin)
                .query(rowMapper)
                .optional();
    }
}
