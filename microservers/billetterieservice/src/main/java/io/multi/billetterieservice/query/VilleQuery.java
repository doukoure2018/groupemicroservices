package io.multi.billetterieservice.query;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Classe contenant toutes les requêtes SQL pour la gestion des villes.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class VilleQuery {

    /**
     * Requête pour insérer une nouvelle ville.
     * Retourne la ville créée avec les informations de la région.
     */
    public static final String INSERT_VILLE = """
            INSERT INTO villes (region_id, libelle, code_postal, actif)
            VALUES (:regionId, :libelle, :codePostal, :actif)
            RETURNING ville_id, ville_uuid, region_id, libelle, code_postal, actif, created_at, updated_at
            """;

    /**
     * Requête pour mettre à jour une ville (libellé, code postal et optionnellement la région).
     */
    public static final String UPDATE_VILLE = """
            UPDATE villes
            SET libelle = :libelle, code_postal = :codePostal, region_id = COALESCE(:regionId, region_id)
            WHERE ville_uuid = :villeUuid
            RETURNING ville_id, ville_uuid, region_id, libelle, code_postal, actif, created_at, updated_at
            """;

    /**
     * Requête pour activer ou désactiver une ville.
     */
    public static final String UPDATE_VILLE_STATUS = """
            UPDATE villes
            SET actif = :actif
            WHERE ville_uuid = :villeUuid
            RETURNING ville_id, ville_uuid, region_id, libelle, code_postal, actif, created_at, updated_at
            """;

    /**
     * Requête pour récupérer toutes les villes avec les informations de la région.
     * Triées par région puis par libellé en ordre alphabétique.
     */
    public static final String FIND_ALL_VILLES = """
            SELECT v.ville_id, v.ville_uuid, v.region_id, v.libelle, v.code_postal, 
                   v.actif, v.created_at, v.updated_at,
                   r.libelle AS region_libelle, r.region_uuid
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            ORDER BY r.libelle ASC, v.libelle ASC
            """;

    /**
     * Requête pour récupérer uniquement les villes actives.
     */
    public static final String FIND_ALL_ACTIVE_VILLES = """
            SELECT v.ville_id, v.ville_uuid, v.region_id, v.libelle, v.code_postal, 
                   v.actif, v.created_at, v.updated_at,
                   r.libelle AS region_libelle, r.region_uuid
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE v.actif = TRUE
            ORDER BY r.libelle ASC, v.libelle ASC
            """;

    /**
     * Requête pour récupérer les villes d'une région spécifique par UUID de région.
     */
    public static final String FIND_VILLES_BY_REGION_UUID = """
            SELECT v.ville_id, v.ville_uuid, v.region_id, v.libelle, v.code_postal, 
                   v.actif, v.created_at, v.updated_at,
                   r.libelle AS region_libelle, r.region_uuid
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE r.region_uuid = :regionUuid
            ORDER BY v.libelle ASC
            """;

    /**
     * Requête pour récupérer les villes actives d'une région spécifique.
     */
    public static final String FIND_ACTIVE_VILLES_BY_REGION_UUID = """
            SELECT v.ville_id, v.ville_uuid, v.region_id, v.libelle, v.code_postal, 
                   v.actif, v.created_at, v.updated_at,
                   r.libelle AS region_libelle, r.region_uuid
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE r.region_uuid = :regionUuid AND v.actif = TRUE
            ORDER BY v.libelle ASC
            """;

    /**
     * Requête pour récupérer une ville par son UUID.
     */
    public static final String FIND_VILLE_BY_UUID = """
            SELECT v.ville_id, v.ville_uuid, v.region_id, v.libelle, v.code_postal, 
                   v.actif, v.created_at, v.updated_at,
                   r.libelle AS region_libelle, r.region_uuid
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE v.ville_uuid = :villeUuid
            """;

    /**
     * Requête pour récupérer une ville par son ID (sans jointure, pour les opérations internes).
     */
    public static final String FIND_VILLE_BY_ID = """
            SELECT ville_id, ville_uuid, region_id, libelle, code_postal, actif, created_at, updated_at
            FROM villes
            WHERE ville_id = :villeId
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà dans une région.
     */
    public static final String EXISTS_BY_LIBELLE_AND_REGION = """
            SELECT COUNT(*) > 0
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE LOWER(v.libelle) = LOWER(:libelle) AND r.region_uuid = :regionUuid
            """;

    /**
     * Requête pour vérifier si un libellé existe déjà dans une région pour une autre ville (pour update).
     */
    public static final String EXISTS_BY_LIBELLE_AND_REGION_AND_NOT_UUID = """
            SELECT COUNT(*) > 0
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE LOWER(v.libelle) = LOWER(:libelle) 
            AND r.region_uuid = :regionUuid
            AND v.ville_uuid != :villeUuid
            """;

    /**
     * Requête pour vérifier si une ville existe par son UUID.
     */
    public static final String EXISTS_BY_UUID = """
            SELECT COUNT(*) > 0
            FROM villes
            WHERE ville_uuid = :villeUuid
            """;

    /**
     * Requête pour récupérer le region_id à partir du region_uuid.
     */
    public static final String FIND_REGION_ID_BY_UUID = """
            SELECT region_id
            FROM regions
            WHERE region_uuid = :regionUuid
            """;

    /**
     * Requête pour compter le nombre total de villes.
     */
    public static final String COUNT_ALL_VILLES = """
            SELECT COUNT(*)
            FROM villes
            """;

    /**
     * Requête pour compter le nombre de villes actives.
     */
    public static final String COUNT_ACTIVE_VILLES = """
            SELECT COUNT(*)
            FROM villes
            WHERE actif = TRUE
            """;

    /**
     * Requête pour compter le nombre de villes dans une région.
     */
    public static final String COUNT_VILLES_BY_REGION = """
            SELECT COUNT(*)
            FROM villes v
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE r.region_uuid = :regionUuid
            """;
}