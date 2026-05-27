package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ProprieteCreateRequest;
import io.multi.immobilierservice.dto.ProprieteUpdateRequest;

import java.util.List;

public interface ProprieteService {

    Propriete create(ProprieteCreateRequest request, Long userId);

    Propriete update(String proprieteUuid, ProprieteUpdateRequest request, Long userId);

    /** Récupère + incrémente le compteur de vues + charge photos/commodités/type. */
    Propriete getByUuid(String proprieteUuid, boolean incrementVues);

    List<Propriete> findMine(Long userId, int limit, int offset);

    Propriete publier(String proprieteUuid, Long userId);

    Propriete retirer(String proprieteUuid, Long userId);

    Propriete marquerVendu(String proprieteUuid, Long userId);

    Propriete marquerLoue(String proprieteUuid, Long userId);

    void supprimer(String proprieteUuid, Long userId);
}
