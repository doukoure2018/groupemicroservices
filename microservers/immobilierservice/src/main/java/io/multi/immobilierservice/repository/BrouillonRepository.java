package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Brouillon;

import java.util.List;
import java.util.Optional;

public interface BrouillonRepository {

    Brouillon save(Long userId, String donneesJson, int etapeActuelle);

    Optional<Brouillon> update(String brouillonUuid, String donneesJson, int etapeActuelle);

    Optional<Brouillon> findByUuid(String brouillonUuid);

    List<Brouillon> findByUser(Long userId);

    void deleteByUuid(String brouillonUuid);

    void linkPropriete(String brouillonUuid, Long proprieteId);
}
