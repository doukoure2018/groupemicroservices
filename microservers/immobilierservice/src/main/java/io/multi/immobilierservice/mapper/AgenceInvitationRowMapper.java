package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.AgenceInvitation;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class AgenceInvitationRowMapper implements RowMapper<AgenceInvitation> {

    @Override
    public AgenceInvitation mapRow(ResultSet rs, int rowNum) throws SQLException {
        return AgenceInvitation.builder()
                .invitationId(rs.getLong("invitation_id"))
                .invitationUuid(rs.getString("invitation_uuid"))
                .token(rs.getString("token"))
                .agenceId(rs.getLong("agence_id"))
                .inviteUserId(rs.getLong("invite_user_id"))
                .inviteParUserId(rs.getLong("invite_par_user_id"))
                .bioProposee(rs.getString("bio_proposee"))
                .telephonePropose(rs.getString("telephone_propose"))
                .statut(rs.getString("statut"))
                .motifRefus(rs.getString("motif_refus"))
                .dateExpiration(rs.getObject("date_expiration", OffsetDateTime.class))
                .dateReponse(rs.getObject("date_reponse", OffsetDateTime.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .build();
    }
}
