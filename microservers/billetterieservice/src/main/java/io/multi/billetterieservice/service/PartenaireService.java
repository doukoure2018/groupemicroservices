package io.multi.billetterieservice.service;

import io.multi.billetterieservice.domain.Partenaire;
import io.multi.billetterieservice.dto.PartenaireRequest;

import java.math.BigDecimal;
import java.util.List;

/**
 * Interface de service pour la gestion des partenaires.
 */
public interface PartenaireService {

    // ========== LECTURE ==========

    List<Partenaire> getAll();

    List<Partenaire> getAllActifs();

    Partenaire getByUuid(String uuid);

    Partenaire getByNom(String nom);

    List<Partenaire> getByType(String typePartenaire);

    List<Partenaire> getByStatut(String statut);

    List<Partenaire> getByVille(String villeUuid);

    List<Partenaire> getByRegion(String regionUuid);

    List<Partenaire> search(String searchTerm);

    List<Partenaire> getPartenariatsExpires();

    List<Partenaire> getPartenariatsExpirantBientot();

    // ========== ÉCRITURE ==========

    Partenaire create(PartenaireRequest request);

    Partenaire update(String uuid, PartenaireRequest request);

    Partenaire updateStatut(String uuid, String statut);

    Partenaire updateCommissions(String uuid, BigDecimal commissionPourcentage, BigDecimal commissionFixe);

    Partenaire activer(String uuid);

    Partenaire desactiver(String uuid);

    Partenaire suspendre(String uuid);

    Partenaire mettreEnAttente(String uuid);

    void delete(String uuid);

    // ========== STATISTIQUES ==========

    long count();

    long countByStatut(String statut);

    long countByType(String typePartenaire);

    // ========== CALCUL ==========

    /**
     * Calcule la commission pour un montant donné
     */
    BigDecimal calculerCommission(String uuid, BigDecimal montant);
}