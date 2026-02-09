package io.multi.billetterieservice.mapper;

import io.multi.billetterieservice.domain.Commune;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

/**
 * RowMapper pour convertir les résultats SQL en objets Commune.
 */
@Component
public class CommuneRowMapper implements RowMapper<Commune> {

    @Override
    public Commune mapRow(ResultSet rs, int rowNum) throws SQLException {
        Commune.CommuneBuilder builder = Commune.builder()
                .communeId(rs.getLong("commune_id"))
                .communeUuid(rs.getString("commune_uuid"))
                .villeId(rs.getLong("ville_id"))
                .libelle(rs.getString("libelle"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class));

        // Champs optionnels de jointure
        try {
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
