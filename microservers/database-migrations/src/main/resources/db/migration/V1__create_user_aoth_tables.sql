CREATE TABLE IF NOT EXISTS oauth2_registered_client (
                                                        id VARCHAR(100) PRIMARY KEY,
    client_id VARCHAR(100) NOT NULL,
    client_id_issued_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                         client_secret VARCHAR(200) DEFAULT NULL,
    client_secret_expires_at TIMESTAMP(6) WITH TIME ZONE DEFAULT NULL,
                                         client_name VARCHAR(200) NOT NULL,
    client_authentication_methods VARCHAR(1000) NOT NULL,
    authorization_grant_types VARCHAR(1000) NOT NULL,
    redirect_uris VARCHAR(1000) DEFAULT NULL,
    post_logout_redirect_uris VARCHAR(1000) DEFAULT NULL,
    scopes VARCHAR(1000) NOT NULL,
    client_settings VARCHAR(2000) NOT NULL,
    token_settings VARCHAR(2000) NOT NULL
    );



CREATE TABLE IF NOT EXISTS users (
                                     user_id BIGSERIAL PRIMARY KEY,
                                     user_uuid VARCHAR(40) NOT NULL,
    username VARCHAR(25) NOT NULL,
    first_name VARCHAR(25) NOT NULL,
    last_name VARCHAR(25) NOT NULL,
    email VARCHAR(40) NOT NULL,
    member_id VARCHAR(40) NOT NULL,
    phone VARCHAR(15) DEFAULT NULL,
    address VARCHAR(100) DEFAULT NULL,
    bio VARCHAR(100) DEFAULT NULL,
    qr_code_secret VARCHAR(50) DEFAULT NULL,
    qr_code_image_uri TEXT DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    last_login TIMESTAMP(6) WITH TIME ZONE DEFAULT NULL,
                                login_attempts INTEGER DEFAULT 0,
                                mfa BOOLEAN NOT NULL DEFAULT FALSE,
                                enabled BOOLEAN NOT NULL DEFAULT FALSE,
                                account_non_expired BOOLEAN NOT NULL DEFAULT FALSE,
                                account_non_locked BOOLEAN NOT NULL DEFAULT FALSE,
                                created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_user_uuid UNIQUE (user_uuid),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_member_id UNIQUE (member_id)
    );


CREATE TABLE IF NOT EXISTS roles (
                                     role_id BIGSERIAL PRIMARY KEY,
                                     role_uuid VARCHAR(40) NOT NULL,
    name VARCHAR(25) NOT NULL,
    authority TEXT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT uq_roles_role_uuid UNIQUE (role_uuid)
    );

CREATE TABLE IF NOT EXISTS user_roles (
                                          user_role_id BIGSERIAL PRIMARY KEY,
                                          user_id BIGINT NOT NULL,
                                          role_id BIGINT NOT NULL,
                                          CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users (user_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles (role_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS credentials (
                                           credential_id BIGSERIAL PRIMARY KEY,
                                           credential_uuid VARCHAR(40) NOT NULL,
    user_id BIGINT NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_credentials_credential_uuid UNIQUE (credential_uuid),
    CONSTRAINT uq_credentials_user_id UNIQUE (user_id),
    CONSTRAINT fk_credentials_user_id FOREIGN KEY (user_id) REFERENCES users (user_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS account_tokens (
                                              account_token_id BIGSERIAL PRIMARY KEY,
                                              token VARCHAR(40) NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_account_tokens_token UNIQUE (token),
    CONSTRAINT uq_account_tokens_user_id UNIQUE (user_id),
    CONSTRAINT fk_account_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (user_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS password_tokens (
                                               password_token_id BIGSERIAL PRIMARY KEY,
                                               token VARCHAR(40) NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT uq_password_tokens_token UNIQUE (token),
    CONSTRAINT uq_password_tokens_user_id UNIQUE (user_id),
    CONSTRAINT fk_password_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (user_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
    );

CREATE TABLE IF NOT EXISTS devices (
                                       device_id BIGSERIAL PRIMARY KEY,
                                       user_id BIGINT NOT NULL,
                                       device VARCHAR(40) NOT NULL,
    client VARCHAR(40) NOT NULL,
    ip_address VARCHAR(100) NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT fk_devices_user_id FOREIGN KEY (user_id) REFERENCES users (user_id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT
    );