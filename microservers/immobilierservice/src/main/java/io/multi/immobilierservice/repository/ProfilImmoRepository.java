package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.ProfilImmo;

import java.util.List;
import java.util.Optional;

public interface ProfilImmoRepository {

    ProfilImmo save(ProfilImmo profil);

    Optional<ProfilImmo> update(ProfilImmo profil);

    Optional<ProfilImmo> updateStatutVerification(String profilUuid, String statut);

    Optional<ProfilImmo> findByUuid(String profilUuid);

    Optional<ProfilImmo> findByUserId(Long userId);

    List<ProfilImmo> findByAgence(Long agenceId);

    void softDelete(String profilUuid);

    void incrementNombreProprietesActives(Long profilId);

    void decrementNombreProprietesActives(Long profilId);
}
