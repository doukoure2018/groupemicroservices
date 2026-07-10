package io.multi.immobilierservice.query;

public final class AgenceQuery {

    private AgenceQuery() {}

    public static final String INSERT_AGENCE = """
            INSERT INTO immo_agence (
                nom, raison_sociale, numero_registre, logo_url,
                telephone, email, localisation_id, description,
                site_web, reseaux_sociaux, proprietaire_user_id,
                documents_kyc_url, date_creation_agence
            ) VALUES (
                :nom, :raisonSociale, :numeroRegistre, :logoUrl,
                :telephone, :email, :localisationId, :description,
                :siteWeb, CAST(:reseauxSociauxJson AS JSONB), :proprietaireUserId,
                :documentsKycUrl, :dateCreationAgence
            )
            RETURNING *
            """;

    public static final String UPDATE_AGENCE = """
            UPDATE immo_agence SET
                nom = :nom,
                raison_sociale = :raisonSociale,
                numero_registre = :numeroRegistre,
                logo_url = :logoUrl,
                telephone = :telephone,
                email = :email,
                localisation_id = :localisationId,
                description = :description,
                site_web = :siteWeb,
                reseaux_sociaux = CAST(:reseauxSociauxJson AS JSONB),
                documents_kyc_url = :documentsKycUrl,
                date_creation_agence = :dateCreationAgence,
                updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            RETURNING *
            """;

    public static final String UPDATE_STATUT_VERIFICATION = """
            UPDATE immo_agence SET
                statut_verification = :statut,
                updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_agence WHERE agence_uuid = :agenceUuid
            """;

    public static final String FIND_BY_ID = """
            SELECT * FROM immo_agence WHERE agence_id = :agenceId
            """;

    public static final String FIND_ALL = """
            SELECT * FROM immo_agence
            WHERE actif = TRUE
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String FIND_BY_PROPRIETAIRE = """
            SELECT * FROM immo_agence
            WHERE proprietaire_user_id = :userId AND actif = TRUE
            ORDER BY created_at DESC
            """;

    public static final String DELETE_AGENCE = """
            UPDATE immo_agence SET actif = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            """;

    public static final String COUNT_ALL = """
            SELECT COUNT(*) FROM immo_agence WHERE actif = TRUE
            """;

    // ---------- Onboarding / conformité (V31) ----------

    public static final String UPDATE_ONBOARDING = """
            UPDATE immo_agence SET
                nom = :nom,
                raison_sociale = :raisonSociale,
                numero_registre = :numeroRegistre,
                adresse = :adresse,
                commune_id = :communeId,
                region_id = :regionId,
                email = :email,
                telephone = :telephone,
                telephone_whatsapp = :telephoneWhatsapp,
                description = :description,
                updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            RETURNING *
            """;

    public static final String UPDATE_DOCUMENT_KYC = """
            UPDATE immo_agence SET
                documents_kyc_url = :documentsKycUrl,
                updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            RETURNING *
            """;

    public static final String SOUMETTRE_CONFORMITE = """
            UPDATE immo_agence SET
                statut_verification = 'EN_VALIDATION',
                date_soumission_conformite = CURRENT_TIMESTAMP,
                motif_rejet = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            RETURNING *
            """;

    public static final String FIND_EN_VALIDATION = """
            SELECT * FROM immo_agence
            WHERE statut_verification = 'EN_VALIDATION' AND actif = TRUE
            ORDER BY date_soumission_conformite ASC NULLS LAST
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_EN_VALIDATION = """
            SELECT COUNT(*) FROM immo_agence
            WHERE statut_verification = 'EN_VALIDATION' AND actif = TRUE
            """;

    /** Cibles de diffusion des demandes de besoin (V32) : agences vérifiées par zone. */
    public static final String FIND_VERIFIEES_BY_COMMUNE = """
            SELECT * FROM immo_agence
            WHERE statut_verification = 'VERIFIE' AND actif = TRUE AND commune_id = :communeId
            """;

    public static final String FIND_VERIFIEES_BY_REGION = """
            SELECT * FROM immo_agence
            WHERE statut_verification = 'VERIFIE' AND actif = TRUE AND region_id = :regionId
            """;

    public static final String FIND_VERIFIEES_ALL = """
            SELECT * FROM immo_agence
            WHERE statut_verification = 'VERIFIE' AND actif = TRUE
            """;

    /** Liste des agences enrichie des compteurs d'activité (écran admin). */
    public static final String FIND_ALL_WITH_ACTIVITE = """
            SELECT a.*,
                   c.libelle AS commune_libelle,
                   r.libelle AS region_libelle,
                   (SELECT COUNT(*) FROM immo_propriete p WHERE p.agence_id = a.agence_id) AS nb_annonces_total,
                   (SELECT COUNT(*) FROM immo_propriete p WHERE p.agence_id = a.agence_id AND p.statut = 'PUBLIE') AS nb_annonces_publiees,
                   (SELECT COUNT(*) FROM immo_profil pr WHERE pr.agence_id = a.agence_id AND pr.type_profil = 'AGENT_AGENCE' AND pr.actif = TRUE) AS nb_agents
            FROM immo_agence a
            LEFT JOIN communes c ON c.commune_id = a.commune_id
            LEFT JOIN villes v   ON v.ville_id = c.ville_id
            LEFT JOIN regions r  ON r.region_id = v.region_id
            WHERE a.actif = TRUE
            ORDER BY a.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_ALL_ACTIVES = """
            SELECT COUNT(*) FROM immo_agence WHERE actif = TRUE
            """;

    public static final String DECISION_CONFORMITE = """
            UPDATE immo_agence SET
                statut_verification = :statut,
                motif_rejet = :motifRejet,
                updated_at = CURRENT_TIMESTAMP
            WHERE agence_uuid = :agenceUuid
            RETURNING *
            """;
}
