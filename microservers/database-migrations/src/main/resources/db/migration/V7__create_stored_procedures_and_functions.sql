-- =============================================
-- Stored Procedures
-- =============================================

-- Create a standard user (role = USER)
CREATE OR REPLACE PROCEDURE create_user (
    IN p_user_uuid VARCHAR(40),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_credential_uuid VARCHAR(40),
    IN p_token VARCHAR(40),
    IN p_member_id VARCHAR(40)
)
LANGUAGE PLPGSQL
AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    INSERT INTO users (user_uuid, first_name, last_name, email, username, member_id)
    VALUES (p_user_uuid, p_first_name, p_last_name, p_email, p_username, p_member_id)
    RETURNING user_id INTO v_user_id;

    INSERT INTO credentials (credential_uuid, user_id, password)
    VALUES (p_credential_uuid, v_user_id, p_password);

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, (SELECT roles.role_id FROM roles WHERE roles.name = 'USER'));

    INSERT INTO account_tokens (user_id, token)
    VALUES (v_user_id, p_token);
END;
$$;


-- Create an account with a specific role
CREATE OR REPLACE PROCEDURE create_account (
    IN p_user_uuid VARCHAR(40),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_credential_uuid VARCHAR(40),
    IN p_token VARCHAR(40),
    IN p_member_id VARCHAR(40),
    IN p_role_name VARCHAR(25)
)
LANGUAGE PLPGSQL
AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    INSERT INTO users (user_uuid, first_name, last_name, email, username, member_id)
    VALUES (p_user_uuid, p_first_name, p_last_name, p_email, p_username, p_member_id)
    RETURNING user_id INTO v_user_id;

    INSERT INTO credentials (credential_uuid, user_id, password)
    VALUES (p_credential_uuid, v_user_id, p_password);

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, (SELECT roles.role_id FROM roles WHERE roles.name = p_role_name));

    INSERT INTO account_tokens (user_id, token)
    VALUES (v_user_id, p_token);
END;
$$;


-- =============================================
-- Functions
-- =============================================

-- Enable MFA for a user
CREATE OR REPLACE FUNCTION enable_user_mfa (
    IN p_user_uuid VARCHAR(40),
    IN p_qr_code_secret VARCHAR(50),
    IN p_qr_code_image_uri TEXT
)
RETURNS TABLE(
    qr_code_image_uri TEXT,
    member_id VARCHAR,
    role VARCHAR,
    authorities TEXT,
    account_non_expired BOOLEAN,
    account_non_locked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR,
    enabled BOOLEAN,
    first_name VARCHAR,
    user_id BIGINT,
    image_url VARCHAR,
    last_login TIMESTAMP WITH TIME ZONE,
    last_name VARCHAR,
    mfa BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_uuid VARCHAR,
    phone VARCHAR,
    bio VARCHAR,
    address VARCHAR
)
LANGUAGE PLPGSQL
AS $$
BEGIN
    UPDATE users SET mfa = TRUE, qr_code_secret = p_qr_code_secret, qr_code_image_uri = p_qr_code_image_uri
    WHERE users.user_uuid = p_user_uuid;

    RETURN QUERY
    SELECT u.qr_code_image_uri, u.member_id, r.name AS role, r.authority AS authorities,
           u.account_non_expired, u.account_non_locked, u.created_at, u.email, u.enabled,
           u.first_name, u.user_id, u.image_url, u.last_login, u.last_name, u.mfa,
           u.updated_at, u.user_uuid, u.phone, u.bio, u.address
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.user_uuid = p_user_uuid;
END;
$$;


-- Disable MFA for a user
CREATE OR REPLACE FUNCTION disable_user_mfa (IN p_user_uuid VARCHAR(40))
RETURNS TABLE(
    member_id VARCHAR,
    role VARCHAR,
    authorities TEXT,
    account_non_expired BOOLEAN,
    account_non_locked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR,
    enabled BOOLEAN,
    first_name VARCHAR,
    user_id BIGINT,
    image_url VARCHAR,
    last_login TIMESTAMP WITH TIME ZONE,
    last_name VARCHAR,
    mfa BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_uuid VARCHAR,
    phone VARCHAR,
    bio VARCHAR,
    address VARCHAR
)
LANGUAGE PLPGSQL
AS $$
BEGIN
    UPDATE users SET mfa = FALSE, qr_code_secret = NULL, qr_code_image_uri = NULL
    WHERE users.user_uuid = p_user_uuid;

    RETURN QUERY
    SELECT u.member_id, r.name AS role, r.authority AS authorities,
           u.account_non_expired, u.account_non_locked, u.created_at, u.email, u.enabled,
           u.first_name, u.user_id, u.image_url, u.last_login, u.last_name, u.mfa,
           u.updated_at, u.user_uuid, u.phone, u.bio, u.address
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.user_uuid = p_user_uuid;
END;
$$;


-- Toggle account expired status
CREATE OR REPLACE FUNCTION toggle_account_expired (IN p_user_uuid VARCHAR(40))
RETURNS TABLE(
    qr_code_image_uri TEXT,
    member_id VARCHAR,
    role VARCHAR,
    authorities TEXT,
    account_non_expired BOOLEAN,
    account_non_locked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR,
    enabled BOOLEAN,
    first_name VARCHAR,
    user_id BIGINT,
    image_url VARCHAR,
    last_login TIMESTAMP WITH TIME ZONE,
    last_name VARCHAR,
    mfa BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_uuid VARCHAR,
    phone VARCHAR,
    bio VARCHAR,
    address VARCHAR
)
LANGUAGE PLPGSQL
AS $$
BEGIN
    UPDATE users SET account_non_expired = NOT users.account_non_expired
    WHERE users.user_uuid = p_user_uuid;

    RETURN QUERY
    SELECT u.qr_code_image_uri, u.member_id, r.name AS role, r.authority AS authorities,
           u.account_non_expired, u.account_non_locked, u.created_at, u.email, u.enabled,
           u.first_name, u.user_id, u.image_url, u.last_login, u.last_name, u.mfa,
           u.updated_at, u.user_uuid, u.phone, u.bio, u.address
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.user_uuid = p_user_uuid;
END;
$$;


-- Toggle account locked status
CREATE OR REPLACE FUNCTION toggle_account_locked (IN p_user_uuid VARCHAR(40))
RETURNS TABLE(
    qr_code_image_uri TEXT,
    member_id VARCHAR,
    role VARCHAR,
    authorities TEXT,
    account_non_expired BOOLEAN,
    account_non_locked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR,
    enabled BOOLEAN,
    first_name VARCHAR,
    user_id BIGINT,
    image_url VARCHAR,
    last_login TIMESTAMP WITH TIME ZONE,
    last_name VARCHAR,
    mfa BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_uuid VARCHAR,
    phone VARCHAR,
    bio VARCHAR,
    address VARCHAR
)
LANGUAGE PLPGSQL
AS $$
BEGIN
    UPDATE users SET account_non_locked = NOT users.account_non_locked
    WHERE users.user_uuid = p_user_uuid;

    RETURN QUERY
    SELECT u.qr_code_image_uri, u.member_id, r.name AS role, r.authority AS authorities,
           u.account_non_expired, u.account_non_locked, u.created_at, u.email, u.enabled,
           u.first_name, u.user_id, u.image_url, u.last_login, u.last_name, u.mfa,
           u.updated_at, u.user_uuid, u.phone, u.bio, u.address
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.user_uuid = p_user_uuid;
END;
$$;


-- Toggle account enabled status
CREATE OR REPLACE FUNCTION toggle_account_enabled (IN p_user_uuid VARCHAR(40))
RETURNS TABLE(
    qr_code_image_uri TEXT,
    member_id VARCHAR,
    role VARCHAR,
    authorities TEXT,
    account_non_expired BOOLEAN,
    account_non_locked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR,
    enabled BOOLEAN,
    first_name VARCHAR,
    user_id BIGINT,
    image_url VARCHAR,
    last_login TIMESTAMP WITH TIME ZONE,
    last_name VARCHAR,
    mfa BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_uuid VARCHAR,
    phone VARCHAR,
    bio VARCHAR,
    address VARCHAR
)
LANGUAGE PLPGSQL
AS $$
BEGIN
    UPDATE users SET enabled = NOT users.enabled
    WHERE users.user_uuid = p_user_uuid;

    RETURN QUERY
    SELECT u.qr_code_image_uri, u.member_id, r.name AS role, r.authority AS authorities,
           u.account_non_expired, u.account_non_locked, u.created_at, u.email, u.enabled,
           u.first_name, u.user_id, u.image_url, u.last_login, u.last_name, u.mfa,
           u.updated_at, u.user_uuid, u.phone, u.bio, u.address
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.user_uuid = p_user_uuid;
END;
$$;


-- Update user role
CREATE OR REPLACE FUNCTION update_user_role (IN p_user_uuid VARCHAR(40), IN p_role VARCHAR(25))
RETURNS TABLE(
    qr_code_image_uri TEXT,
    member_id VARCHAR,
    role VARCHAR,
    authorities TEXT,
    account_non_expired BOOLEAN,
    account_non_locked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR,
    enabled BOOLEAN,
    first_name VARCHAR,
    user_id BIGINT,
    image_url VARCHAR,
    last_login TIMESTAMP WITH TIME ZONE,
    last_name VARCHAR,
    mfa BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_uuid VARCHAR,
    phone VARCHAR,
    bio VARCHAR,
    address VARCHAR
)
LANGUAGE PLPGSQL
AS $$
BEGIN
    UPDATE user_roles SET role_id = (SELECT r.role_id FROM roles r WHERE r.name = p_role)
    WHERE user_roles.user_id = (SELECT u.user_id FROM users u WHERE u.user_uuid = p_user_uuid);

    RETURN QUERY
    SELECT u.qr_code_image_uri, u.member_id, r.name AS role, r.authority AS authorities,
           u.account_non_expired, u.account_non_locked, u.created_at, u.email, u.enabled,
           u.first_name, u.user_id, u.image_url, u.last_login, u.last_name, u.mfa,
           u.updated_at, u.user_uuid, u.phone, u.bio, u.address
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    WHERE u.user_uuid = p_user_uuid;
END;
$$;
