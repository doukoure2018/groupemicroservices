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
}
