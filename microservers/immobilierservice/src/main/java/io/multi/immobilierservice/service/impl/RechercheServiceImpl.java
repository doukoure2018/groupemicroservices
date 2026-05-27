package io.multi.immobilierservice.service.impl;

import io.multi.immobilierservice.domain.Photo;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ProprieteSearchCriteria;
import io.multi.immobilierservice.dto.SearchResult;
import io.multi.immobilierservice.repository.PhotoRepository;
import io.multi.immobilierservice.repository.ProprieteRepository;
import io.multi.immobilierservice.service.RechercheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RechercheServiceImpl implements RechercheService {

    private final ProprieteRepository proprieteRepository;
    private final PhotoRepository photoRepository;

    @Value("${geo.max-rayon-km:100}")
    private double maxRayonKm;

    @Value("${geo.default-rayon-km:5}")
    private double defaultRayonKm;

    @Override
    public SearchResult rechercher(ProprieteSearchCriteria c) {
        // Normalisation rayon
        if (c.getLat() != null && c.getLng() != null) {
            if (c.getRayonKm() == null) c.setRayonKm(defaultRayonKm);
            if (c.getRayonKm() > maxRayonKm) c.setRayonKm(maxRayonKm);
            if (c.getRayonKm() <= 0) c.setRayonKm(defaultRayonKm);
        }
        // Pagination defaults
        if (c.getLimit() == null || c.getLimit() <= 0) c.setLimit(20);
        if (c.getLimit() > 100) c.setLimit(100);
        if (c.getOffset() == null || c.getOffset() < 0) c.setOffset(0);

        List<Propriete> proprietes = proprieteRepository.search(c);
        long total = proprieteRepository.countSearch(c);

        // Enrichit chaque propriété avec sa photo de couverture (rapide, 1 query par item)
        proprietes.forEach(p -> {
            List<Photo> photos = photoRepository.findByPropriete(p.getProprieteId());
            p.setPhotoCouverture(photos.stream()
                    .filter(ph -> Boolean.TRUE.equals(ph.getEstCouverture()))
                    .findFirst()
                    .orElseGet(() -> photos.isEmpty() ? null : photos.get(0)));
        });

        log.debug("Recherche : total={} retournés={} tri={}",
                total, proprietes.size(), c.trierOrDefault());

        return SearchResult.builder()
                .proprietes(proprietes)
                .total(total)
                .limit(c.getLimit())
                .offset(c.getOffset())
                .tri(c.trierOrDefault())
                .build();
    }
}
