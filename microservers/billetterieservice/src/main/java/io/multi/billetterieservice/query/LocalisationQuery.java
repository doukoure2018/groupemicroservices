package io.multi.billetterieservice.query;


import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Classe contenant toutes les requêtes SQL pour la gestion des localisations.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class LocalisationQuery {

    /**
     * Requête pour insérer une nouvelle localisation.
     */
    public static final String INSERT_LOCALISATION = """
            INSERT INTO localisations (quartier_id, adresse_complete, latitude, longitude, description)
            VALUES (:quartierId, :adresseComplete, :latitude, :longitude, :description)
            RETURNING localisation_id, localisation_uuid, quartier_id, adresse_complete, latitude, longitude, description, created_at, updated_at
            """;

    /**
     * Requête pour mettre à jour une localisation.
     */
    public static final String UPDATE_LOCALISATION = """
            UPDATE localisations
            SET quartier_id = :quartierId,
                adresse_complete = :adresseComplete,
                latitude = :latitude,
                longitude = :longitude,
                description = :description
            WHERE localisation_uuid = :localisationUuid
            RETURNING localisation_id, localisation_uuid, quartier_id, adresse_complete, latitude, longitude, description, created_at, updated_at
            """;

    /**
     * Requête pour supprimer une localisation.
     */
    public static final String DELETE_LOCALISATION = """
            DELETE FROM localisations
            WHERE localisation_uuid = :localisationUuid
            """;

    /**
     * Requête pour récupérer toutes les localisations avec jointures (LEFT JOIN car quartier_id nullable).
     */
    public static final String FIND_ALL_LOCALISATIONS = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            LEFT JOIN quartiers q ON q.quartier_id = l.quartier_id
            LEFT JOIN communes c ON c.commune_id = q.commune_id
            LEFT JOIN villes v ON v.ville_id = c.ville_id
            LEFT JOIN regions r ON r.region_id = v.region_id
            ORDER BY l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations avec un quartier associé.
     */
    public static final String FIND_LOCALISATIONS_WITH_QUARTIER = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            INNER JOIN quartiers q ON q.quartier_id = l.quartier_id
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            ORDER BY r.libelle ASC, v.libelle ASC, c.libelle ASC, q.libelle ASC, l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations sans quartier.
     */
    public static final String FIND_LOCALISATIONS_WITHOUT_QUARTIER = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   NULL AS quartier_uuid, NULL AS quartier_libelle,
                   NULL AS commune_uuid, NULL AS commune_libelle,
                   NULL AS ville_uuid, NULL AS ville_libelle,
                   NULL AS region_uuid, NULL AS region_libelle
            FROM localisations l
            WHERE l.quartier_id IS NULL
            ORDER BY l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations d'un quartier spécifique.
     */
    public static final String FIND_LOCALISATIONS_BY_QUARTIER_UUID = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            INNER JOIN quartiers q ON q.quartier_id = l.quartier_id
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE q.quartier_uuid = :quartierUuid
            ORDER BY l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations d'une commune spécifique.
     */
    public static final String FIND_LOCALISATIONS_BY_COMMUNE_UUID = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            INNER JOIN quartiers q ON q.quartier_id = l.quartier_id
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE c.commune_uuid = :communeUuid
            ORDER BY q.libelle ASC, l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations d'une ville spécifique.
     */
    public static final String FIND_LOCALISATIONS_BY_VILLE_UUID = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            INNER JOIN quartiers q ON q.quartier_id = l.quartier_id
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE v.ville_uuid = :villeUuid
            ORDER BY c.libelle ASC, q.libelle ASC, l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations d'une région spécifique.
     */
    public static final String FIND_LOCALISATIONS_BY_REGION_UUID = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            INNER JOIN quartiers q ON q.quartier_id = l.quartier_id
            INNER JOIN communes c ON c.commune_id = q.commune_id
            INNER JOIN villes v ON v.ville_id = c.ville_id
            INNER JOIN regions r ON r.region_id = v.region_id
            WHERE r.region_uuid = :regionUuid
            ORDER BY v.libelle ASC, c.libelle ASC, q.libelle ASC, l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer une localisation par son UUID.
     */
    public static final String FIND_LOCALISATION_BY_UUID = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            LEFT JOIN quartiers q ON q.quartier_id = l.quartier_id
            LEFT JOIN communes c ON c.commune_id = q.commune_id
            LEFT JOIN villes v ON v.ville_id = c.ville_id
            LEFT JOIN regions r ON r.region_id = v.region_id
            WHERE l.localisation_uuid = :localisationUuid
            """;

    /**
     * Requête pour rechercher des localisations par adresse.
     */
    public static final String SEARCH_LOCALISATIONS_BY_ADDRESS = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle
            FROM localisations l
            LEFT JOIN quartiers q ON q.quartier_id = l.quartier_id
            LEFT JOIN communes c ON c.commune_id = q.commune_id
            LEFT JOIN villes v ON v.ville_id = c.ville_id
            LEFT JOIN regions r ON r.region_id = v.region_id
            WHERE LOWER(l.adresse_complete) LIKE LOWER(:searchTerm)
            ORDER BY l.adresse_complete ASC
            """;

    /**
     * Requête pour récupérer les localisations dans un rayon (utilise les coordonnées).
     */
    public static final String FIND_LOCALISATIONS_NEARBY = """
            SELECT l.localisation_id, l.localisation_uuid, l.quartier_id, l.adresse_complete, 
                   l.latitude, l.longitude, l.description, l.created_at, l.updated_at,
                   q.quartier_uuid, q.libelle AS quartier_libelle,
                   c.commune_uuid, c.libelle AS commune_libelle,
                   v.ville_uuid, v.libelle AS ville_libelle,
                   r.region_uuid, r.libelle AS region_libelle,
                   (6371 * acos(cos(radians(:latitude)) * cos(radians(l.latitude)) * 
                   cos(radians(l.longitude) - radians(:longitude)) + 
                   sin(radians(:latitude)) * sin(radians(l.latitude)))) AS distance
            FROM localisations l
            LEFT JOIN quartiers q ON q.quartier_id = l.quartier_id
            LEFT JOIN communes c ON c.commune_id = q.commune_id
            LEFT JOIN villes v ON v.ville_id = c.ville_id
            LEFT JOIN regions r ON r.region_id = v.region_id
            WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
            HAVING distance <= :radiusKm
            ORDER BY distance ASC
            """;

    /**
     * Requête pour vérifier si une localisation existe par son UUID.
     */
    public static final String EXISTS_BY_UUID = """
            SELECT COUNT(*) > 0
            FROM localisations
            WHERE localisation_uuid = :localisationUuid
            """;

    /**
     * Requête pour vérifier si une adresse existe déjà (case insensitive).
     */
    public static final String EXISTS_BY_ADRESSE = """
            SELECT COUNT(*) > 0
            FROM localisations
            WHERE LOWER(adresse_complete) = LOWER(:adresseComplete)
            """;

    /**
     * Requête pour vérifier si une adresse existe déjà pour une autre localisation.
     */
    public static final String EXISTS_BY_ADRESSE_AND_NOT_UUID = """
            SELECT COUNT(*) > 0
            FROM localisations
            WHERE LOWER(adresse_complete) = LOWER(:adresseComplete)
            AND localisation_uuid != :localisationUuid
            """;

    /**
     * Requête pour récupérer le quartier_id à partir du quartier_uuid.
     */
    public static final String FIND_QUARTIER_ID_BY_UUID = """
            SELECT quartier_id
            FROM quartiers
            WHERE quartier_uuid = :quartierUuid
            """;

    /**
     * Requête pour compter le nombre total de localisations.
     */
    public static final String COUNT_ALL_LOCALISATIONS = """
            SELECT COUNT(*) FROM localisations
            """;

    /**
     * Requête pour compter les localisations avec quartier.
     */
    public static final String COUNT_LOCALISATIONS_WITH_QUARTIER = """
            SELECT COUNT(*) FROM localisations WHERE quartier_id IS NOT NULL
            """;

    /**
     * Requête pour compter les localisations sans quartier.
     */
    public static final String COUNT_LOCALISATIONS_WITHOUT_QUARTIER = """
            SELECT COUNT(*) FROM localisations WHERE quartier_id IS NULL
            """;

    /**
     * Requête pour compter les localisations avec coordonnées GPS.
     */
    public static final String COUNT_LOCALISATIONS_WITH_COORDINATES = """
            SELECT COUNT(*) FROM localisations WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            """;

    /**
     * Requête pour compter le nombre de localisations dans un quartier.
     */
    public static final String COUNT_LOCALISATIONS_BY_QUARTIER = """
            SELECT COUNT(*)
            FROM localisations l
            INNER JOIN quartiers q ON q.quartier_id = l.quartier_id
            WHERE q.quartier_uuid = :quartierUuid
            """;
}
