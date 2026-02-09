package io.multi.billetterieservice.query;


import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Classe contenant toutes les requêtes SQL pour la gestion des communes.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class CommuneQuery {

    /**
     * Requête pour insérer une nouvelle commune.
     */
    public static final String INSERT_COMMUNE = """
            INSERT INTO communes (ville_id, libelle, actif)
            VALUES (:villeId, :libelle, :actif)
            RETURNING commune_id, commune_uuid, ville_id, libelle, actif, created_at, updated_at
            """;

    /**
     * Requête pour mettre à jour une commune.
     */
    public static final String UPDATE_COMMUNE = """
            UPDATE communes
            SET libelle = :libelle, ville_id = COALESCE(:villeId, ville_id)
            WHERE commune_uuid = :communeUuid
            RETURNING commune_id, commune_uuid, ville_id, libelle, actif, created_at, updated_at
            """;

    /**
     * Requête pour activer ou désactiver une commune.
     */
    public static final String UPDATE_COMMUNE_STATUS = """
            UPDATE communes
            SET actif = :actif
            WHERE commune_uuid = :communeUuid
            RETURNING commune_id, commune_uuid, ville_id, libelle, actif, created_at, updated_at
            """;

    /**
     * Requête pour récupérer toutes les communes avec jointures.
     */
    public static final String FIND_ALL_COMMUNES = """
            SELECT c.commune_id, c.commune_uuid, c.ville_id, c.libelle, c.actif, c.created_at, c.updated_at,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            ORDER BY r.libelle ASC, v.libelle ASC, c.libelle ASC
            """;

    /**
     * Requête pour récupérer uniquement les communes actives.
     */
    public static final String FIND_ALL_ACTIVE_COMMUNES = """
            SELECT c.commune_id, c.commune_uuid, c.ville_id, c.libelle, c.actif, c.created_at, c.updated_at,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE c.actif = TRUE
            ORDER BY r.libelle ASC, v.libelle ASC, c.libelle ASC
            """;

    /**
     * Requête pour récupérer les communes d'une ville spécifique.
     */
    public static final String FIND_COMMUNES_BY_VILLE_UUID = """
            SELECT c.commune_id, c.commune_uuid, c.ville_id, c.libelle, c.actif, c.created_at, c.updated_at,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE v.ville_uuid = :villeUuid
            ORDER BY c.libelle ASC
            """;

    /**
     * Requête pour récupérer les communes actives d'une ville spécifique.
     */
    public static final String FIND_ACTIVE_COMMUNES_BY_VILLE_UUID = """
            SELECT c.commune_id, c.commune_uuid, c.ville_id, c.libelle, c.actif, c.created_at, c.updated_at,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE v.ville_uuid = :villeUuid AND c.actif = TRUE
            ORDER BY c.libelle ASC
            """;

    /**
     * Requête pour récupérer les communes d'une région spécifique.
     */
    public static final String FIND_COMMUNES_BY_REGION_UUID = """
            SELECT c.commune_id, c.commune_uuid, c.ville_id, c.libelle, c.actif, c.created_at, c.updated_at,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE r.region_uuid = :regionUuid
            ORDER BY v.libelle ASC, c.libelle ASC
            """;

    /**
     * Requête pour récupérer une commune par son UUID.
     */
    public static final String FIND_COMMUNE_BY_UUID = """
            SELECT c.commune_id, c.commune_uuid, c.ville_id, c.libelle, c.actif, c.created_at, c.updated_at,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE c.commune_uuid = :communeUuid
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà dans une ville.
     */
    public static final String EXISTS_BY_LIBELLE_AND_VILLE = """
            SELECT COUNT(*) > 0
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            WHERE LOWER(c.libelle) = LOWER(:libelle) AND v.ville_uuid = :villeUuid
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà dans une ville pour une autre commune.
     */
    public static final String EXISTS_BY_LIBELLE_AND_VILLE_AND_NOT_UUID = """
            SELECT COUNT(*) > 0
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            WHERE LOWER(c.libelle) = LOWER(:libelle) 
            AND v.ville_uuid = :villeUuid
            AND c.commune_uuid != :communeUuid
            """;

    /**
     * Requête pour vérifier si une commune existe par son UUID.
     */
    public static final String EXISTS_BY_UUID = """
            SELECT COUNT(*) > 0
            FROM communes
            WHERE commune_uuid = :communeUuid
            """;

    /**
     * Requête pour récupérer le ville_id à partir du ville_uuid.
     */
    public static final String FIND_VILLE_ID_BY_UUID = """
            SELECT ville_id
            FROM villes
            WHERE ville_uuid = :villeUuid
            """;

    /**
     * Requête pour compter le nombre total de communes.
     */
    public static final String COUNT_ALL_COMMUNES = """
            SELECT COUNT(*) FROM communes
            """;

    /**
     * Requête pour compter le nombre de communes actives.
     */
    public static final String COUNT_ACTIVE_COMMUNES = """
            SELECT COUNT(*) FROM communes WHERE actif = TRUE
            """;

    /**
     * Requête pour compter le nombre de communes dans une ville.
     */
    public static final String COUNT_COMMUNES_BY_VILLE = """
            SELECT COUNT(*)
            FROM communes c
            INNER JOIN villes v ON v.ville_id = c.ville_id
            WHERE v.ville_uuid = :villeUuid
            """;
}