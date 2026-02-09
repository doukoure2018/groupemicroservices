package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant toutes les requêtes SQL pour l'entité Vehicule.
 */
public final class VehiculeQuery {

    private VehiculeQuery() {
        // Classe utilitaire - pas d'instanciation
    }

    // ========== SELECT DE BASE AVEC JOINTURES ==========

    private static final String BASE_SELECT = """
        SELECT 
            v.vehicule_id,
            v.vehicule_uuid,
            v.user_id,
            v.type_vehicule_id,
            v.immatriculation,
            v.marque,
            v.modele,
            v.annee_fabrication,
            v.nombre_places,
            v.nom_chauffeur,
            v.contact_chauffeur,
            v.contact_proprietaire,
            v.description,
            v.couleur,
            v.climatise,
            v.image_url,
            v.image_data,
            v.image_type,
            v.document_assurance_url,
            v.date_expiration_assurance,
            v.document_visite_technique_url,
            v.date_expiration_visite,
            v.statut,
            v.note_moyenne,
            v.nombre_avis,
            v.created_at,
            v.updated_at,
            -- Type de véhicule
            tv.type_vehicule_uuid,
            tv.libelle AS type_vehicule_libelle,
            tv.description AS type_vehicule_description,
            tv.capacite_min AS type_vehicule_capacite_min,
            tv.capacite_max AS type_vehicule_capacite_max,
            -- Utilisateur propriétaire
            u.user_uuid,
            u.username AS user_username,
            CONCAT(u.first_name, ' ', u.last_name) AS user_full_name,
            u.email AS user_email,
            u.phone AS user_phone
        FROM vehicules v
        LEFT JOIN types_vehicules tv ON v.type_vehicule_id = tv.type_vehicule_id
        INNER JOIN users u ON v.user_id = u.user_id
        """;

    // ========== REQUÊTES DE LECTURE ==========

    public static final String FIND_ALL = BASE_SELECT + """
        ORDER BY v.created_at DESC
        """;

    public static final String FIND_ALL_ACTIFS = BASE_SELECT + """
        WHERE v.statut = 'ACTIF'
        ORDER BY v.marque ASC, v.modele ASC
        """;

    public static final String FIND_BY_UUID = BASE_SELECT + """
        WHERE v.vehicule_uuid = :uuid
        """;

    public static final String FIND_BY_ID = BASE_SELECT + """
        WHERE v.vehicule_id = :id
        """;

    public static final String FIND_BY_IMMATRICULATION = BASE_SELECT + """
        WHERE UPPER(v.immatriculation) = UPPER(:immatriculation)
        """;

    public static final String FIND_BY_USER = BASE_SELECT + """
        WHERE v.user_id = :userId
        ORDER BY v.created_at DESC
        """;

    public static final String FIND_BY_TYPE_VEHICULE = BASE_SELECT + """
        WHERE tv.type_vehicule_uuid = :typeVehiculeUuid
        ORDER BY v.marque ASC, v.modele ASC
        """;

    public static final String FIND_BY_STATUT = BASE_SELECT + """
        WHERE v.statut = :statut
        ORDER BY v.created_at DESC
        """;

    public static final String FIND_BY_NOMBRE_PLACES_MIN = BASE_SELECT + """
        WHERE v.nombre_places >= :nombrePlacesMin
          AND v.statut = 'ACTIF'
        ORDER BY v.nombre_places ASC
        """;

    public static final String FIND_CLIMATISES = BASE_SELECT + """
        WHERE v.climatise = TRUE
          AND v.statut = 'ACTIF'
        ORDER BY v.marque ASC, v.modele ASC
        """;

    public static final String FIND_ASSURANCE_EXPIREE = BASE_SELECT + """
        WHERE v.date_expiration_assurance IS NOT NULL
          AND v.date_expiration_assurance < CURRENT_DATE
        ORDER BY v.date_expiration_assurance ASC
        """;

    public static final String FIND_VISITE_EXPIREE = BASE_SELECT + """
        WHERE v.date_expiration_visite IS NOT NULL
          AND v.date_expiration_visite < CURRENT_DATE
        ORDER BY v.date_expiration_visite ASC
        """;

    public static final String FIND_DOCUMENTS_EXPIRING_SOON = BASE_SELECT + """
        WHERE v.statut = 'ACTIF'
          AND (
            (v.date_expiration_assurance IS NOT NULL AND v.date_expiration_assurance <= CURRENT_DATE + INTERVAL ':days days')
            OR
            (v.date_expiration_visite IS NOT NULL AND v.date_expiration_visite <= CURRENT_DATE + INTERVAL ':days days')
          )
        ORDER BY LEAST(COALESCE(v.date_expiration_assurance, '9999-12-31'), 
                       COALESCE(v.date_expiration_visite, '9999-12-31')) ASC
        """;

    public static final String SEARCH = BASE_SELECT + """
        WHERE LOWER(v.immatriculation) LIKE :searchTerm
           OR LOWER(v.marque) LIKE :searchTerm
           OR LOWER(v.modele) LIKE :searchTerm
           OR LOWER(v.nom_chauffeur) LIKE :searchTerm
           OR LOWER(tv.libelle) LIKE :searchTerm
        ORDER BY v.marque ASC, v.modele ASC
        """;

    // ========== REQUÊTES DE VÉRIFICATION ==========

    public static final String EXISTS_BY_IMMATRICULATION = """
        SELECT COUNT(*) FROM vehicules
        WHERE UPPER(immatriculation) = UPPER(:immatriculation)
        """;

    public static final String EXISTS_BY_IMMATRICULATION_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM vehicules
        WHERE UPPER(immatriculation) = UPPER(:immatriculation)
          AND vehicule_uuid != :excludeUuid
        """;

    public static final String HAS_OFFRES = """
        SELECT COUNT(*) FROM offres o
        WHERE o.vehicule_id = (
            SELECT vehicule_id FROM vehicules WHERE vehicule_uuid = :uuid
        )
        """;

    // ========== REQUÊTES D'ÉCRITURE ==========

    public static final String INSERT = """
        INSERT INTO vehicules (
            user_id, type_vehicule_id, immatriculation, marque, modele,
            annee_fabrication, nombre_places, nom_chauffeur, contact_chauffeur,
            contact_proprietaire, description, couleur, climatise, image_url,
            document_assurance_url, date_expiration_assurance,
            document_visite_technique_url, date_expiration_visite, statut
        ) VALUES (
            :userId, :typeVehiculeId, :immatriculation, :marque, :modele,
            :anneeFabrication, :nombrePlaces, :nomChauffeur, :contactChauffeur,
            :contactProprietaire, :description, :couleur, :climatise, :imageUrl,
            :documentAssuranceUrl, :dateExpirationAssurance,
            :documentVisiteTechniqueUrl, :dateExpirationVisite, :statut
        )
        RETURNING vehicule_id, vehicule_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE vehicules SET
            type_vehicule_id = :typeVehiculeId,
            immatriculation = :immatriculation,
            marque = :marque,
            modele = :modele,
            annee_fabrication = :anneeFabrication,
            nombre_places = :nombrePlaces,
            nom_chauffeur = :nomChauffeur,
            contact_chauffeur = :contactChauffeur,
            contact_proprietaire = :contactProprietaire,
            description = :description,
            couleur = :couleur,
            climatise = :climatise,
            image_url = :imageUrl,
            document_assurance_url = :documentAssuranceUrl,
            date_expiration_assurance = :dateExpirationAssurance,
            document_visite_technique_url = :documentVisiteTechniqueUrl,
            date_expiration_visite = :dateExpirationVisite,
            statut = :statut
        WHERE vehicule_uuid = :uuid
        RETURNING vehicule_id, created_at, updated_at
        """;

    public static final String UPDATE_STATUT = """
        UPDATE vehicules SET statut = :statut
        WHERE vehicule_uuid = :uuid
        """;

    public static final String UPDATE_IMAGE = """
        UPDATE vehicules SET
            image_url = :imageUrl,
            image_data = :imageData,
            image_type = :imageType
        WHERE vehicule_uuid = :uuid
        """;

    public static final String DELETE_BY_UUID = """
        DELETE FROM vehicules WHERE vehicule_uuid = :uuid
        """;

    // ========== REQUÊTES DE COMPTAGE ==========

    public static final String COUNT_ALL = """
        SELECT COUNT(*) FROM vehicules
        """;

    public static final String COUNT_BY_STATUT = """
        SELECT COUNT(*) FROM vehicules WHERE statut = :statut
        """;

    public static final String COUNT_BY_USER = """
        SELECT COUNT(*) FROM vehicules WHERE user_id = :userId
        """;

    public static final String COUNT_BY_TYPE_VEHICULE = """
        SELECT COUNT(*) FROM vehicules v
        INNER JOIN types_vehicules tv ON v.type_vehicule_id = tv.type_vehicule_id
        WHERE tv.type_vehicule_uuid = :typeVehiculeUuid
        """;

    // ========== STATISTIQUES ==========

    public static final String STATS_BY_STATUT = """
        SELECT statut, COUNT(*) as count
        FROM vehicules
        GROUP BY statut
        ORDER BY statut
        """;

    public static final String STATS_BY_TYPE = """
        SELECT tv.libelle, COUNT(*) as count
        FROM vehicules v
        LEFT JOIN types_vehicules tv ON v.type_vehicule_id = tv.type_vehicule_id
        GROUP BY tv.libelle
        ORDER BY count DESC
        """;
}