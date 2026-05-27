package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.ProfilImmo;
import io.multi.immobilierservice.dto.ProfilImmoRequest;

public interface ProfilImmoService {

    ProfilImmo create(ProfilImmoRequest request, Long userId);

    ProfilImmo update(String profilUuid, ProfilImmoRequest request, Long userId);

    ProfilImmo getByUuid(String profilUuid);

    ProfilImmo getByUserId(Long userId);

    ProfilImmo verifier(String profilUuid, String statut);

    void softDelete(String profilUuid, Long userId);
}
