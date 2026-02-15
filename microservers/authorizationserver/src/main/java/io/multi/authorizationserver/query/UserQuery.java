package io.multi.authorizationserver.query;


public class UserQuery {

    public static final String SELECT_USER_BY_UUID_QUERY=
            """
                SELECT   r.name AS role,
                r.authority AS authorities,
                u.qr_code_image_uri,
                u.member_id,
                u.account_non_expired,
                u.account_non_locked,
                u.created_at,
                u.email,
                u.username,
                u.enabled,
                u.first_name,
                u.user_id,
                u.image_url,
                u.last_login,
                u.last_name,
                u.updated_at,
                u.user_uuid,
                u.bio,
                u.phone,
                u.address,
                c.password,
                c.updated_at + INTERVAL '90 day' > NOW() AS credentials_non_expired
                FROM users u JOIN user_roles ur ON ur.user_id = u.user_id JOIN roles r ON r.role_id = ur.role_id JOIN credentials c ON c.user_id = u.user_id WHERE u.username =:username;
              """;
    public static final String SELECT_USER_BY_EMAIL_QUERY=
            """
              SELECT   r.name AS role,
              r.authority AS authorities,
              u.qr_code_image_uri,
              u.member_id,
              u.account_non_expired,
              u.account_non_locked,
              u.created_at,
              u.email,
              u.username,
              u.enabled,
              u.first_name,
              u.user_id,
              u.image_url,
              u.last_login,
              u.last_name,
              u.updated_at,
              u.user_uuid,
              u.bio,
              u.phone,
              u.address,
              c.password,
              c.updated_at + INTERVAL '90 day' > NOW() AS credentials_non_expired
              FROM users u JOIN user_roles ur ON ur.user_id = u.user_id JOIN roles r ON r.role_id = ur.role_id JOIN credentials c ON c.user_id = u.user_id WHERE u.email =:email;
             """;
    public static final String RESET_LOGIN_ATTEMPTS_QUERY=
            """
               UPDATE users SET login_attempts = 0 WHERE user_uuid = :userUuid
            """;
    public static final String UPDATE_LOGIN_ATTEMPTS_QUERY=
            """
               UPDATE users SET login_attempts = login_attemps + 1 WHERE email = :email
            """;
    public static final String SET_LAST_LOGIN_QUERY=
            """
               UPDATE users SET last_login = NOW() WHERE user_id= :userId
            """;
    public static final String ADD_LOGIN_DEVICE_QUERY=
            """
               INSERT INTO devices (user_id, device, client, ip_address) VALUES (:userId, :device, :client, :ipAddress)
            """;

    // OAuth2 queries
    public static final String SELECT_USER_BY_GOOGLE_ID_QUERY =
            """
            SELECT r.name AS role,
                   r.authority AS authorities,
                   u.qr_code_image_uri,
                   u.member_id,
                   u.account_non_expired,
                   u.account_non_locked,
                   u.created_at,
                   u.email,
                   u.username,
                   u.enabled,
                   u.first_name,
                   u.user_id,
                   u.image_url,
                   u.last_login,
                   u.last_name,
                   u.updated_at,
                   u.user_uuid,
                   u.bio,
                   u.phone,
                   u.address,
                   u.google_id,
                   u.auth_provider,
                   COALESCE(c.password, '') AS password,
                   COALESCE(c.updated_at + INTERVAL '90 day' > NOW(), true) AS credentials_non_expired
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.user_id
            JOIN roles r ON r.role_id = ur.role_id
            LEFT JOIN credentials c ON c.user_id = u.user_id
            WHERE u.google_id = :googleId
            """;

    public static final String FIND_USER_BY_EMAIL_OPTIONAL_QUERY =
            """
            SELECT r.name AS role,
                   r.authority AS authorities,
                   u.qr_code_image_uri,
                   u.member_id,
                   u.account_non_expired,
                   u.account_non_locked,
                   u.created_at,
                   u.email,
                   u.username,
                   u.enabled,
                   u.first_name,
                   u.user_id,
                   u.image_url,
                   u.last_login,
                   u.last_name,
                   u.updated_at,
                   u.user_uuid,
                   u.bio,
                   u.phone,
                   u.address,
                   u.google_id,
                   u.auth_provider,
                   COALESCE(c.password, '') AS password,
                   COALESCE(c.updated_at + INTERVAL '90 day' > NOW(), true) AS credentials_non_expired
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.user_id
            JOIN roles r ON r.role_id = ur.role_id
            LEFT JOIN credentials c ON c.user_id = u.user_id
            WHERE u.email = :email
            """;

    public static final String INSERT_OAUTH2_USER_QUERY =
            """
            INSERT INTO users (user_uuid, email, username, first_name, last_name, image_url,
                               google_id, auth_provider, enabled, account_non_expired, account_non_locked,
                               login_attempts, created_at, updated_at)
            VALUES (gen_random_uuid(), :email, :email, :firstName, :lastName, :imageUrl,
                    :googleId, :authProvider, true, true, true, 0, NOW(), NOW())
            RETURNING user_id, user_uuid
            """;

    public static final String INSERT_USER_ROLE_QUERY =
            """
            INSERT INTO user_roles (user_id, role_id)
            SELECT :userId, role_id FROM roles WHERE name = 'USER'
            """;

    public static final String LINK_GOOGLE_ACCOUNT_QUERY =
            """
            UPDATE users SET google_id = :googleId, auth_provider = 'GOOGLE', updated_at = NOW()
            WHERE user_id = :userId
            """;

    // Local registration queries
    public static final String INSERT_LOCAL_USER_QUERY =
            """
            INSERT INTO users (user_uuid, email, username, first_name, last_name, phone,
                               auth_provider, enabled, account_non_expired, account_non_locked,
                               login_attempts, created_at, updated_at)
            VALUES (gen_random_uuid(), :email, :email, :firstName, :lastName, :phone,
                    'LOCAL', true, true, true, 0, NOW(), NOW())
            RETURNING user_id, user_uuid
            """;

    public static final String INSERT_CREDENTIALS_QUERY =
            """
            INSERT INTO credentials (credential_uuid, user_id, password, created_at, updated_at)
            VALUES (gen_random_uuid(), :userId, :password, NOW(), NOW())
            """;

    public static final String CHECK_EMAIL_EXISTS_QUERY =
            """
            SELECT COUNT(*) FROM users WHERE email = :email
            """;
}
