package io.multi.billetterieservice.query;


import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Classe contenant toutes les requêtes SQL pour la gestion des quartiers.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class QuartierQuery {

    /**
     * Requête pour insérer un nouveau quartier.
     */
    public static final String INSERT_QUARTIER = """
            INSERT INTO quartiers (commune_id, libelle, actif)
            VALUES (:communeId, :libelle, :actif)
            RETURNING quartier_id, quartier_uuid, commune_id, libelle, actif, created_at, updated_at
            """;

    /**
     * Requête pour mettre à jour un quartier.
     */
    public static final String UPDATE_QUARTIER = """
            UPDATE quartiers
            SET libelle = :libelle, commune_id = COALESCE(:communeId, commune_id)
            WHERE quartier_uuid = :quartierUuid
            RETURNING quartier_id, quartier_uuid, commune_id, libelle, actif, created_at, updated_at
            """;

    /**
     * Requête pour activer ou désactiver un quartier.
     */
    public static final String UPDATE_QUARTIER_STATUS = """
            UPDATE quartiers
            SET actif = :actif
            WHERE quartier_uuid = :quartierUuid
            RETURNING quartier_id, quartier_uuid, commune_id, libelle, actif, created_at, updated_at
            """;

    /**
     * Requête pour récupérer tous les quartiers avec jointures complètes.
     */
    public static final String FIND_ALL_QUARTIERS = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            ORDER BY r.libelle ASC, v.libelle ASC, c.libelle ASC, q.libelle ASC
            """;

    /**
     * Requête pour récupérer uniquement les quartiers actifs.
     */
    public static final String FIND_ALL_ACTIVE_QUARTIERS = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE q.actif = TRUE
            ORDER BY r.libelle ASC, v.libelle ASC, c.libelle ASC, q.libelle ASC
            """;

    /**
     * Requête pour récupérer les quartiers d'une commune spécifique.
     */
    public static final String FIND_QUARTIERS_BY_COMMUNE_UUID = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE c.commune_uuid = :communeUuid
            ORDER BY q.libelle ASC
            """;

    /**
     * Requête pour récupérer les quartiers actifs d'une commune spécifique.
     */
    public static final String FIND_ACTIVE_QUARTIERS_BY_COMMUNE_UUID = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE c.commune_uuid = :communeUuid AND q.actif = TRUE
            ORDER BY q.libelle ASC
            """;

    /**
     * Requête pour récupérer les quartiers d'une ville spécifique.
     */
    public static final String FIND_QUARTIERS_BY_VILLE_UUID = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE v.ville_uuid = :villeUuid
            ORDER BY c.libelle ASC, q.libelle ASC
            """;

    /**
     * Requête pour récupérer les quartiers d'une région spécifique.
     */
    public static final String FIND_QUARTIERS_BY_REGION_UUID = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE r.region_uuid = :regionUuid
            ORDER BY v.libelle ASC, c.libelle ASC, q.libelle ASC
            """;

    /**
     * Requête pour récupérer un quartier par son UUID.
     */
    public static final String FIND_QUARTIER_BY_UUID = """
            SELECT q.quartier_id, q.quartier_uuid, q.commune_id, q.libelle, q.actif, q.created_at, q.updated_at,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE q.quartier_uuid = :quartierUuid
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà dans une commune.
     */
    public static final String EXISTS_BY_LIBELLE_AND_COMMUNE = """
            SELECT COUNT(*) > 0
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            WHERE LOWER(q.libelle) = LOWER(:libelle) AND c.commune_uuid = :communeUuid
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà dans une commune pour un autre quartier.
     */
    public static final String EXISTS_BY_LIBELLE_AND_COMMUNE_AND_NOT_UUID = """
            SELECT COUNT(*) > 0
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            WHERE LOWER(q.libelle) = LOWER(:libelle) 
            AND c.commune_uuid = :communeUuid
            AND q.quartier_uuid != :quartierUuid
            """;

    /**
     * Requête pour vérifier si un quartier existe par son UUID.
     */
    public static final String EXISTS_BY_UUID = """
            SELECT COUNT(*) > 0
            FROM quartiers
            WHERE quartier_uuid = :quartierUuid
            """;

    /**
     * Requête pour récupérer le commune_id à partir du commune_uuid.
     */
    public static final String FIND_COMMUNE_ID_BY_UUID = """
            SELECT commune_id
            FROM communes
            WHERE commune_uuid = :communeUuid
            """;

    /**
     * Requête pour compter le nombre total de quartiers.
     */
    public static final String COUNT_ALL_QUARTIERS = """
            SELECT COUNT(*) FROM quartiers
            """;

    /**
     * Requête pour compter le nombre de quartiers actifs.
     */
    public static final String COUNT_ACTIVE_QUARTIERS = """
            SELECT COUNT(*) FROM quartiers WHERE actif = TRUE
            """;

    /**
     * Requête pour compter le nombre de quartiers dans une commune.
     */
    public static final String COUNT_QUARTIERS_BY_COMMUNE = """
            SELECT COUNT(*)
            FROM quartiers q
            INNER JOIN communes c ON c.commune_id = q.commune_id
            WHERE c.commune_uuid = :communeUuid
            """;
}
