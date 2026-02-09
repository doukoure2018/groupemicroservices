package io.multi.billetterieservice.query;

import lombok.experimental.UtilityClass;

/**
 * Requêtes SQL pour l'entité Depart
 */
@UtilityClass
public class DepartQuery {

    public static final String SELECT_BASE = """
        SELECT d.depart_id, d.depart_uuid, d.site_id, d.libelle, d.description,
               d.ordre_affichage, d.actif, d.created_at, d.updated_at,
               s.site_uuid, s.nom AS site_nom, s.type_site AS site_type_site,
               l.localisation_uuid, l.adresse_complete, l.latitude, l.longitude,
               q.libelle AS quartier_libelle,
               c.libelle AS commune_libelle,
               v.ville_uuid, v.libelle AS ville_libelle,
               r.libelle AS region_libelle
        FROM departs d
        INNER JOIN sites s ON d.site_id = s.site_id
        INNER JOIN localisations l ON s.localisation_id = l.localisation_id
        LEFT JOIN quartiers q ON l.quartier_id = q.quartier_id
        LEFT JOIN communes c ON q.commune_id = c.commune_id
        LEFT JOIN villes v ON c.ville_id = v.ville_id
        LEFT JOIN regions r ON v.region_id = r.region_id
        """;

    public static final String FIND_ALL = SELECT_BASE + " ORDER BY d.ordre_affichage ASC, d.libelle ASC";

    public static final String FIND_ALL_ACTIFS = SELECT_BASE +
            " WHERE d.actif = true ORDER BY d.ordre_affichage ASC, d.libelle ASC";

    public static final String FIND_BY_UUID = SELECT_BASE + " WHERE d.depart_uuid = :uuid";

    public static final String FIND_BY_ID = SELECT_BASE + " WHERE d.depart_id = :id";

    public static final String FIND_BY_SITE = SELECT_BASE +
            " WHERE d.site_id = :siteId ORDER BY d.ordre_affichage ASC, d.libelle ASC";

    public static final String FIND_BY_SITE_UUID = SELECT_BASE +
            " WHERE s.site_uuid = :siteUuid ORDER BY d.ordre_affichage ASC, d.libelle ASC";

    public static final String FIND_BY_SITE_UUID_ACTIFS = SELECT_BASE +
            " WHERE s.site_uuid = :siteUuid AND d.actif = true ORDER BY d.ordre_affichage ASC, d.libelle ASC";

    public static final String FIND_BY_VILLE = SELECT_BASE +
            " WHERE v.ville_uuid = :villeUuid AND d.actif = true ORDER BY d.ordre_affichage ASC, d.libelle ASC";

    public static final String SEARCH_BY_LIBELLE = SELECT_BASE +
            " WHERE LOWER(d.libelle) LIKE LOWER(:searchTerm) ORDER BY d.libelle ASC";

    public static final String EXISTS_BY_LIBELLE_AND_SITE = """
        SELECT COUNT(*) FROM departs 
        WHERE LOWER(libelle) = LOWER(:libelle) AND site_id = :siteId
        """;

    public static final String EXISTS_BY_LIBELLE_AND_SITE_EXCLUDING_UUID = """
        SELECT COUNT(*) FROM departs 
        WHERE LOWER(libelle) = LOWER(:libelle) AND site_id = :siteId AND depart_uuid != :excludeUuid
        """;

    public static final String INSERT = """
        INSERT INTO departs (site_id, libelle, description, ordre_affichage, actif)
        VALUES (:siteId, :libelle, :description, :ordreAffichage, :actif)
        RETURNING depart_id, depart_uuid, created_at, updated_at
        """;

    public static final String UPDATE = """
        UPDATE departs SET
            site_id = :siteId,
            libelle = :libelle,
            description = :description,
            ordre_affichage = :ordreAffichage,
            actif = :actif
        WHERE depart_uuid = :uuid
        RETURNING depart_id, depart_uuid, created_at, updated_at
        """;

    public static final String UPDATE_ACTIF = "UPDATE departs SET actif = :actif WHERE depart_uuid = :uuid";

    public static final String DELETE_BY_UUID = "DELETE FROM departs WHERE depart_uuid = :uuid";

    public static final String HAS_ARRIVEES = """
        SELECT COUNT(*) FROM arrivees a
        INNER JOIN departs d ON a.depart_id = d.depart_id
        WHERE d.depart_uuid = :uuid
        """;

    public static final String COUNT_ALL = "SELECT COUNT(*) FROM departs";

    public static final String COUNT_ACTIFS = "SELECT COUNT(*) FROM departs WHERE actif = true";

    public static final String COUNT_BY_SITE = "SELECT COUNT(*) FROM departs WHERE site_id = :siteId";
}