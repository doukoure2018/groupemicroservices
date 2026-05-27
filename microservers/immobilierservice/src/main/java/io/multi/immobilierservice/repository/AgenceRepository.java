package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.Agence;

import java.util.List;
import java.util.Optional;

public interface AgenceRepository {

    Agence save(Agence agence);

    Optional<Agence> update(Agence agence);

    Optional<Agence> updateStatutVerification(String agenceUuid, String statut);

    Optional<Agence> findByUuid(String agenceUuid);

    Optional<Agence> findById(Long agenceId);

    List<Agence> findAll(int limit, int offset);

    List<Agence> findByProprietaire(Long userId);

    void softDelete(String agenceUuid);

    long count();
}
