package io.multi.immobilierservice.service;

import io.multi.immobilierservice.domain.Brouillon;
import io.multi.immobilierservice.domain.Propriete;
import io.multi.immobilierservice.dto.BrouillonSaveRequest;

import java.util.List;

public interface BrouillonService {

    Brouillon create(BrouillonSaveRequest request, Long userId);

    Brouillon update(String brouillonUuid, BrouillonSaveRequest request, Long userId);

    Brouillon getByUuid(String brouillonUuid, Long userId);

    List<Brouillon> findMine(Long userId);

    void supprimer(String brouillonUuid, Long userId);

    /**
     * Convertit le brouillon en {@link Propriete} (statut=BROUILLON) puis supprime
     * le brouillon. Le frontend utilisera ensuite l'API propriétés (Phase 6) pour
     * uploader les photos puis {@code PATCH /immo/proprietes/{uuid}/publier}
     * pour la publication finale.
     */
    Propriete materialiser(String brouillonUuid, Long userId);
}
