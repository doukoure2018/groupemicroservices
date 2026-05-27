package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Photo;

import java.util.List;

public interface PhotoService {

    Photo uploadPhotoPropriete(String proprieteUuid, byte[] data, String filename, String contentType, Long userId);

    List<Photo> findByPropriete(String proprieteUuid);

    Photo definirCouverture(String photoUuid, Long userId);

    void supprimer(String photoUuid, Long userId);

    void reordonner(String proprieteUuid, List<String> photoUuidsEnOrdre, Long userId);
}
