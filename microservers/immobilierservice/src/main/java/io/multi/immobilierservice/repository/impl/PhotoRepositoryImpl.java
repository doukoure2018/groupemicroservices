package io.multi.immobilierservice.repository.impl;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.mapper.PhotoRowMapper;
import io.multi.immobilierservice.query.PhotoQuery;
import io.multi.immobilierservice.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PhotoRepositoryImpl implements PhotoRepository {

    private final JdbcClient jdbcClient;
    private final PhotoRowMapper rowMapper;

    @Override
    public Photo save(Photo p) {
        return jdbcClient.sql(PhotoQuery.INSERT_PHOTO)
                .param("proprieteId", p.getProprieteId())
                .param("url", p.getUrl())
                .param("urlThumbnail", p.getUrlThumbnail())
                .param("objectKey", p.getObjectKey())
                .param("objectKeyThumbnail", p.getObjectKeyThumbnail())
                .param("ordreAffichage", p.getOrdreAffichage() != null ? p.getOrdreAffichage() : 0)
                .param("estCouverture", Boolean.TRUE.equals(p.getEstCouverture()))
                .param("tailleOctets", p.getTailleOctets())
                .param("typeMime", p.getTypeMime())
                .param("largeur", p.getLargeur())
                .param("hauteur", p.getHauteur())
                .query(rowMapper)
                .single();
    }

    @Override
    public Optional<Photo> findByUuid(String photoUuid) {
        return jdbcClient.sql(PhotoQuery.FIND_BY_UUID)
                .param("photoUuid", photoUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public List<Photo> findByPropriete(Long proprieteId) {
        return jdbcClient.sql(PhotoQuery.FIND_BY_PROPRIETE)
                .param("proprieteId", proprieteId)
                .query(rowMapper)
                .list();
    }

    @Override
    public long countByPropriete(Long proprieteId) {
        return jdbcClient.sql(PhotoQuery.COUNT_BY_PROPRIETE)
                .param("proprieteId", proprieteId)
                .query(Long.class)
                .single();
    }

    @Override
    public void deleteByUuid(String photoUuid) {
        jdbcClient.sql(PhotoQuery.DELETE_BY_UUID)
                .param("photoUuid", photoUuid)
                .update();
    }

    @Override
    public void unsetCouvertureForPropriete(Long proprieteId) {
        jdbcClient.sql(PhotoQuery.UNSET_COVERTURE)
                .param("proprieteId", proprieteId)
                .update();
    }

    @Override
    public Optional<Photo> setCouverture(String photoUuid) {
        return jdbcClient.sql(PhotoQuery.SET_COUVERTURE)
                .param("photoUuid", photoUuid)
                .query(rowMapper)
                .optional();
    }

    @Override
    public void updateOrdre(String photoUuid, int ordre) {
        jdbcClient.sql(PhotoQuery.UPDATE_ORDRE)
                .param("photoUuid", photoUuid)
                .param("ordre", ordre)
                .update();
    }
}
