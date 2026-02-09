package io.multi.billetterieservice.repository;

import io.multi.billetterieservice.domain.Partenaire;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Interface Repository pour l'entité Partenaire.
 */
public interface PartenaireRepository {

    // ========== LECTURE ==========

    List<Partenaire> findAll();

    List<Partenaire> findAllActifs();

    Optional<Partenaire> findByUuid(String uuid);

    Optional<Partenaire> findById(Long id);

    Optional<Partenaire> findByNom(String nom);

    List<Partenaire> findByType(String typePartenaire);

    List<Partenaire> findByStatut(String statut);

    List<Partenaire> findByVille(String villeUuid);

    List<Partenaire> findByRegion(String regionUuid);

    List<Partenaire> search(String searchTerm);

    List<Partenaire> findPartenariatsExpires();

    List<Partenaire> findPartenariatsExpirantBientot();

    // ========== VÉRIFICATION ==========

    boolean existsByNom(String nom);

    boolean existsByNomExcludingUuid(String nom, String excludeUuid);

    boolean existsByEmail(String email);

    boolean existsByEmailExcludingUuid(String email, String excludeUuid);

    boolean hasOffres(String uuid);

    // ========== ÉCRITURE ==========

    Partenaire save(Partenaire partenaire);

    Partenaire update(Partenaire partenaire);

    int updateStatut(String uuid, String statut);

    int updateCommissions(String uuid, BigDecimal commissionPourcentage, BigDecimal commissionFixe);

    int deleteByUuid(String uuid);

    // ========== COMPTAGE ==========

    long count();

    long countByStatut(String statut);

    long countByType(String typePartenaire);

    long countByVille(String villeUuid);
}