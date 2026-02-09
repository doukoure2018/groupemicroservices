package io.multi.billetterieservice.mapper;

import io.multi.billetterieservice.domain.Quartier;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

/**
 * RowMapper pour convertir les résultats SQL en objets Quartier.
 */
@Component
public class QuartierRowMapper implements RowMapper<Quartier> {

    @Override
    public Quartier mapRow(ResultSet rs, int rowNum) throws SQLException {
        Quartier.QuartierBuilder builder = Quartier.builder()
                .quartierId(rs.getLong("quartier_id"))
                .quartierUuid(rs.getString("quartier_uuid"))
                .communeId(rs.getLong("commune_id"))
                .libelle(rs.getString("libelle"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class));

        // Champs optionnels de jointure
        try {
            builder.communeUuid(rs.getString("commune_uuid"));
            builder.communeLibelle(rs.getString("commune_libelle"));
            builder.villeUuid(rs.getString("ville_uuid"));
            builder.villeLibelle(rs.getString("ville_libelle"));
            builder.regionUuid(rs.getString("region_uuid"));
            builder.regionLibelle(rs.getString("region_libelle"));
        } catch (SQLException e) {
            // Les colonnes de jointure ne sont pas présentes, on ignore
        }

        return builder.build();
    }
}
