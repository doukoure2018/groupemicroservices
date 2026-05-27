package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Commodite;
import io.multi.immobilierservice.domain.Propriete;

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
}
