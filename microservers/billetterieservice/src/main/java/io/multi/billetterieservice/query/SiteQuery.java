package io.multi.billetterieservice.query;

import lombok.experimental.UtilityClass;

/**
 * Requêtes SQL pour l'entité Site
 */
@UtilityClass
public class SiteQuery {

    // V35 : la ville est portée directement par sites.ville_id (prioritaire) ;
    // la chaîne localisation→quartier→commune→ville reste en fallback pour
    // les sites créés avant la migration (COALESCE).
    public static final String SELECT_BASE = """
        SELECT s.site_id, s.site_uuid, s.localisation_id, s.ville_id, s.nom, s.description,
               s.type_site, s.capacite_vehicules, s.telephone, s.email,
               s.horaire_ouverture, s.horaire_fermeture, s.image_url,
               s.actif, s.created_at, s.updated_at,
               l.localisation_uuid, l.adresse_complete, l.latitude, l.longitude,
               l.quartier_id,
               q.quartier_uuid, q.libelle AS quartier_libelle,
               c.commune_uuid, c.libelle AS commune_libelle,
               COALESCE(vs.ville_uuid, v.ville_uuid) AS ville_uuid,
               COALESCE(vs.libelle, v.libelle) AS ville_libelle,
               COALESCE(rs.region_uuid, r.region_uuid) AS region_uuid,
               COALESCE(rs.libelle, r.libelle) AS region_libelle
        FROM sites s
        INNER JOIN localisations l ON s.localisation_id = l.localisation_id
        LEFT JOIN quartiers q ON l.quartier_id = q.quartier_id
        LEFT JOIN communes c ON q.commune_id = c.commune_id
        LEFT JOIN villes v ON c.ville_id = v.ville_id
        LEFT JOIN regions r ON v.region_id = r.region_id
        LEFT JOIN villes vs ON s.ville_id = vs.ville_id
        LEFT JOIN regions rs ON vs.region_id = rs.region_id
        """;

    public static final String FIND_ALL = SELECT_BASE + " ORDER BY s.nom ASC";

    public static final String FIND_ALL_ACTIFS = SELECT_BASE + " WHERE s.actif = true ORDER BY s.nom ASC";

    public static final String FIND_BY_UUID = SELECT_BASE + " WHERE s.site_uuid = :uuid";

    public static final String FIND_BY_ID = SELECT_BASE + " WHERE s.site_id = :id";

    public static final String FIND_BY_TYPE_SITE = SELECT_BASE +
            " WHERE s.type_site = :typeSite AND s.actif = true ORDER BY s.nom ASC";

    public static final String FIND_BY_LOCALISATION = SELECT_BASE +
            " WHERE s.localisation_id = :localisationId ORDER BY s.nom ASC";

    public static final String FIND_BY_VILLE = SELECT_BASE +
            " WHERE COALESCE(vs.ville_uuid, v.ville_uuid) = :villeUuid AND s.actif = true ORDER BY s.nom ASC";

    public static final String FIND_BY_COMMUNE = SELECT_BASE +
            " WHERE c.commune_uuid = :communeUuid AND s.actif = true ORDER BY s.nom ASC";

    public static final String SEARCH_BY_NOM = SELECT_BASE +
            " WHERE LOWER(s.nom) LIKE LOWER(:searchTerm) ORDER BY s.nom ASC";

    public static final String EXISTS_BY_NOM_AND_LOCALISATION = """
        SELECT COUNT(*) FROM sites 
        WHERE LOWER(nom) = LOWER(:nom) AND localisation_id = :localisationId
        """;

    public static final String EXISTS_BY_NOM_AND_LOCALISATION_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM sites 
        WHERE LOWER(nom) = LOWER(:nom) AND localisation_id = :localisationId AND site_uuid != :excludeUuid
        """;

    public static final String INSERT = """
        INSERT INTO sites (localisation_id, ville_id, nom, description, type_site, capacite_vehicules,
                          telephone, email, horaire_ouverture, horaire_fermeture, image_url, actif)
        VALUES (:localisationId, :villeId, :nom, :description, :typeSite, :capaciteVehicules,
                :telephone, :email, :horaireOuverture, :horaireFermeture, :imageUrl, :actif)
        RETURNING site_id, site_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE sites SET
            localisation_id = :localisationId,
            ville_id = :villeId,
            nom = :nom,
            description = :description,
            type_site = :typeSite,
            capacite_vehicules = :capaciteVehicules,
            telephone = :telephone,
            email = :email,
            horaire_ouverture = :horaireOuverture,
            horaire_fermeture = :horaireFermeture,
            image_url = :imageUrl,
            actif = :actif
        WHERE site_uuid = :uuid
        RETURNING site_id, site_uuid, created_at, updated_at
        """;

    public static final String UPDATE_ACTIF = "UPDATE sites SET actif = :actif WHERE site_uuid = :uuid";

    public static final String DELETE_BY_UUID = "DELETE FROM sites WHERE site_uuid = :uuid";

    public static final String HAS_DEPARTS = """
        SELECT COUNT(*) FROM departs d
        INNER JOIN sites s ON d.site_id = s.site_id
        WHERE s.site_uuid = :uuid
        """;

    public static final String HAS_ARRIVEES = """
        SELECT COUNT(*) FROM arrivees a
        INNER JOIN sites s ON a.site_id = s.site_id
        WHERE s.site_uuid = :uuid
        """;

    public static final String COUNT_ALL = "SELECT COUNT(*) FROM sites";

    public static final String COUNT_ACTIFS = "SELECT COUNT(*) FROM sites WHERE actif = true";
}