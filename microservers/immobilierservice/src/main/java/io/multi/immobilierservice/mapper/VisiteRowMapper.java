package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Visite;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class VisiteRowMapper implements RowMapper<Visite> {

    @Override
    public Visite mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Visite.builder()
                .visiteId(rs.getLong("visite_id"))
                .visiteUuid(rs.getString("visite_uuid"))
                .proprieteId(rs.getLong("propriete_id"))
                .visiteurUserId(rs.getLong("visiteur_user_id"))
                .dateVisite(rs.getDate("date_visite") != null
                        ? rs.getDate("date_visite").toLocalDate() : null)
                .heureVisite(rs.getTime("heure_visite") != null
                        ? rs.getTime("heure_visite").toLocalTime() : null)
                .statut(rs.getString("statut"))
                .notesVisiteur(rs.getString("notes_visiteur"))
                .notesVendeur(rs.getString("notes_vendeur"))
                .motifAnnulation(rs.getString("motif_annulation"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .leadStatut(rs.getString("lead_statut"))
                .noteAdmin(rs.getString("note_admin"))
                .traitePar(rs.getObject("traite_par", Long.class))
                .traiteAt(rs.getObject("traite_at", OffsetDateTime.class))
                .build();
    }
}
