package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.exception.ApiException;
import io.multi.immobilierservice.repository.FavoriRepository;
import io.multi.immobilierservice.repository.PhotoRepository;
import io.multi.immobilierservice.repository.ProfilImmoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.service.FavoriService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriServiceImpl implements FavoriService {

    private final FavoriRepository favoriRepository;
    private final PhotoRepository photoRepository;
    private final ProprieteRepository proprieteRepository;
    private final ProfilImmoRepository profilImmoRepository;

    @Override
    @Transactional
    public boolean ajouter(String proprieteUuid, Long userId) {
        Long proprieteId = favoriRepository.lookupProprieteIdByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));

        // Anti auto-favori : un vendeur ne peut pas ajouter sa propre annonce à ses favoris
        // (sinon nombre_favoris devient biaisé en tant que KPI d'intérêt extérieur).
        Propriete propriete = proprieteRepository.findById(proprieteId)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        Optional<ProfilImmo> userProfil = profilImmoRepository.findByUserId(userId);
        if (userProfil.isPresent() && userProfil.get().getProfilId().equals(propriete.getProfilId())) {
            throw new ApiException("Vous ne pouvez pas ajouter votre propre annonce à vos favoris");
        }

        boolean inserted = favoriRepository.add(userId, proprieteId).isPresent();
        if (inserted) {
            log.debug("Favori ajouté user={} propriete={}", userId, proprieteUuid);
        }
        return inserted;
    }

    @Override
    @Transactional
    public boolean retirer(String proprieteUuid, Long userId) {
        Long proprieteId = favoriRepository.lookupProprieteIdByUuid(proprieteUuid)
                .orElseThrow(() -> new ApiException("Propriété introuvable : " + proprieteUuid));
        return favoriRepository.remove(userId, proprieteId);
    }

    @Override
    public boolean estFavori(String proprieteUuid, Long userId) {
        return favoriRepository.lookupProprieteIdByUuid(proprieteUuid)
                .map(id -> favoriRepository.isFavorite(userId, id))
                .orElse(false);
    }

    @Override
    public List<Propriete> findMesFavoris(Long userId, int limit, int offset) {
        List<Propriete> list = favoriRepository.findFavoriteProprietes(userId, limit, offset);
        // Enrichit avec photo de couverture (idem RechercheService)
        list.forEach(p -> {
            List<Photo> photos = photoRepository.findByPropriete(p.getProprieteId());
            p.setPhotoCouverture(photos.stream()
                    .filter(ph -> Boolean.TRUE.equals(ph.getEstCouverture()))
                    .findFirst()
                    .orElseGet(() -> photos.isEmpty() ? null : photos.get(0)));
            // On sait que c'est un favori (puisque on liste mes favoris)
            p.setIsFavorite(true);
        });
        return list;
    }

    @Override
    public long countMesFavoris(Long userId) {
        return favoriRepository.countFavorisOfUser(userId);
    }
}
