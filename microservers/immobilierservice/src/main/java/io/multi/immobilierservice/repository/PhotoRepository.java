package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Photo;

import java.util.List;
import java.util.Optional;

public interface PhotoRepository {

    Photo save(Photo photo);

    Optional<Photo> findByUuid(String photoUuid);

    List<Photo> findByPropriete(Long proprieteId);

    long countByPropriete(Long proprieteId);

    void deleteByUuid(String photoUuid);

    void unsetCouvertureForPropriete(Long proprieteId);

    Optional<Photo> setCouverture(String photoUuid);

    void updateOrdre(String photoUuid, int ordre);
}
