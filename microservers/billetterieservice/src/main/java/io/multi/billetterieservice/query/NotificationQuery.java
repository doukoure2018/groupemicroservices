package io.multi.billetterieservice.query;

public final class NotificationQuery {

    private NotificationQuery() {}

    public static final String INSERT = """
        INSERT INTO notifications (user_id, type_notification, categorie, titre, message,
                                    envoyee, date_envoi, reference_id, reference_type)
        VALUES (:userId, :typeNotification, :categorie, :titre, :message,
                :envoyee, CURRENT_TIMESTAMP, :referenceId, :referenceType)
        RETURNING notification_id, notification_uuid, created_at
        """;

    public static final String FIND_BY_USER_ID = """
        SELECT notification_id, notification_uuid, user_id, type_notification, categorie,
               titre, message, lue, envoyee, date_envoi, date_lecture,
               reference_id, reference_type, created_at
        FROM notifications
        WHERE user_id = :userId
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """;

    public static final String COUNT_UNREAD = """
        SELECT COUNT(*) FROM notifications
        WHERE user_id = :userId AND lue = false
        """;

    public static final String MARK_AS_READ = """
        UPDATE notifications SET lue = true, date_lecture = CURRENT_TIMESTAMP
        WHERE notification_id = :notificationId AND user_id = :userId
        """;

    public static final String MARK_ALL_AS_READ = """
        UPDATE notifications SET lue = true, date_lecture = CURRENT_TIMESTAMP
        WHERE user_id = :userId AND lue = false
        """;

    public static final String CHECK_EXISTS_BY_REFERENCE = """
        SELECT COUNT(*) FROM notifications
        WHERE user_id = :userId AND reference_id = :referenceId AND reference_type = :referenceType AND categorie = :categorie
        """;
}
