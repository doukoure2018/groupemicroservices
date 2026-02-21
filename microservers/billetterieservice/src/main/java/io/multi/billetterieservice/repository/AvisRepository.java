package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Avis;

import java.util.List;

/**
 * Interface repository pour les avis voyageurs.
 */
public interface AvisRepository {

    List<Avis> findByOffreUuid(String offreUuid);
}
