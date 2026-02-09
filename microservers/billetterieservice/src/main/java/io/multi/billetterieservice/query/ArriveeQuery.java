package io.multi.billetterieservice.query;

import lombok.experimental.UtilityClass;

/**
 * Requêtes SQL pour l'entité Arrivee
 */
@UtilityClass
public class ArriveeQuery {

    public static final String SELECT_BASE = """
        SELECT a.arrivee_id, a.arrivee_uuid, a.site_id, a.depart_id, a.libelle,
               a.libelle_depart, a.description, a.ordre_affichage, a.actif, 
               a.created_at, a.updated_at,
               -- Site d'arrivée
               s.site_uuid, s.nom AS site_nom, s.type_site AS site_type_site,
               l.localisation_uuid, l.adresse_complete, l.latitude, l.longitude,
               q.libelle AS quartier_libelle,
               c.libelle AS commune_libelle,
               v.ville_uuid, v.libelle AS ville_libelle,
               r.libelle AS region_libelle,
               -- Départ
               d.depart_uuid, d.libelle AS depart_libelle,
               -- Site du départ
               sd.site_uuid AS depart_site_uuid, sd.nom AS depart_site_nom,
               ld.adresse_complete AS depart_adresse_complete,
               ld.latitude AS depart_latitude, ld.longitude AS depart_longitude,
               vd.ville_uuid AS depart_ville_uuid, vd.libelle AS depart_ville_libelle
        FROM arrivees a
        INNER JOIN sites s ON a.site_id = s.site_id
        INNER JOIN localisations l ON s.localisation_id = l.localisation_id
        LEFT JOIN quartiers q ON l.quartier_id = q.quartier_id
        LEFT JOIN communes c ON q.commune_id = c.commune_id
        LEFT JOIN villes v ON c.ville_id = v.ville_id
        LEFT JOIN regions r ON v.region_id = r.region_id
        INNER JOIN departs d ON a.depart_id = d.depart_id
        INNER JOIN sites sd ON d.site_id = sd.site_id
        INNER JOIN localisations ld ON sd.localisation_id = ld.localisation_id
        LEFT JOIN quartiers qd ON ld.quartier_id = qd.quartier_id
        LEFT JOIN communes cd ON qd.commune_id = cd.commune_id
        LEFT JOIN villes vd ON cd.ville_id = vd.ville_id
        """;

    public static final String FIND_ALL = SELECT_BASE + " ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_ALL_ACTIFS = SELECT_BASE +
            " WHERE a.actif = true ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_UUID = SELECT_BASE + " WHERE a.arrivee_uuid = :uuid";

    public static final String FIND_BY_ID = SELECT_BASE + " WHERE a.arrivee_id = :id";

    public static final String FIND_BY_SITE = SELECT_BASE +
            " WHERE a.site_id = :siteId ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_SITE_UUID = SELECT_BASE +
            " WHERE s.site_uuid = :siteUuid ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_DEPART = SELECT_BASE +
            " WHERE a.depart_id = :departId ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_DEPART_UUID = SELECT_BASE +
            " WHERE d.depart_uuid = :departUuid AND a.actif = true ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_VILLE_ARRIVEE = SELECT_BASE +
            " WHERE v.ville_uuid = :villeUuid AND a.actif = true ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_VILLE_DEPART = SELECT_BASE +
            " WHERE vd.ville_uuid = :villeUuid AND a.actif = true ORDER BY a.ordre_affichage ASC, a.libelle ASC";

    public static final String FIND_BY_DEPART_AND_VILLE_ARRIVEE = SELECT_BASE +
            " WHERE d.depart_uuid = :departUuid AND v.ville_uuid = :villeArriveeUuid AND a.actif = true ORDER BY a.ordre_affichage ASC";

    public static final String SEARCH_BY_LIBELLE = SELECT_BASE +
            " WHERE LOWER(a.libelle) LIKE LOWER(:searchTerm) ORDER BY a.libelle ASC";

    public static final String EXISTS_BY_LIBELLE_SITE_DEPART = """
        SELECT COUNT(*) FROM arrivees 
        WHERE LOWER(libelle) = LOWER(:libelle) AND site_id = :siteId AND depart_id = :departId
        """;

    public static final String EXISTS_BY_LIBELLE_SITE_DEPART_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM arrivees 
        WHERE LOWER(libelle) = LOWER(:libelle) AND site_id = :siteId 
        AND depart_id = :departId AND arrivee_uuid != :excludeUuid
        """;

    public static final String INSERT = """
        INSERT INTO arrivees (site_id, depart_id, libelle, libelle_depart, description, ordre_affichage, actif)
        VALUES (:siteId, :departId, :libelle, :libelleDepart, :description, :ordreAffichage, :actif)
        RETURNING arrivee_id, arrivee_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE arrivees SET
            site_id = :siteId,
            depart_id = :departId,
            libelle = :libelle,
            libelle_depart = :libelleDepart,
            description = :description,
            ordre_affichage = :ordreAffichage,
            actif = :actif
        WHERE arrivee_uuid = :uuid
        RETURNING arrivee_id, arrivee_uuid, created_at, updated_at
        """;

    public static final String UPDATE_ACTIF = "UPDATE arrivees SET actif = :actif WHERE arrivee_uuid = :uuid";

    public static final String DELETE_BY_UUID = "DELETE FROM arrivees WHERE arrivee_uuid = :uuid";

    public static final String HAS_TRAJETS = """
        SELECT COUNT(*) FROM trajets t
        INNER JOIN arrivees a ON t.arrivee_id = a.arrivee_id
        WHERE a.arrivee_uuid = :uuid
        """;

    public static final String COUNT_ALL = "SELECT COUNT(*) FROM arrivees";

    public static final String COUNT_ACTIFS = "SELECT COUNT(*) FROM arrivees WHERE actif = true";

    public static final String COUNT_BY_SITE = "SELECT COUNT(*) FROM arrivees WHERE site_id = :siteId";

    public static final String COUNT_BY_DEPART = "SELECT COUNT(*) FROM arrivees WHERE depart_id = :departId";
}