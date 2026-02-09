package io.multi.billetterieservice.mapper;

import io.multi.billetterieservice.domain.Localisation;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

/**
 * RowMapper pour convertir les résultats SQL en objets Localisation.
 */
@Component
public class LocalisationRowMapper implements RowMapper<Localisation> {

    @Override
    public Localisation mapRow(ResultSet rs, int rowNum) throws SQLException {
        Localisation.LocalisationBuilder builder = Localisation.builder()
                .localisationId(rs.getLong("localisation_id"))
                .localisationUuid(rs.getString("localisation_uuid"))
                .adresseComplete(rs.getString("adresse_complete"))
                .description(rs.getString("description"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class));

        // Champs nullable
        Long quartierId = rs.getObject("quartier_id", Long.class);
        builder.quartierId(quartierId);

        BigDecimal latitude = rs.getBigDecimal("latitude");
        builder.latitude(latitude);

        BigDecimal longitude = rs.getBigDecimal("longitude");
        builder.longitude(longitude);

        // Champs optionnels de jointure (peuvent être null si pas de quartier)
        try {
            builder.quartierUuid(rs.getString("quartier_uuid"));
            builder.quartierLibelle(rs.getString("quartier_libelle"));
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
