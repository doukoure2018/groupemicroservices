package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Commodite;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class CommoditeRowMapper implements RowMapper<Commodite> {

    @Override
    public Commodite mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Commodite.builder()
                .commoditeId(rs.getLong("commodite_id"))
                .commoditeUuid(rs.getString("commodite_uuid"))
                .code(rs.getString("code"))
                .libelle(rs.getString("libelle"))
                .categorie(rs.getString("categorie"))
                .icone(rs.getString("icone"))
                .ordreAffichage(rs.getInt("ordre_affichage"))
                .actif(rs.getBoolean("actif"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .build();
    }
}
