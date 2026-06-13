package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Contact;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class ContactRowMapper implements RowMapper<Contact> {

    @Override
    public Contact mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Contact.builder()
                .contactId(rs.getLong("contact_id"))
                .contactUuid(rs.getString("contact_uuid"))
                .proprieteId(rs.getLong("propriete_id"))
                .demandeurUserId(rs.getLong("demandeur_user_id"))
                .nomDemandeur(rs.getString("nom_demandeur"))
                .telephoneDemandeur(rs.getString("telephone_demandeur"))
                .emailDemandeur(rs.getString("email_demandeur"))
                .message(rs.getString("message"))
                .typeDemande(rs.getString("type_demande"))
                .statut(rs.getString("statut"))
                .vuParVendeur(rs.getBoolean("vu_par_vendeur"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .leadStatut(rs.getString("lead_statut"))
                .noteAdmin(rs.getString("note_admin"))
                .traitePar(rs.getObject("traite_par", Long.class))
                .traiteAt(rs.getObject("traite_at", OffsetDateTime.class))
                .build();
    }
}
