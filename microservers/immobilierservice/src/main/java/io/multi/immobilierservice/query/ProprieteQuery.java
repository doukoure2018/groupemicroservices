package io.multi.immobilierservice.query;

public final class ProprieteQuery {

    private ProprieteQuery() {}

    public static final String INSERT_PROPRIETE = """
            INSERT INTO immo_propriete (
                profil_id, agence_id, type_annonce, duree_location, type_bien_id,
                titre, description,
                prix, devise, periode, prix_sur_demande, prix_negociable,
                nombre_chambres, nombre_salles_bain, surface_m2,
                nombre_etages, etage_situation, annee_construction,
                mois_caution, mois_avance, mois_honoraire,
                localisation_id, adresse_complete, latitude, longitude, afficher_adresse_exacte,
                date_disponibilite, statut,
                nom_contact_public, telephone_contact
            ) VALUES (
                :profilId, :agenceId, :typeAnnonce, :dureeLocation, :typeBienId,
                :titre, :description,
                :prix, :devise, :periode, :prixSurDemande, :prixNegociable,
                :nombreChambres, :nombreSallesBain, :surfaceM2,
                :nombreEtages, :etageSituation, :anneeConstruction,
                :moisCaution, :moisAvance, :moisHonoraire,
                :localisationId, :adresseComplete, :latitude, :longitude, :afficherAdresseExacte,
                :dateDisponibilite, :statut,
                :nomContactPublic, :telephoneContact
            )
            RETURNING *
            """;

    public static final String UPDATE_PROPRIETE = """
            UPDATE immo_propriete SET
                titre = COALESCE(:titre, titre),
                description = COALESCE(:description, description),
                duree_location = COALESCE(:dureeLocation, duree_location),
                prix = COALESCE(:prix, prix),
                devise = COALESCE(:devise, devise),
                periode = COALESCE(:periode, periode),
                prix_sur_demande = COALESCE(:prixSurDemande, prix_sur_demande),
                prix_negociable = COALESCE(:prixNegociable, prix_negociable),
                nombre_chambres = COALESCE(:nombreChambres, nombre_chambres),
                nombre_salles_bain = COALESCE(:nombreSallesBain, nombre_salles_bain),
                surface_m2 = COALESCE(:surfaceM2, surface_m2),
                nombre_etages = COALESCE(:nombreEtages, nombre_etages),
                etage_situation = COALESCE(:etageSituation, etage_situation),
                annee_construction = COALESCE(:anneeConstruction, annee_construction),
                mois_caution = COALESCE(:moisCaution, mois_caution),
                mois_avance = COALESCE(:moisAvance, mois_avance),
                mois_honoraire = COALESCE(:moisHonoraire, mois_honoraire),
                localisation_id = COALESCE(:localisationId, localisation_id),
                adresse_complete = COALESCE(:adresseComplete, adresse_complete),
                latitude = COALESCE(:latitude, latitude),
                longitude = COALESCE(:longitude, longitude),
                afficher_adresse_exacte = COALESCE(:afficherAdresseExacte, afficher_adresse_exacte),
                date_disponibilite = COALESCE(:dateDisponibilite, date_disponibilite),
                nom_contact_public = COALESCE(:nomContactPublic, nom_contact_public),
                telephone_contact = COALESCE(:telephoneContact, telephone_contact),
                updated_at = CURRENT_TIMESTAMP
            WHERE propriete_uuid = :proprieteUuid
            RETURNING *
            """;

    public static final String UPDATE_STATUT = """
            UPDATE immo_propriete SET
                statut = :statut,
                date_publication = CASE
                    WHEN :statut IN ('PUBLIE', 'EN_ATTENTE_VALIDATION') AND date_publication IS NULL
                    THEN CURRENT_TIMESTAMP ELSE date_publication
                END,
                date_expiration = CASE
                    WHEN :statut = 'PUBLIE' AND date_expiration IS NULL
                    THEN CURRENT_TIMESTAMP + INTERVAL '60 days'
                    ELSE date_expiration
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE propriete_uuid = :proprieteUuid
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_propriete WHERE propriete_uuid = :proprieteUuid
            """;

    public static final String FIND_BY_ID = """
            SELECT * FROM immo_propriete WHERE propriete_id = :proprieteId
            """;

    public static final String FIND_BY_PROFIL = """
            SELECT * FROM immo_propriete
            WHERE profil_id = :profilId
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    /** Compte des annonces "actives" (consomment un slot de la limite par profil) — Phase 9a. */
    public static final String COUNT_ACTIVES_FOR_PROFIL = """
            SELECT COUNT(*) FROM immo_propriete
            WHERE profil_id = :profilId
              AND statut IN ('PUBLIE', 'EN_ATTENTE_VALIDATION', 'RESERVE')
            """;

    /** Y a-t-il une annonce historique (non BROUILLON) — Phase 9a. */
    public static final String EXISTS_NON_DRAFT_FOR_PROFIL = """
            SELECT EXISTS (
                SELECT 1 FROM immo_propriete
                WHERE profil_id = :profilId
                  AND statut <> 'BROUILLON'
            )
            """;

    /** Rejet admin avec motif (Phase 9a). */
    public static final String UPDATE_MOTIF_REJET = """
            UPDATE immo_propriete SET
                statut = 'RETIRE',
                motif_rejet = :motif,
                updated_at = CURRENT_TIMESTAMP
            WHERE propriete_uuid = :proprieteUuid
            RETURNING *
            """;

    // =========================================================================
    // JOB D'EXPIRATION (Phase 9b)
    // =========================================================================

    /**
     * UPDATE atomique : marque rappel_expiration_envoye_at sur les propriétés
     * PUBLIE qui expirent dans la fenêtre [NOW, NOW + :joursAvant jours] et
     * qui n'ont pas encore reçu de rappel.
     *
     * <p>RETURNING * → on récupère uniquement les lignes effectivement
     * marquées (les autres instances qui tournent en parallèle voient 0).
     * Idempotence garantie au niveau ligne.
     */
    public static final String MARK_RAPPEL_EXPIRATION = """
            UPDATE immo_propriete SET
                rappel_expiration_envoye_at = CURRENT_TIMESTAMP
            WHERE statut = 'PUBLIE'
              AND rappel_expiration_envoye_at IS NULL
              AND date_expiration IS NOT NULL
              AND date_expiration > CURRENT_TIMESTAMP
              AND date_expiration <= CURRENT_TIMESTAMP + (:joursAvant || ' days')::interval
            RETURNING *
            """;

    /**
     * UPDATE atomique : passe en RETIRE les annonces PUBLIE dont date_expiration
     * est dépassée. RETURNING * pour log/notification.
     */
    public static final String EXPIRE_OUTDATED = """
            UPDATE immo_propriete SET
                statut = 'RETIRE',
                updated_at = CURRENT_TIMESTAMP
            WHERE statut = 'PUBLIE'
              AND date_expiration IS NOT NULL
              AND date_expiration <= CURRENT_TIMESTAMP
            RETURNING *
            """;

    /**
     * Renouvellement 1-clic : date_publication = NOW, date_expiration = NOW + N jours,
     * statut → PUBLIE, reset du flag rappel, incrémente compteur de renouvellements.
     * Autorise depuis PUBLIE (avant expiration) et RETIRE (après).
     */
    public static final String RENOUVELER_PROPRIETE = """
            UPDATE immo_propriete SET
                statut = 'PUBLIE',
                date_publication = CURRENT_TIMESTAMP,
                date_expiration = CURRENT_TIMESTAMP + (:dureeJours || ' days')::interval,
                rappel_expiration_envoye_at = NULL,
                nombre_renouvellements = nombre_renouvellements + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE propriete_uuid = :proprieteUuid
              AND statut IN ('PUBLIE', 'RETIRE')
            RETURNING *
            """;

    public static final String INCREMENT_VUES = """
            UPDATE immo_propriete SET nombre_vues = nombre_vues + 1
            WHERE propriete_uuid = :proprieteUuid
            """;

    public static final String LOOKUP_LOCALISATION_ID = """
            SELECT localisation_id FROM localisations WHERE localisation_uuid = :uuid
            """;

    // ---- Commodités liées ----

    public static final String CLEAR_COMMODITES = """
            DELETE FROM immo_propriete_commodite WHERE propriete_id = :proprieteId
            """;

    public static final String INSERT_COMMODITE = """
            INSERT INTO immo_propriete_commodite (propriete_id, commodite_id)
            VALUES (:proprieteId, :commoditeId)
            ON CONFLICT DO NOTHING
            """;

    public static final String FIND_COMMODITES_OF_PROPRIETE = """
            SELECT c.* FROM immo_commodite c
            INNER JOIN immo_propriete_commodite pc ON pc.commodite_id = c.commodite_id
            WHERE pc.propriete_id = :proprieteId
            ORDER BY c.ordre_affichage
            """;

    // =========================================================================
    // RECHERCHE MULTI-CRITÈRES + SPATIALE (Phase 8)
    // =========================================================================
    // Le SQL est construit dynamiquement côté Java (ProprieteRepositoryImpl) :
    // - clauses WHERE optionnelles ajoutées seulement quand un filtre est fourni
    //   (plus simple que `(:p IS NULL OR ...)` qui pose des problèmes de typage
    //   JDBC avec les NULL non typés et les `text[]`)
    // - ORDER BY concaténé depuis une whitelist
    // Une seule requête : ST_Distance dans SELECT, ST_DWithin dans WHERE.
    // =========================================================================

    public static final String SEARCH_FROM = """
            FROM immo_propriete p
            LEFT JOIN immo_type_bien tb ON tb.type_bien_id = p.type_bien_id
            LEFT JOIN localisations loc ON loc.localisation_id = p.localisation_id
            LEFT JOIN quartiers q ON q.quartier_id = loc.quartier_id
            LEFT JOIN communes c ON c.commune_id = q.commune_id
            LEFT JOIN villes v ON v.ville_id = c.ville_id
            WHERE p.statut = 'PUBLIE'
            """;

    /** Calcul de distance — concaténé dans SELECT seulement si lat/lng fournis. */
    public static final String DISTANCE_EXPR =
            "ST_Distance(p.position, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)";

    /** Clause ST_DWithin — concaténée dans WHERE seulement si géo + rayon fournis. */
    public static final String DWITHIN_CLAUSE =
            "ST_DWithin(p.position, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :rayonMeters)";
}
