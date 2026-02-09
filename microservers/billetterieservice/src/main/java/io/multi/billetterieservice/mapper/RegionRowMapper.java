package io.multi.billetterieservice.mapper;

import io.multi.billetterieservice.domain.Region;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

/**
 * RowMapper pour convertir les résultats SQL en objets Region.
 */
@Component
public class RegionRowMapper implements RowMapper<Region> {
    @Override
    public Region mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Region.builder()
                .regionId(rs.getLong("region_id"))
                .regionUuid(rs.getString("region_uuid"))
                .libelle(rs.getString("libelle"))
                .code(rs.getString("code"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .build();
    }
}