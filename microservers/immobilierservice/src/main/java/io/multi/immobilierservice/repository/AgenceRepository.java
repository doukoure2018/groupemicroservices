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

    // ---------- Onboarding / conformité (V31) ----------

    Optional<Agence> updateOnboarding(Agence agence);

    Optional<Agence> updateDocumentKyc(String agenceUuid, String documentsKycUrl);

    Optional<Agence> soumettreConformite(String agenceUuid);

    List<Agence> findEnValidation(int limit, int offset);

    long countEnValidation();

    Optional<Agence> decisionConformite(String agenceUuid, String statut, String motifRejet);
}
