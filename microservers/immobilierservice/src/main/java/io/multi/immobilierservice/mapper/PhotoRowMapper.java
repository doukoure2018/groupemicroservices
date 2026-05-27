package io.multi.immobilierservice.mapper;

import io.multi.immobilierservice.domain.Photo;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

@Component
public class PhotoRowMapper implements RowMapper<Photo> {

    @Override
    public Photo mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Photo.builder()
                .photoId(rs.getLong("photo_id"))
                .photoUuid(rs.getString("photo_uuid"))
                .proprieteId(rs.getLong("propriete_id"))
                .url(rs.getString("url"))
                .urlThumbnail(rs.getString("url_thumbnail"))
                .objectKey(rs.getString("object_key"))
                .objectKeyThumbnail(rs.getString("object_key_thumbnail"))
                .ordreAffichage(rs.getInt("ordre_affichage"))
                .estCouverture(rs.getBoolean("est_couverture"))
                .tailleOctets(rs.getObject("taille_octets", Long.class))
                .typeMime(rs.getString("type_mime"))
                .largeur(rs.getObject("largeur", Integer.class))
                .hauteur(rs.getObject("hauteur", Integer.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }
}
