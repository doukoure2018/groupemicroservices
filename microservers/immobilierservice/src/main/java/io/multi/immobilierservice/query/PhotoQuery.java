package io.multi.immobilierservice.query;

public final class PhotoQuery {

    private PhotoQuery() {}

    public static final String INSERT_PHOTO = """
            INSERT INTO immo_photo (
                propriete_id, url, url_thumbnail,
                object_key, object_key_thumbnail,
                ordre_affichage, est_couverture,
                taille_octets, type_mime, largeur, hauteur
            ) VALUES (
                :proprieteId, :url, :urlThumbnail,
                :objectKey, :objectKeyThumbnail,
                :ordreAffichage, :estCouverture,
                :tailleOctets, :typeMime, :largeur, :hauteur
            )
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_photo WHERE photo_uuid = :photoUuid
            """;

    public static final String FIND_BY_PROPRIETE = """
            SELECT * FROM immo_photo
            WHERE propriete_id = :proprieteId
            ORDER BY est_couverture DESC, ordre_affichage ASC, photo_id ASC
            """;

    public static final String COUNT_BY_PROPRIETE = """
            SELECT COUNT(*) FROM immo_photo WHERE propriete_id = :proprieteId
            """;

    public static final String DELETE_BY_UUID = """
            DELETE FROM immo_photo WHERE photo_uuid = :photoUuid
            """;

    /** Démarque toutes les photos d'une propriété comme couverture. */
    public static final String UNSET_COVERTURE = """
            UPDATE immo_photo SET est_couverture = FALSE
            WHERE propriete_id = :proprieteId AND est_couverture = TRUE
            """;

    public static final String SET_COUVERTURE = """
            UPDATE immo_photo SET est_couverture = TRUE
            WHERE photo_uuid = :photoUuid
            RETURNING *
            """;

    public static final String UPDATE_ORDRE = """
            UPDATE immo_photo SET ordre_affichage = :ordre
            WHERE photo_uuid = :photoUuid
            """;
}
