package io.multi.billetterieservice.query;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Classe contenant toutes les requêtes SQL pour la gestion des régions.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class RegionQuery {

    /**
     * Requête pour insérer une nouvelle région.
     * Retourne la région créée avec son ID et UUID générés.
     */
    public static final String INSERT_REGION = """
            INSERT INTO regions (libelle, code, actif)
            VALUES (:libelle, :code, :actif)
            RETURNING region_id, region_uuid, libelle, code, actif, created_at, updated_at
            """;

    /**
     * Requête pour mettre à jour le libellé et le code d'une région.
     */
    public static final String UPDATE_REGION = """
            UPDATE regions
            SET libelle = :libelle, code = :code
            WHERE region_uuid = :regionUuid
            RETURNING region_id, region_uuid, libelle, code, actif, created_at, updated_at
            """;

    /**
     * Requête pour activer ou désactiver une région.
     */
    public static final String UPDATE_REGION_STATUS = """
            UPDATE regions
            SET actif = :actif
            WHERE region_uuid = :regionUuid
            RETURNING region_id, region_uuid, libelle, code, actif, created_at, updated_at
            """;

    /**
     * Requête pour récupérer toutes les régions.
     * Triées par libellé en ordre alphabétique.
     */
    public static final String FIND_ALL_REGIONS = """
            SELECT region_id, region_uuid, libelle, code, actif, created_at, updated_at
            FROM regions
            ORDER BY libelle ASC
            """;

    /**
     * Requête pour récupérer uniquement les régions actives.
     * Triées par libellé en ordre alphabétique.
     */
    public static final String FIND_ALL_ACTIVE_REGIONS = """
            SELECT region_id, region_uuid, libelle, code, actif, created_at, updated_at
            FROM regions
            WHERE actif = TRUE
            ORDER BY libelle ASC
            """;

    /**
     * Requête pour récupérer une région par son UUID.
     */
    public static final String FIND_REGION_BY_UUID = """
            SELECT region_id, region_uuid, libelle, code, actif, created_at, updated_at
            FROM regions
            WHERE region_uuid = :regionUuid
            """;

    /**
     * Requête pour récupérer une région par son ID.
     */
    public static final String FIND_REGION_BY_ID = """
            SELECT region_id, region_uuid, libelle, code, actif, created_at, updated_at
            FROM regions
            WHERE region_id = :regionId
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà (pour éviter les doublons).
     */
    public static final String EXISTS_BY_LIBELLE = """
            SELECT COUNT(*) > 0
            FROM regions
            WHERE LOWER(libelle) = LOWER(:libelle)
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà pour une autre région (pour update).
     */
    public static final String EXISTS_BY_LIBELLE_AND_NOT_UUID = """
            SELECT COUNT(*) > 0
            FROM regions
            WHERE LOWER(libelle) = LOWER(:libelle)
            AND region_uuid != :regionUuid
            """;

    /**
     * Requête pour vérifier si une région existe par son UUID.
     */
    public static final String EXISTS_BY_UUID = """
            SELECT COUNT(*) > 0
            FROM regions
            WHERE region_uuid = :regionUuid
            """;

    /**
     * Requête pour compter le nombre total de régions.
     */
    public static final String COUNT_ALL_REGIONS = """
            SELECT COUNT(*)
            FROM regions
            """;

    /**
     * Requête pour compter le nombre de régions actives.
     */
    public static final String COUNT_ACTIVE_REGIONS = """
            SELECT COUNT(*)
            FROM regions
            WHERE actif = TRUE
            """;
}