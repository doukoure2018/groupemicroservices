package io.multi.billetterieservice.mapper;
import io.multi.billetterieservice.domain.Ville;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

/**
 * RowMapper pour convertir les résultats SQL en objets Ville.
 * Gère les cas avec et sans jointure sur la table regions.
 */
@Component
public class VilleRowMapper implements RowMapper<Ville> {

    @Override
    public Ville mapRow(ResultSet rs, int rowNum) throws SQLException {
        Ville.VilleBuilder builder = Ville.builder()
                .villeId(rs.getLong("ville_id"))
                .villeUuid(rs.getString("ville_uuid"))
                .regionId(rs.getLong("region_id"))
                .libelle(rs.getString("libelle"))
                .codePostal(rs.getString("code_postal"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class));

        // Champs optionnels de jointure (peuvent ne pas être présents)
        try {
            builder.regionLibelle(rs.getString("region_libelle"));
            builder.regionUuid(rs.getString("region_uuid"));
        } catch (SQLException e) {
            // Les colonnes de jointure ne sont pas présentes, on ignore
        }

        return builder.build();
    }
}