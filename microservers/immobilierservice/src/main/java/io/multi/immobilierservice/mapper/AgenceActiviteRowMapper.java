package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.dto.AgenceActiviteView;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class AgenceActiviteRowMapper implements RowMapper<AgenceActiviteView> {

    @Override
    public AgenceActiviteView mapRow(ResultSet rs, int rowNum) throws SQLException {
        return AgenceActiviteView.builder()
                .agenceUuid(rs.getString("agence_uuid"))
                .nom(rs.getString("nom"))
                .raisonSociale(rs.getString("raison_sociale"))
                .numeroRegistre(rs.getString("numero_registre"))
                .email(rs.getString("email"))
                .telephone(rs.getString("telephone"))
                .statutVerification(rs.getString("statut_verification"))
                .proprietaireUserId(rs.getObject("proprietaire_user_id", Long.class))
                .communeLibelle(rs.getString("commune_libelle"))
                .regionLibelle(rs.getString("region_libelle"))
                .createdAt(rs.getObject("created_at", java.time.OffsetDateTime.class))
                .dateSoumissionConformite(rs.getObject("date_soumission_conformite", java.time.OffsetDateTime.class))
                .nbAnnoncesTotal(rs.getLong("nb_annonces_total"))
                .nbAnnoncesPubliees(rs.getLong("nb_annonces_publiees"))
                .nbAgents(rs.getLong("nb_agents"))
                .build();
    }
}
