package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Propriete;

import java.util.List;

public interface FavoriService {

    /** Ajoute idempotent. Renvoie {@code true} si l'ajout a effectivement créé un favori, false si déjà existant. */
    boolean ajouter(String proprieteUuid, Long userId);

    /** Renvoie {@code true} si une ligne a été supprimée. */
    boolean retirer(String proprieteUuid, Long userId);

    boolean estFavori(String proprieteUuid, Long userId);

    List<Propriete> findMesFavoris(Long userId, int limit, int offset);

    long countMesFavoris(Long userId);
}
