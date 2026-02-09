package io.multi.discoveryserver.query;


public class UserQuery {
    public static final String SELECT_USER_BY_USERNAME_QUERY=
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
                       c.updated_at + INTERVAL '365 day' > NOW() AS credentials_non_expired
                    FROM users u JOIN user_roles ur ON ur.user_id = u.user_id JOIN roles r ON r.role_id = ur.role_id JOIN credentials c ON c.user_id = u.user_id WHERE u.username =:username;
            """;

}

