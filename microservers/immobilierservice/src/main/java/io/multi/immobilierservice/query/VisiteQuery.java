package io.multi.immobilierservice.query;

public final class VisiteQuery {

    private VisiteQuery() {}

    public static final String INSERT_VISITE = """
            INSERT INTO immo_visite (
                propriete_id, visiteur_user_id,
                date_visite, heure_visite, notes_visiteur
            ) VALUES (
                :proprieteId, :visiteurUserId,
                :dateVisite, :heureVisite, :notesVisiteur
            )
            RETURNING *
            """;

    public static final String FIND_BY_UUID = """
            SELECT * FROM immo_visite WHERE visite_uuid = :visiteUuid
            """;

    /** Visites côté visiteur (mes demandes). */
    public static final String FIND_BY_VISITEUR = """
            SELECT * FROM immo_visite WHERE visiteur_user_id = :userId
            ORDER BY date_visite DESC, heure_visite DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_BY_VISITEUR = """
            SELECT COUNT(*) FROM immo_visite WHERE visiteur_user_id = :userId
            """;

    /** Visites côté vendeur (visites planifiées sur ses annonces). */
    public static final String FIND_BY_VENDEUR = """
            SELECT v.* FROM immo_visite v
            INNER JOIN immo_propriete p ON p.propriete_id = v.propriete_id
            INNER JOIN immo_profil prof ON prof.profil_id = p.profil_id
            WHERE prof.user_id = :vendeurUserId
            ORDER BY v.date_visite DESC, v.heure_visite DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_BY_VENDEUR = """
            SELECT COUNT(*) FROM immo_visite v
            INNER JOIN immo_propriete p ON p.propriete_id = v.propriete_id
            INNER JOIN immo_profil prof ON prof.profil_id = p.profil_id
            WHERE prof.user_id = :vendeurUserId
            """;

    public static final String UPDATE_STATUT_CONFIRMER = """
            UPDATE immo_visite SET statut = 'CONFIRMEE', updated_at = CURRENT_TIMESTAMP
            WHERE visite_uuid = :visiteUuid AND statut = 'DEMANDEE'
            RETURNING *
            """;

    public static final String UPDATE_STATUT_EFFECTUER = """
            UPDATE immo_visite SET statut = 'EFFECTUEE',
                                   notes_vendeur = COALESCE(:notesVendeur, notes_vendeur),
                                   updated_at = CURRENT_TIMESTAMP
            WHERE visite_uuid = :visiteUuid AND statut = 'CONFIRMEE'
            RETURNING *
            """;

    public static final String UPDATE_STATUT_ANNULER = """
            UPDATE immo_visite SET statut = 'ANNULEE',
                                   motif_annulation = :motif,
                                   updated_at = CURRENT_TIMESTAMP
            WHERE visite_uuid = :visiteUuid AND statut IN ('DEMANDEE', 'CONFIRMEE')
            RETURNING *
            """;

    /** Récupère le owner user_id du bien (pour autoriser les actions vendeur). */
    public static final String FIND_OWNER_USER_ID = """
            SELECT prof.user_id
            FROM immo_visite v
            INNER JOIN immo_propriete p ON p.propriete_id = v.propriete_id
            INNER JOIN immo_profil prof ON prof.profil_id = p.profil_id
            WHERE v.visite_uuid = :visiteUuid
            """;

    // ── Intermédiation Phase 1 : leads visite back-office (filtrés par lead_statut) ──

    /** Liste back-office des leads visite, enrichie réf/titre propriété (join). */
    public static final String FIND_LEADS_FOR_ADMIN = """
            SELECT v.*, p.reference AS propriete_reference, p.titre AS propriete_titre
            FROM immo_visite v
            INNER JOIN immo_propriete p ON p.propriete_id = v.propriete_id
            WHERE v.lead_statut = :statut
            ORDER BY v.created_at DESC
            LIMIT :limit OFFSET :offset
            """;

    public static final String COUNT_LEADS_FOR_ADMIN = """
            SELECT COUNT(*) FROM immo_visite WHERE lead_statut = :statut
            """;

    /**
     * Mark-traité conditionnel : applique seulement si encore NOUVEAU.
     * Si lead_statut != 'NOUVEAU', 0 ligne mise à jour (RETURNING vide) →
     * n'écrase JAMAIS un traite_par/traite_at déjà posé.
     */
    public static final String UPDATE_LEAD_TRAITE = """
            UPDATE immo_visite SET
                lead_statut = :leadStatut,
                note_admin  = :noteAdmin,
                traite_par  = :adminUserId,
                traite_at   = CURRENT_TIMESTAMP
            WHERE visite_uuid = :visiteUuid
              AND lead_statut = 'NOUVEAU'
            RETURNING *
            """;
}
