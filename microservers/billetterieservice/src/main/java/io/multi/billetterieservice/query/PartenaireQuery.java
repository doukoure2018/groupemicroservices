package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant toutes les requêtes SQL pour l'entité Partenaire.
 */
public final class PartenaireQuery {

    private PartenaireQuery() {
        // Classe utilitaire - pas d'instanciation
    }

    // ========== SELECT DE BASE AVEC JOINTURES ==========

    private static final String BASE_SELECT = """
        SELECT 
            p.partenaire_id,
            p.partenaire_uuid,
            p.localisation_id,
            p.nom,
            p.type_partenaire,
            p.raison_sociale,
            p.numero_registre,
            p.telephone,
            p.email,
            p.adresse,
            p.logo_url,
            p.commission_pourcentage,
            p.commission_fixe,
            p.responsable_nom,
            p.responsable_telephone,
            p.statut,
            p.date_debut_partenariat,
            p.date_fin_partenariat,
            p.created_at,
            p.updated_at,
            -- Localisation
            l.localisation_uuid,
            l.adresse_complete AS localisation_adresse_complete,
            l.latitude AS localisation_latitude,
            l.longitude AS localisation_longitude,
            q.libelle AS quartier_libelle,
            c.libelle AS commune_libelle,
            v.libelle AS ville_libelle,
            v.ville_uuid,
            r.libelle AS region_libelle
        FROM partenaires p
        LEFT JOIN localisations l ON p.localisation_id = l.localisation_id
        LEFT JOIN quartiers q ON l.quartier_id = q.quartier_id
        LEFT JOIN communes c ON q.commune_id = c.commune_id
        LEFT JOIN villes v ON c.ville_id = v.ville_id
        LEFT JOIN regions r ON v.region_id = r.region_id
        """;

    // ========== REQUÊTES DE LECTURE ==========

    public static final String FIND_ALL = BASE_SELECT + """
        ORDER BY p.nom ASC
        """;

    public static final String FIND_ALL_ACTIFS = BASE_SELECT + """
        WHERE p.statut = 'ACTIF'
        ORDER BY p.nom ASC
        """;

    public static final String FIND_BY_UUID = BASE_SELECT + """
        WHERE p.partenaire_uuid = :uuid
        """;

    public static final String FIND_BY_ID = BASE_SELECT + """
        WHERE p.partenaire_id = :id
        """;

    public static final String FIND_BY_NOM = BASE_SELECT + """
        WHERE LOWER(p.nom) = LOWER(:nom)
        """;

    public static final String FIND_BY_TYPE = BASE_SELECT + """
        WHERE p.type_partenaire = :typePartenaire
        ORDER BY p.nom ASC
        """;

    public static final String FIND_BY_STATUT = BASE_SELECT + """
        WHERE p.statut = :statut
        ORDER BY p.nom ASC
        """;

    public static final String FIND_BY_VILLE = BASE_SELECT + """
        WHERE v.ville_uuid = :villeUuid
        ORDER BY p.nom ASC
        """;

    public static final String FIND_BY_REGION = BASE_SELECT + """
        WHERE r.region_uuid = :regionUuid
        ORDER BY p.nom ASC
        """;

    public static final String SEARCH = BASE_SELECT + """
        WHERE LOWER(p.nom) LIKE :searchTerm
           OR LOWER(p.raison_sociale) LIKE :searchTerm
           OR LOWER(p.email) LIKE :searchTerm
           OR LOWER(p.telephone) LIKE :searchTerm
           OR LOWER(v.libelle) LIKE :searchTerm
        ORDER BY p.nom ASC
        """;

    public static final String FIND_PARTENARIATS_EXPIRES = BASE_SELECT + """
        WHERE p.date_fin_partenariat IS NOT NULL
          AND p.date_fin_partenariat < CURRENT_DATE
        ORDER BY p.date_fin_partenariat ASC
        """;

    public static final String FIND_PARTENARIATS_EXPIRANT_BIENTOT = BASE_SELECT + """
        WHERE p.statut = 'ACTIF'
          AND p.date_fin_partenariat IS NOT NULL
          AND p.date_fin_partenariat <= CURRENT_DATE + INTERVAL '30 days'
          AND p.date_fin_partenariat >= CURRENT_DATE
        ORDER BY p.date_fin_partenariat ASC
        """;

    // ========== REQUÊTES DE VÉRIFICATION ==========

    public static final String EXISTS_BY_NOM = """
        SELECT COUNT(*) FROM partenaires
        WHERE LOWER(nom) = LOWER(:nom)
        """;

    public static final String EXISTS_BY_NOM_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM partenaires
        WHERE LOWER(nom) = LOWER(:nom)
          AND partenaire_uuid != :excludeUuid
        """;

    public static final String EXISTS_BY_EMAIL = """
        SELECT COUNT(*) FROM partenaires
        WHERE LOWER(email) = LOWER(:email)
        """;

    public static final String EXISTS_BY_EMAIL_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM partenaires
        WHERE LOWER(email) = LOWER(:email)
          AND partenaire_uuid != :excludeUuid
        """;

    public static final String HAS_OFFRES = """
        SELECT COUNT(*) FROM offres o
        WHERE o.partenaire_id = (
            SELECT partenaire_id FROM partenaires WHERE partenaire_uuid = :uuid
        )
        """;

    // ========== REQUÊTES D'ÉCRITURE ==========

    public static final String INSERT = """
        INSERT INTO partenaires (
            localisation_id, nom, type_partenaire, raison_sociale, numero_registre,
            telephone, email, adresse, logo_url, commission_pourcentage, commission_fixe,
            responsable_nom, responsable_telephone, statut,
            date_debut_partenariat, date_fin_partenariat
        ) VALUES (
            :localisationId, :nom, :typePartenaire, :raisonSociale, :numeroRegistre,
            :telephone, :email, :adresse, :logoUrl, :commissionPourcentage, :commissionFixe,
            :responsableNom, :responsableTelephone, :statut,
            :dateDebutPartenariat, :dateFinPartenariat
        )
        RETURNING partenaire_id, partenaire_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE partenaires SET
            localisation_id = :localisationId,
            nom = :nom,
            type_partenaire = :typePartenaire,
            raison_sociale = :raisonSociale,
            numero_registre = :numeroRegistre,
            telephone = :telephone,
            email = :email,
            adresse = :adresse,
            logo_url = :logoUrl,
            commission_pourcentage = :commissionPourcentage,
            commission_fixe = :commissionFixe,
            responsable_nom = :responsableNom,
            responsable_telephone = :responsableTelephone,
            statut = :statut,
            date_debut_partenariat = :dateDebutPartenariat,
            date_fin_partenariat = :dateFinPartenariat
        WHERE partenaire_uuid = :uuid
        RETURNING partenaire_id, created_at, updated_at
        """;

    public static final String UPDATE_STATUT = """
        UPDATE partenaires SET statut = :statut
        WHERE partenaire_uuid = :uuid
        """;

    public static final String UPDATE_COMMISSIONS = """
        UPDATE partenaires SET
            commission_pourcentage = :commissionPourcentage,
            commission_fixe = :commissionFixe
        WHERE partenaire_uuid = :uuid
        """;

    public static final String DELETE_BY_UUID = """
        DELETE FROM partenaires WHERE partenaire_uuid = :uuid
        """;

    // ========== REQUÊTES DE COMPTAGE ==========

    public static final String COUNT_ALL = """
        SELECT COUNT(*) FROM partenaires
        """;

    public static final String COUNT_BY_STATUT = """
        SELECT COUNT(*) FROM partenaires WHERE statut = :statut
        """;

    public static final String COUNT_BY_TYPE = """
        SELECT COUNT(*) FROM partenaires WHERE type_partenaire = :typePartenaire
        """;

    public static final String COUNT_BY_VILLE = """
        SELECT COUNT(*) FROM partenaires p
        LEFT JOIN localisations l ON p.localisation_id = l.localisation_id
        LEFT JOIN quartiers q ON l.quartier_id = q.quartier_id
        LEFT JOIN communes c ON q.commune_id = c.commune_id
        LEFT JOIN villes v ON c.ville_id = v.ville_id
        WHERE v.ville_uuid = :villeUuid
        """;
}