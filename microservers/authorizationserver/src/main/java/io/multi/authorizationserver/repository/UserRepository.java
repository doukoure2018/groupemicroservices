package io.multi.authorizationserver.repository;

import io.multi.authorizationserver.model.User;

import java.util.Optional;

public interface UserRepository {

    User getUserByUuid(String userUuid);
    User getUserByEmail(String email);
    void resetLoginAttempts(String userUuid);
    void updateLoginAttempts(String email);
    void setLastLogin(Long userId);
    void addLoginDevice(Long userId, String device, String client, String ipAddress);

    // OAuth2 methods
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    User createOAuth2User(String email, String firstName, String lastName, String imageUrl, String googleId, String provider);
    void linkGoogleAccount(Long userId, String googleId);
    void updateImageUrl(Long userId, String imageUrl);

    // Local registration methods
    boolean emailExists(String email);
    String createLocalUser(String email, String firstName, String lastName, String phone, String address, String encodedPassword);

    // Mobile account verification (Phase 2) : token email → {user_uuid, expired}
    // (null si introuvable/déjà utilisé), activation du compte, suppression token.
    java.util.Map<String, Object> getAccountToken(String token);
    void enableUser(String userUuid);
    void deleteAccountToken(String token);

    // Password reset methods
    java.util.Map<String, Object> findUserBasicByEmail(String email);
    String getOrCreatePasswordToken(Long userId);
}

