package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.ProprieteSearchCriteria;

import java.util.List;
import java.util.Optional;

public interface ProprieteRepository {

    Propriete save(Propriete propriete);

    Optional<Propriete> update(String proprieteUuid, Propriete updates);

    Optional<Propriete> updateStatut(String proprieteUuid, String statut);

    Optional<Propriete> findByUuid(String proprieteUuid);

    Optional<Propriete> findById(Long proprieteId);

    List<Propriete> findByProfil(Long profilId, int limit, int offset);

    void incrementVues(String proprieteUuid);

    /** Lookup localisation_id par uuid (table externe : localisations). */
    Optional<Long> lookupLocalisationIdByUuid(String localisationUuid);

    /** Remplace les commodités d'une propriété. */
    void replaceCommodites(Long proprieteId, List<Long> commoditeIds);

    List<Commodite> findCommoditesOfPropriete(Long proprieteId);

    /** Recherche multi-critères + spatiale (cf. Phase 8). */
    List<Propriete> search(ProprieteSearchCriteria criteria);

    long countSearch(ProprieteSearchCriteria criteria);

    /** Compteur d'annonces actives (PUBLIE + EN_ATTENTE_VALIDATION + RESERVE) — Phase 9. */
    long countActivesForProfil(Long profilId);

    /** Le profil a-t-il déjà publié au moins une fois (toute annonce non-BROUILLON) ? */
    boolean hasAnyNonDraft(Long profilId);

    /** Rejette une annonce : statut=RETIRE + stocke le motif. */
    Optional<Propriete> rejeter(String proprieteUuid, String motif);

    // ---- Phase 9b : job d'expiration ----

    /** Marque atomiquement les rappels J-X et renvoie les lignes effectivement marquées. */
    List<Propriete> markRappelExpirationAndReturn(int joursAvant);

    /** Passe atomiquement en RETIRE les PUBLIE expirées et renvoie les lignes touchées. */
    List<Propriete> expireOutdatedAndReturn();

    /** Renouvelle une annonce (1-clic) pour {@code dureeJours} jours supplémentaires. */
    Optional<Propriete> renouveler(String proprieteUuid, int dureeJours);
}
