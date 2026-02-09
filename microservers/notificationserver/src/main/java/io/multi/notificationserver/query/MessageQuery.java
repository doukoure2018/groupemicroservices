package io.multi.notificationserver.query;


public class MessageQuery {

    public static final String CREATE_MESSAGE_FUNCTION =
            """
            SELECT * FROM create_message(:messageUuid, :fromUserUuid, :toEmail, :message, :conversationId)
            """;
    public static final String SELECT_MESSAGES_QUERY=
            """
               SELECT
                       s.user_uuid AS sender_uuid,
                       s.first_name AS sender_first_name,
                       s.last_name AS sender_last_name,
                       s.email AS sender_email,
                       s.image_url AS sender_image_url,
                       r.user_uuid AS receiver_uuid,
                       r.first_name AS receiver_first_name,
                       r.last_name AS receiver_last_name,
                       r.email AS receiver_email,
                       r.image_url AS receiver_image_url,
                       m.message_id, m.message_uuid,
                       m.subject,
                       m.message,
                       m.conversation_id,
                       ms.message_status AS status,
                       m.created_at,
                       m.updated_at FROM messages m JOIN users s ON m.sender_id = s.user_id JOIN users r ON m.receiver_id = r.user_id JOIN message_statuses ms ON (ms.user_id = (SELECT user_id FROM users WHERE user_uuid = :userUuid) AND ms.message_id = :messageId) WHERE s.user_uuid = :userUuid OR r.user_uuid = :userUuid ORDER BY m.created_at DESC
            """;
    public static final String SELECT_MESSAGES_BY_CONVERSATION_ID_QUERY=
            """
               SELECT
                       s.user_uuid AS sender_uuid,
                       s.first_name AS sender_first_name,
                       s.last_name AS sender_last_name,
                       s.email AS sender_email,
                       s.image_url AS sender_image_url,
                       r.user_uuid AS receiver_uuid,
                       r.first_name AS receiver_first_name,
                       r.last_name AS receiver_last_name,
                       r.email AS receiver_email,
                       r.image_url AS receiver_image_url,
                       m.message_id, m.message_uuid,
                       m.subject,
                       m.message,
                       m.conversation_id,
                       ms.message_status AS status,
                       m.created_at,
                       m.updated_at FROM messages m JOIN users s ON m.sender_id = s.user_id JOIN users r ON m.receiver_id = r.user_id JOIN message_statuses ms ON (ms.user_id = (SELECT user_id FROM users WHERE user_uuid = :userUuid) AND ms.message_id = :messageId) WHERE (s.user_uuid = :userUuid OR r.user_uuid = :userUuid) AND m.conversation_id = :conversationId ORDER BY m.created_at DESC
            """;

    public static final String  SELECT_MESSAGES_STATUS_QUERY =
            """
             SELECT ms.message_status FROM message_statuses ms WHERE ms.user_id = (SELECT u.user_id FROM users u WHERE u.user_uuid = :userUuid) AND ms.message_id = :messageId
            """;

    public static final String  UPDATE_MESSAGES_STATUS_QUERY =
            """
             UPDATE message_statuses SET message_status = :status WHERE user_id = (SELECT u.user_id FROM users u WHERE u.user_uuid = :userUuid) AND message_id = :messageId
            """;

    public static final String SELECT_MESSAGE_COUNT_QUERY =
            """
            SELECT COUNT(m.message_id) FROM messages m JOIN users s ON m.sender_id = s.user_id JOIN users r ON m.receiver_id = r.user_id WHERE (s.user_uuid = :userUuid AND r.email = :toEmail) OR (s.email = :toEmail AND r.user_uuid = :userUuid)
            """;

    public static final String SELECT_CONVERSATION_ID_QUERY =
            """
            SELECT m.message_id FROM messages m JOIN users s ON m.sender_id = s.user_id JOIN users r ON m.receiver_id = r.user_id WHERE (s.user_uuid = :userUuid AND r.email = :toEmail) OR (s.email = :toEmail AND r.user_uuid = :userUuid) LIMIT 1
            """;

}
