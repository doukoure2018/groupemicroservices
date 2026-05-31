package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Photo;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface PhotoService {

    /**
     * Upload streaming via fichier temp disque (pas de byte[] en heap).
     * Pre-prod hardening : éviter OOM sous trafic concurrent (cf. fix multipart
     * streaming) — MultipartFile passé directement, transféré vers tempFile
     * côté PhotoStorageService, supprimé en finally.
     */
    Photo uploadPhotoPropriete(String proprieteUuid, MultipartFile file, Long userId) throws IOException;

    List<Photo> findByPropriete(String proprieteUuid);

    Photo definirCouverture(String photoUuid, Long userId);

    void supprimer(String photoUuid, Long userId);

    void reordonner(String proprieteUuid, List<String> photoUuidsEnOrdre, Long userId);
}
