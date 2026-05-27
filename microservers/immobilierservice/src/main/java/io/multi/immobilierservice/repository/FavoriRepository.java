package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Favori;
import io.multi.immobilierservice.domain.Propriete;

import java.util.List;
import java.util.Optional;

public interface FavoriRepository {

    /**
     * Ajout idempotent (ON CONFLICT DO NOTHING). Renvoie Optional vide si
     * le favori existait déjà — utile pour ne PAS double-incrémenter le compteur
     * côté client (le trigger BD ne touche que sur insertion effective).
     */
    Optional<Favori> add(Long userId, Long proprieteId);

    /** Renvoie true si une ligne a été effectivement supprimée. */
    boolean remove(Long userId, Long proprieteId);

    boolean isFavorite(Long userId, Long proprieteId);

    List<Propriete> findFavoriteProprietes(Long userId, int limit, int offset);

    long countFavorisOfUser(Long userId);

    /** Lookup propriete_id depuis l'UUID. */
    Optional<Long> lookupProprieteIdByUuid(String proprieteUuid);
}
