package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Agence;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class AgenceRowMapper implements RowMapper<Agence> {

    @Override
    public Agence mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Agence.builder()
                .agenceId(rs.getLong("agence_id"))
                .agenceUuid(rs.getString("agence_uuid"))
                .nom(rs.getString("nom"))
                .raisonSociale(rs.getString("raison_sociale"))
                .numeroRegistre(rs.getString("numero_registre"))
                .logoUrl(rs.getString("logo_url"))
                .telephone(rs.getString("telephone"))
                .email(rs.getString("email"))
                .localisationId(rs.getObject("localisation_id", Long.class))
                .description(rs.getString("description"))
                .siteWeb(rs.getString("site_web"))
                .reseauxSociauxJson(rs.getString("reseaux_sociaux"))
                .proprietaireUserId(rs.getLong("proprietaire_user_id"))
                .statutVerification(rs.getString("statut_verification"))
                .documentsKycUrl(rs.getString("documents_kyc_url"))
                .dateCreationAgence(rs.getDate("date_creation_agence") != null
                        ? rs.getDate("date_creation_agence").toLocalDate() : null)
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", java.time.OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", java.time.OffsetDateTime.class))
                .build();
    }
}
