package io.multi.billetterieservice.query;

/**
 * Classe utilitaire contenant toutes les requêtes SQL pour l'entité Offre.
 * Inclut des jointures complexes avec trajets, véhicules, et utilisateurs.
 */
public final class OffreQuery {

    private OffreQuery() {
        // Classe utilitaire - pas d'instanciation
    }

    // ========== SELECT DE BASE AVEC JOINTURES COMPLÈTES ==========

    private static final String BASE_SELECT = """
        SELECT 
            -- Offre
            o.offre_id,
            o.offre_uuid,
            o.token_offre,
            o.trajet_id,
            o.vehicule_id,
            o.user_id,
            o.date_depart,
            o.heure_depart,
            o.heure_arrivee_estimee,
            o.nombre_places_total,
            o.nombre_places_disponibles,
            o.nombre_places_reservees,
            o.montant,
            o.montant_promotion,
            o.devise,
            o.statut,
            o.niveau_remplissage,
            o.point_rencontre,
            o.conditions,
            o.annulation_autorisee,
            o.delai_annulation_heures,
            o.date_publication,
            o.date_cloture,
            o.date_depart_effectif,
            o.date_arrivee_effective,
            o.created_at,
            o.updated_at,
            -- Trajet
            t.trajet_uuid,
            t.libelle_trajet AS trajet_libelle,
            t.distance_km AS trajet_distance_km,
            t.duree_estimee_minutes AS trajet_duree_minutes,
            -- Départ
            dep.depart_uuid,
            dep.libelle AS depart_libelle,
            sd.nom AS site_depart,
            vd.libelle AS ville_depart_libelle,
            vd.ville_uuid AS ville_depart_uuid,
            rd.libelle AS region_depart_libelle,
            -- Arrivée
            arr.arrivee_uuid,
            arr.libelle AS arrivee_libelle,
            sa.nom AS site_arrivee,
            va.libelle AS ville_arrivee_libelle,
            va.ville_uuid AS ville_arrivee_uuid,
            ra.libelle AS region_arrivee_libelle,
            -- Véhicule
            v.vehicule_uuid,
            v.immatriculation AS vehicule_immatriculation,
            v.marque AS vehicule_marque,
            v.modele AS vehicule_modele,
            v.couleur AS vehicule_couleur,
            v.nombre_places AS vehicule_nombre_places,
            v.climatise AS vehicule_climatise,
            v.statut AS vehicule_statut,
            tv.libelle AS type_vehicule_libelle,
            v.nom_chauffeur,
            v.contact_chauffeur,
            -- Utilisateur
            u.user_uuid,
            u.username AS user_username,
            CONCAT(u.first_name, ' ', u.last_name) AS user_full_name,
            u.email AS user_email,
            u.phone AS user_phone
        FROM offres o
        INNER JOIN trajets t ON o.trajet_id = t.trajet_id
        INNER JOIN departs dep ON t.depart_id = dep.depart_id
        INNER JOIN sites sd ON dep.site_id = sd.site_id
        INNER JOIN localisations ld ON sd.localisation_id = ld.localisation_id
        LEFT JOIN quartiers qd ON ld.quartier_id = qd.quartier_id
        LEFT JOIN communes cd ON qd.commune_id = cd.commune_id
        LEFT JOIN villes vd ON cd.ville_id = vd.ville_id
        LEFT JOIN regions rd ON vd.region_id = rd.region_id
        INNER JOIN arrivees arr ON t.arrivee_id = arr.arrivee_id
        INNER JOIN sites sa ON arr.site_id = sa.site_id
        INNER JOIN localisations la ON sa.localisation_id = la.localisation_id
        LEFT JOIN quartiers qa ON la.quartier_id = qa.quartier_id
        LEFT JOIN communes ca ON qa.commune_id = ca.commune_id
        LEFT JOIN villes va ON ca.ville_id = va.ville_id
        LEFT JOIN regions ra ON va.region_id = ra.region_id
        INNER JOIN vehicules v ON o.vehicule_id = v.vehicule_id
        LEFT JOIN types_vehicules tv ON v.type_vehicule_id = tv.type_vehicule_id
        INNER JOIN users u ON o.user_id = u.user_id
        """;

    // ========== REQUÊTES DE LECTURE ==========

    public static final String FIND_ALL = BASE_SELECT + """
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_ALL_OUVERTES = BASE_SELECT + """
        WHERE o.statut IN ('EN_ATTENTE', 'OUVERT')
          AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_UUID = BASE_SELECT + """
        WHERE o.offre_uuid = :uuid
        """;

    public static final String FIND_BY_ID = BASE_SELECT + """
        WHERE o.offre_id = :id
        """;

    public static final String FIND_BY_TOKEN = BASE_SELECT + """
        WHERE o.token_offre = :token
        """;

    public static final String FIND_BY_TRAJET = BASE_SELECT + """
        WHERE t.trajet_uuid = :trajetUuid
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_VEHICULE = BASE_SELECT + """
        WHERE v.vehicule_uuid = :vehiculeUuid
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_USER = BASE_SELECT + """
        WHERE o.user_id = :userId
        ORDER BY o.created_at DESC
        """;

    public static final String FIND_BY_STATUT = BASE_SELECT + """
        WHERE o.statut = :statut
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_DATE_DEPART = BASE_SELECT + """
        WHERE o.date_depart = :dateDepart
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
        ORDER BY o.heure_depart ASC
        """;

    public static final String FIND_BY_VILLES = BASE_SELECT + """
        WHERE vd.ville_uuid = :villeDepartUuid
          AND va.ville_uuid = :villeArriveeUuid
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
          AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_VILLES_AND_DATE = BASE_SELECT + """
        WHERE vd.ville_uuid = :villeDepartUuid
          AND va.ville_uuid = :villeArriveeUuid
          AND o.date_depart = :dateDepart
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
        ORDER BY o.heure_depart ASC
        """;

    public static final String FIND_AVEC_PLACES_DISPONIBLES = BASE_SELECT + """
        WHERE o.nombre_places_disponibles >= :nombrePlaces
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
          AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_VILLE_DEPART = BASE_SELECT + """
        WHERE vd.ville_uuid = :villeDepartUuid
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
          AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_BY_VILLE_ARRIVEE = BASE_SELECT + """
        WHERE va.ville_uuid = :villeArriveeUuid
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
          AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_AUJOURD_HUI = BASE_SELECT + """
        WHERE o.date_depart = CURRENT_DATE
          AND o.statut IN ('EN_ATTENTE', 'OUVERT', 'EN_COURS')
        ORDER BY o.heure_depart ASC
        """;

    public static final String FIND_A_VENIR = BASE_SELECT + """
        WHERE o.date_depart > CURRENT_DATE
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String FIND_PASSEES = BASE_SELECT + """
        WHERE o.date_depart < CURRENT_DATE
           OR o.statut IN ('TERMINE', 'ANNULE')
        ORDER BY o.date_depart DESC, o.heure_depart DESC
        """;

    public static final String FIND_EN_PROMOTION = BASE_SELECT + """
        WHERE o.montant_promotion IS NOT NULL
          AND o.montant_promotion > 0
          AND o.montant_promotion < o.montant
          AND o.statut IN ('EN_ATTENTE', 'OUVERT')
          AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    public static final String SEARCH = BASE_SELECT + """
        WHERE (
            LOWER(t.libelle_trajet) LIKE :searchTerm
            OR LOWER(vd.libelle) LIKE :searchTerm
            OR LOWER(va.libelle) LIKE :searchTerm
            OR LOWER(sd.nom) LIKE :searchTerm
            OR LOWER(sa.nom) LIKE :searchTerm
            OR LOWER(v.immatriculation) LIKE :searchTerm
            OR LOWER(v.marque) LIKE :searchTerm
        )
        AND o.statut IN ('EN_ATTENTE', 'OUVERT')
        AND o.date_depart >= CURRENT_DATE
        ORDER BY o.date_depart ASC, o.heure_depart ASC
        """;

    // ========== RECHERCHE AVANCÉE ==========

    public static final String RECHERCHE_AVANCEE = BASE_SELECT + """
        WHERE 1=1
        """;

    // ========== REQUÊTES DE VÉRIFICATION ==========

    public static final String EXISTS_BY_TOKEN = """
        SELECT COUNT(*) FROM offres WHERE token_offre = :token
        """;

    public static final String EXISTS_OFFRE_ACTIVE_VEHICULE_DATE = """
        SELECT COUNT(*) FROM offres
        WHERE vehicule_id = (SELECT vehicule_id FROM vehicules WHERE vehicule_uuid = :vehiculeUuid)
          AND date_depart = :dateDepart
          AND statut NOT IN ('ANNULE', 'TERMINE')
        """;

    public static final String EXISTS_OFFRE_ACTIVE_VEHICULE_DATE_EXCLUDING = """
        SELECT COUNT(*) FROM offres
        WHERE vehicule_id = (SELECT vehicule_id FROM vehicules WHERE vehicule_uuid = :vehiculeUuid)
          AND date_depart = :dateDepart
          AND statut NOT IN ('ANNULE', 'TERMINE')
          AND offre_uuid != :excludeUuid
        """;

    public static final String HAS_RESERVATIONS = """
        SELECT COUNT(*) FROM reservations r
        WHERE r.offre_id = (SELECT offre_id FROM offres WHERE offre_uuid = :uuid)
          AND r.statut NOT IN ('ANNULEE', 'REMBOURSEE')
        """;

    public static final String COUNT_RESERVATIONS_CONFIRMEES = """
        SELECT COALESCE(SUM(r.nombre_places), 0) FROM reservations r
        WHERE r.offre_id = (SELECT offre_id FROM offres WHERE offre_uuid = :uuid)
          AND r.statut IN ('CONFIRMEE', 'PAYEE')
        """;

    // ========== REQUÊTES D'ÉCRITURE ==========

    public static final String INSERT = """
        INSERT INTO offres (
            token_offre, trajet_id, vehicule_id, user_id,
            date_depart, heure_depart, heure_arrivee_estimee,
            nombre_places_total, nombre_places_disponibles, nombre_places_reservees,
            montant, montant_promotion, devise, statut, niveau_remplissage,
            point_rencontre, conditions, annulation_autorisee, delai_annulation_heures,
            date_publication
        ) VALUES (
            :tokenOffre, :trajetId, :vehiculeId, :userId,
            :dateDepart, :heureDepart, :heureArriveeEstimee,
            :nombrePlacesTotal, :nombrePlacesDisponibles, :nombrePlacesReservees,
            :montant, :montantPromotion, :devise, :statut, :niveauRemplissage,
            :pointRendezvous, :conditions, :annulationAutorisee, :delaiAnnulationHeures,
            CURRENT_TIMESTAMP
        )
        RETURNING offre_id, offre_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE offres SET
            date_depart = :dateDepart,
            heure_depart = :heureDepart,
            heure_arrivee_estimee = :heureArriveeEstimee,
            nombre_places_total = :nombrePlacesTotal,
            montant = :montant,
            montant_promotion = :montantPromotion,
            devise = :devise,
            point_rencontre = :pointRendezvous,
            conditions = :conditions,
            annulation_autorisee = :annulationAutorisee,
            delai_annulation_heures = :delaiAnnulationHeures
        WHERE offre_uuid = :uuid
        RETURNING offre_id, created_at, updated_at
        """;

    public static final String UPDATE_STATUT = """
        UPDATE offres SET statut = :statut
        WHERE offre_uuid = :uuid
        """;

    public static final String UPDATE_PLACES = """
        UPDATE offres SET
            nombre_places_disponibles = :nombrePlacesDisponibles,
            nombre_places_reservees = :nombrePlacesReservees,
            niveau_remplissage = :niveauRemplissage
        WHERE offre_uuid = :uuid
        """;

    public static final String UPDATE_PROMOTION = """
        UPDATE offres SET montant_promotion = :montantPromotion
        WHERE offre_uuid = :uuid
        """;

    public static final String UPDATE_DATES_EFFECTIVES = """
        UPDATE offres SET
            date_depart_effectif = :dateDepartEffectif,
            date_arrivee_effective = :dateArriveeEffective
        WHERE offre_uuid = :uuid
        """;

    public static final String CLOTURER = """
        UPDATE offres SET
            statut = 'CLOTURE',
            date_cloture = CURRENT_TIMESTAMP
        WHERE offre_uuid = :uuid
        """;

    public static final String DELETE_BY_UUID = """
        DELETE FROM offres WHERE offre_uuid = :uuid
        """;

    // ========== REQUÊTES DE COMPTAGE ==========

    public static final String COUNT_ALL = """
        SELECT COUNT(*) FROM offres
        """;

    public static final String COUNT_BY_STATUT = """
        SELECT COUNT(*) FROM offres WHERE statut = :statut
        """;

    public static final String COUNT_BY_USER = """
        SELECT COUNT(*) FROM offres WHERE user_id = :userId
        """;

    public static final String COUNT_BY_TRAJET = """
        SELECT COUNT(*) FROM offres o
        INNER JOIN trajets t ON o.trajet_id = t.trajet_id
        WHERE t.trajet_uuid = :trajetUuid
        """;

    public static final String COUNT_BY_VEHICULE = """
        SELECT COUNT(*) FROM offres o
        INNER JOIN vehicules v ON o.vehicule_id = v.vehicule_id
        WHERE v.vehicule_uuid = :vehiculeUuid
        """;

    public static final String COUNT_AUJOURD_HUI = """
        SELECT COUNT(*) FROM offres 
        WHERE date_depart = CURRENT_DATE
          AND statut IN ('EN_ATTENTE', 'OUVERT', 'EN_COURS')
        """;

    public static final String COUNT_OUVERTES = """
        SELECT COUNT(*) FROM offres 
        WHERE statut IN ('EN_ATTENTE', 'OUVERT')
          AND date_depart >= CURRENT_DATE
        """;

    // ========== STATISTIQUES ==========

    public static final String STATS_PAR_STATUT = """
        SELECT statut, COUNT(*) as count
        FROM offres
        GROUP BY statut
        ORDER BY count DESC
        """;

    public static final String STATS_PAR_JOUR = """
        SELECT date_depart, COUNT(*) as count
        FROM offres
        WHERE date_depart >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date_depart
        ORDER BY date_depart
        """;

    public static final String STATS_REVENUS_USER = """
        SELECT 
            COALESCE(SUM(o.montant * o.nombre_places_reservees), 0) as revenus_potentiels,
            COALESCE(SUM(CASE WHEN o.statut = 'TERMINE' 
                THEN o.montant * o.nombre_places_reservees ELSE 0 END), 0) as revenus_realises
        FROM offres o
        WHERE o.user_id = :userId
        """;
}