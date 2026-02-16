package io.multi.authorizationserver.repository.impl;

import io.multi.authorizationserver.exception.ApiException;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static io.multi.authorizationserver.query.UserQuery.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryImpl implements UserRepository {
    private final JdbcClient jdbcClient;

    @Override
    public User getUserByUuid(String userUuid) {
        try {
            return jdbcClient.sql(SELECT_USER_BY_UUID_QUERY).param("userUuid",userUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userUuid");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }

    @Override
    public User getUserByEmail(String email) {
        try {
            return jdbcClient.sql(SELECT_USER_BY_EMAIL_QUERY).param("email",email).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by email");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }

    @Override
    public void resetLoginAttempts(String userUuid) {
        try {
            jdbcClient.sql(RESET_LOGIN_ATTEMPTS_QUERY).param("userUuid",userUuid).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userUuid");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }

    @Override
    public void updateLoginAttempts(String email) {
        try {
            jdbcClient.sql(UPDATE_LOGIN_ATTEMPTS_QUERY).param("email",email).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by email");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }

    @Override
    public void setLastLogin(Long userId) {
        try {
            jdbcClient.sql(SET_LAST_LOGIN_QUERY).param("userId",userId).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userId");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }

    @Override
    public void addLoginDevice(Long userId, String device, String client, String ipAddress) {
        try {
            jdbcClient.sql(ADD_LOGIN_DEVICE_QUERY).params(Map.of("userId",userId,"device",device,"client",client,"ipAddress",ipAddress)).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userId");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error Occured please try again");
        }
    }

    // OAuth2 methods
    @Override
    public Optional<User> findByEmail(String email) {
        try {
            User user = jdbcClient.sql(FIND_USER_BY_EMAIL_OPTIONAL_QUERY)
                    .param("email", email)
                    .query(User.class)
                    .single();
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error finding user by email: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<User> findByGoogleId(String googleId) {
        try {
            User user = jdbcClient.sql(SELECT_USER_BY_GOOGLE_ID_QUERY)
                    .param("googleId", googleId)
                    .query(User.class)
                    .single();
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error finding user by Google ID: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public User createOAuth2User(String email, String firstName, String lastName, String imageUrl, String googleId, String provider) {
        try {
            // Insert the user and get the generated user_id and user_uuid
            Map<String, Object> result = jdbcClient.sql(INSERT_OAUTH2_USER_QUERY)
                    .param("email", email)
                    .param("firstName", firstName)
                    .param("lastName", lastName)
                    .param("imageUrl", imageUrl)
                    .param("googleId", googleId)
                    .param("authProvider", provider)
                    .query((rs, rowNum) -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("user_id", rs.getLong("user_id"));
                        map.put("user_uuid", rs.getString("user_uuid"));
                        return map;
                    })
                    .single();

            Long userId = (Long) result.get("user_id");

            // Assign USER role to the new user
            jdbcClient.sql(INSERT_USER_ROLE_QUERY)
                    .param("userId", userId)
                    .update();

            log.info("Created OAuth2 user with ID: {} and assigned USER role", userId);

            // Return the created user
            return findByGoogleId(googleId)
                    .orElseThrow(() -> new ApiException("Failed to retrieve created user"));

        } catch (Exception e) {
            log.error("Error creating OAuth2 user: {}", e.getMessage());
            throw new ApiException("Failed to create OAuth2 user: " + e.getMessage());
        }
    }

    @Override
    public void linkGoogleAccount(Long userId, String googleId) {
        try {
            int updated = jdbcClient.sql(LINK_GOOGLE_ACCOUNT_QUERY)
                    .param("userId", userId)
                    .param("googleId", googleId)
                    .update();
            if (updated == 0) {
                throw new ApiException("No user found with userId: " + userId);
            }
            log.info("Linked Google account {} to user {}", googleId, userId);
        } catch (Exception e) {
            log.error("Error linking Google account: {}", e.getMessage());
            throw new ApiException("Failed to link Google account: " + e.getMessage());
        }
    }

    // Local registration methods
    @Override
    public boolean emailExists(String email) {
        try {
            Long count = jdbcClient.sql(CHECK_EMAIL_EXISTS_QUERY)
                    .param("email", email)
                    .query(Long.class)
                    .single();
            return count != null && count > 0;
        } catch (Exception e) {
            log.error("Error checking email existence: {}", e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public String createLocalUser(String email, String firstName, String lastName, String phone, String encodedPassword) {
        try {
            // Insert the user and get the generated user_id and user_uuid
            Map<String, Object> result = jdbcClient.sql(INSERT_LOCAL_USER_QUERY)
                    .param("email", email)
                    .param("firstName", firstName)
                    .param("lastName", lastName)
                    .param("phone", phone)
                    .query((rs, rowNum) -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("user_id", rs.getLong("user_id"));
                        map.put("user_uuid", rs.getString("user_uuid"));
                        return map;
                    })
                    .single();

            Long userId = (Long) result.get("user_id");

            // Insert credentials (password)
            jdbcClient.sql(INSERT_CREDENTIALS_QUERY)
                    .param("userId", userId)
                    .param("password", encodedPassword)
                    .update();

            // Assign USER role to the new user
            jdbcClient.sql(INSERT_USER_ROLE_QUERY)
                    .param("userId", userId)
                    .update();

            // Generate verification token and insert into account_tokens
            String token = java.util.UUID.randomUUID().toString();
            jdbcClient.sql(INSERT_ACCOUNT_TOKEN_QUERY)
                    .param("userId", userId)
                    .param("token", token)
                    .update();

            log.info("Created local user with ID: {} and verification token", userId);

            return token;

        } catch (Exception e) {
            log.error("Error creating local user: {}", e.getMessage());
            throw new ApiException("Failed to create user: " + e.getMessage());
        }
    }
}
