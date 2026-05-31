package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.UploadResult;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.exception.ForbiddenException;
import io.multi.immobilierservice.repository.PhotoRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.service.PhotoService;
import io.multi.immobilierservice.service.PhotoStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoServiceImpl implements PhotoService {

    private static final int MAX_PHOTOS_PAR_PROPRIETE = 12;

    private final PhotoRepository photoRepository;
    private final ProprieteRepository proprieteRepository;
    private final ProfilImmoRepository profilImmoRepository;
    private final PhotoStorageService photoStorageService;

    @Override
    @Transactional
    public Photo uploadPhotoPropriete(String proprieteUuid, MultipartFile file, Long userId) throws IOException {
        Propriete propriete = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        ensureOwner(propriete, userId);

        long existing = photoRepository.countByPropriete(propriete.getProprieteId());
        if (existing >= MAX_PHOTOS_PAR_PROPRIETE) {
            throw new ApiException("Nombre maximum de photos atteint (" + MAX_PHOTOS_PAR_PROPRIETE + ")");
        }

        UploadResult uploaded = photoStorageService.uploadPhoto(file);

        boolean isFirst = existing == 0;
        Photo toSave = Photo.builder()
                .proprieteId(propriete.getProprieteId())
                .url(uploaded.getUrl())
                .urlThumbnail(uploaded.getUrlThumbnail())
                .objectKey(uploaded.getObjectKey())
                .objectKeyThumbnail(uploaded.getObjectKeyThumbnail())
                .ordreAffichage((int) existing)
                .estCouverture(isFirst) // 1ère photo devient cover par défaut
                .tailleOctets(uploaded.getSizeOctets())
                .typeMime(uploaded.getContentType())
                .largeur(uploaded.getLargeur())
                .hauteur(uploaded.getHauteur())
                .build();

        Photo saved = photoRepository.save(toSave);
        log.info("Photo ajoutée à la propriété {} : photoUuid={}", proprieteUuid, saved.getPhotoUuid());
        return saved;
    }

    @Override
    public List<Photo> findByPropriete(String proprieteUuid) {
        Propriete propriete = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        return photoRepository.findByPropriete(propriete.getProprieteId());
    }

    @Override
    @Transactional
    public Photo definirCouverture(String photoUuid, Long userId) {
        Photo photo = photoRepository.findByUuid(photoUuid)
                .orElseThrow(() -> new ApiException("Photo introuvable : " + photoUuid));
        Propriete propriete = proprieteRepository.findById(photo.getProprieteId())
                .orElseThrow(() -> new ApiException("Propriété introuvable"));
        ensureOwner(propriete, userId);

        // Démarque l'éventuelle photo de couverture actuelle, puis marque celle-ci
        photoRepository.unsetCouvertureForPropriete(propriete.getProprieteId());
        return photoRepository.setCouverture(photoUuid)
                .orElseThrow(() -> new ApiException("Échec définition couverture"));
    }

    @Override
    @Transactional
    public void supprimer(String photoUuid, Long userId) {
        Photo photo = photoRepository.findByUuid(photoUuid)
                .orElseThrow(() -> new ApiException("Photo introuvable : " + photoUuid));
        Propriete propriete = proprieteRepository.findById(photo.getProprieteId())
                .orElseThrow(() -> new ApiException("Propriété introuvable"));
        ensureOwner(propriete, userId);

        // Supprime de MinIO (best-effort) puis de la BD
        photoStorageService.deletePhoto(photo.getObjectKey(), photo.getObjectKeyThumbnail());
        photoRepository.deleteByUuid(photoUuid);

        // Si la photo supprimée était la couverture, en désigner une autre (la première restante)
        if (Boolean.TRUE.equals(photo.getEstCouverture())) {
            photoRepository.findByPropriete(propriete.getProprieteId()).stream()
                    .findFirst()
                    .ifPresent(p -> photoRepository.setCouverture(p.getPhotoUuid()));
        }
    }

    @Override
    @Transactional
    public void reordonner(String proprieteUuid, List<String> photoUuidsEnOrdre, Long userId) {
        Propriete propriete = proprieteRepository.findByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        ensureOwner(propriete, userId);

        List<Photo> photos = photoRepository.findByPropriete(propriete.getProprieteId());
        if (photoUuidsEnOrdre.size() != photos.size()) {
            throw new ApiException("Le nombre de photos fourni (" + photoUuidsEnOrdre.size()
                    + ") ne correspond pas au nombre réel (" + photos.size() + ")");
        }
        // Vérifie que chaque UUID appartient bien à cette propriété
        List<String> photosUuidsValides = photos.stream().map(Photo::getPhotoUuid).toList();
        for (String uuid : photoUuidsEnOrdre) {
            if (!photosUuidsValides.contains(uuid)) {
                throw new ApiException("Photo " + uuid + " n'appartient pas à cette propriété");
            }
        }
        // Applique le nouvel ordre
        for (int i = 0; i < photoUuidsEnOrdre.size(); i++) {
            photoRepository.updateOrdre(photoUuidsEnOrdre.get(i), i);
        }
    }

    private void ensureOwner(Propriete propriete, Long userId) {
        // Propriété = publique → 403 si non-owner tente d'agir sur ses photos.
        Optional<ProfilImmo> profil = profilImmoRepository.findByUserId(userId);
        if (profil.isEmpty() || !profil.get().getProfilId().equals(propriete.getProfilId())) {
            throw new ForbiddenException("Vous n'êtes pas propriétaire de cette annonce");
        }
    }
}
