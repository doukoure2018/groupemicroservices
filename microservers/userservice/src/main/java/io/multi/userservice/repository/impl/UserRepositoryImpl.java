package io.multi.userservice.repository.impl;

import io.multi.userservice.model.*;
import io.multi.userservice.repository.UserRepository;
import io.multi.userservice.service.OrangeSmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ApiException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import static io.multi.userservice.query.UserQuery.*;
import static io.multi.userservice.utils.UserUtils.*;
import static java.sql.Types.VARCHAR;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRepositoryImpl implements UserRepository {

    private final JdbcClient jdbcClient;
    private final OrangeSmsService orangeSmsService;
    @Override
    public User getUserByEmail(String email) {
        try {
            return jdbcClient.sql(SELECT_USER_BY_EMAIL_QUERY).param("email",email).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by email");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }
    @Override
    public User getUserByUuid(String userUuid) {
        try {
            return jdbcClient.sql(SELECT_USER_BY_UUID_QUERY).param("userUuid",userUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userUuid");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User getUserById(Long userId) {
        try {
            return jdbcClient.sql(SELECT_USER_BY_ID_QUERY).param("userId",userId).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userId");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User updateUser(String userUuid, String firstName, String lastName, String email, String phone, String bio, String address) {
        try {
            return jdbcClient.sql(UPDATE_USER_FUNCTION).paramSource(getParamSource( userUuid,  firstName,  lastName,  email,  phone,  bio,  address)).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("No user found by userUuid");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public String createUser(String firstName, String lastName, String email, String username, String password, String phone) {
        try {
            var token = randomUUUID.get();
            jdbcClient.sql(CREATE_USER_STORED_PROCEDURE).paramSource(getParamSource(firstName, lastName, email, username, password, token, phone)).update();
            return token;
        }catch (DuplicateKeyException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Email is already in Use. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public String createAccountUser(String firstName, String lastName, String email, String username, String password, String roleName) {
        try {
            var token = randomUUUID.get();

            log.info("Creating standard user account for role: {}", roleName);

            jdbcClient.sql(CREATE_ACCOUNT_STORED_PROCEDURE)
                    .paramSource(getParamSourceAccount(firstName, lastName, email, username, password, token, roleName))
                    .update();

            log.info("Standard user account created successfully with token: {}", token);
            return token;

        } catch (DuplicateKeyException exception) {
            log.error("Duplicate key error: {}", exception.getMessage());
            throw new ApiException("Email is already in use. Please try again");

        } catch (Exception e) {
            log.error("Error creating standard user account: {}", e.getMessage());
            throw new ApiException("An error occurred please try again");
        }
    }

    @Override
    public AccountToken getAccountToken(String token) {
        try {
            return jdbcClient.sql(SELECT_ACCOUNT_TOKEN_QUERY).param("token",token).query(AccountToken.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Invalid Link. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User verifyPasswordToken(String token) {
        return null;
    }

    @Override
    public User enableMfa(String userUuid) {
        try {
            return jdbcClient.sql(ENABLE_USER_MFA_FUNCTION).paramSource(getParamSource(userUuid,qrCodeSecret.get())).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User disableMfa(String userUuid) {
        try {
            return jdbcClient.sql(DISABLE_USER_MFA_FUNCTION).param("userUuid",userUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User toggleAccountExpired(String userUuid) {
        try {
            return jdbcClient.sql(TOGGLE_ACCOUNT_EXPIRED_FUNCTION).param("userUuid",userUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User toggleAccountLocked(String userUuid) {
        try {
            return jdbcClient.sql(TOGGLE_ACCOUNT_LOCKED_FUNCTION).param("userUuid",userUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User toggleAccountEnabled(String userUuid) {
        try {
            return jdbcClient.sql(TOGGLE_ACCOUNT_ENABLED_FUNCTION).param("userUuid",userUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User toggleCredentialsExpired(String userUuid) {
        return null;
    }

    @Override
    public void updatePassword(String userUuid, String encodedPassword) {
        try {
            jdbcClient.sql(UPDATE_USER_PASSWORD_QUERY).params(Map.of("userUuid",userUuid,"password",encodedPassword)).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User updateRole(String userUuid, String role) {
        try {
            return jdbcClient.sql(UPDATE_USER_ROLE_FUNCTION).params(Map.of("userUuid",userUuid,"role",role)).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not found, Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public void resetPassword(String email) {

    }

    @Override
    public void doResetPassword(String userUuid, String token, String password, String confirmPassword) {

    }

    @Override
    public List<User> getUsers() {
        try {
            return jdbcClient.sql(SELECT_USER_QUERY).query(User.class).list();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Users Not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public List<Role> getRoles() {
        try {
            return jdbcClient.sql(SELECT_ROLES_USER_QUERY).query(Role.class).list();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Roles Not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public User getAssignee(String ticketUuid) {
        try {
            return jdbcClient.sql(SELECT_TICKET_ASSIGNEE_QUERY).param("ticketUuid", ticketUuid).query(User.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            log.error("Ticket is not assigned.");
            return User.builder().build();
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public Credential getCredential(String userUuid) {
        try {
            return jdbcClient.sql(SELECT_USER_CREDENTIAL_QUERY).param("userUuid",userUuid).query(Credential.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Credential not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public List<Device> getDevices(String userUuid) {
        try {
            return jdbcClient.sql(SELECT_USER_DEVICES_QUERY).param("userUuid",userUuid).query(Device.class).list();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Not Devices Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public void deleteAccountToken(String token) {
        try {
            jdbcClient.sql(DELETE_ACCOUNT_TOKEN_QUERY).param("token",token).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Token not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public void updateAccountSettings(Long userId) {
        try {
            jdbcClient.sql(UPDATE_ACCOUNT_SETTINGS_QUERY).param("userId",userId).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public PasswordToken getPasswordToken(String token) {
        try {
            return jdbcClient.sql(SELECT_PASSWORD_TOKEN_QUERY).param("token",token).query(PasswordToken.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Invalid Link. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public PasswordToken getPasswordToken(Long userId) {
        try {
            return jdbcClient.sql(SELECT_PASSWORD_TOKEN_BY_USER_ID_QUERY).param("userId",userId).query(PasswordToken.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            //throw  new ApiException("Invalid Link. Please try again");
            return null;
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public void deletePasswordToken(Long userId) {
        try {
            jdbcClient.sql(DELETE_PASSWORD_TOKEN_QUERY).param("userId",userId).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Token not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public void deletePasswordToken(String token) {
        try {
            jdbcClient.sql(DELETE_PASSWORD_TOKEN_QUERY).param("token",token).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Token not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public void updateImageUrl(String userUuid, String imageUrl) {
        try {
            jdbcClient.sql(UPDATE_USER_IMAGE_URI_QUERY).params(Map.of("userUuid",userUuid,"imageUrl",imageUrl)).update();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("User not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public String getPassword(String userUuid) {
        try {
            return jdbcClient.sql(SELECT_PASSWORD_USER_QUERY).param("userUuid",userUuid).query(String.class).single();
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Password Not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    @Override
    public String createPasswordToken(Long userId) {
        try {
            var token = randomUUUID.get();
            jdbcClient.sql(CREATE_PASSWORD_TOKEN_QUERY).params(Map.of("userId",userId,"token", token)).update();
            return token;
        }catch (EmptyResultDataAccessException exception){
            log.error(exception.getMessage());
            throw  new ApiException("Password Not Found. Please try again");
        }catch (Exception e){
            log.error(e.getMessage());
            throw  new ApiException("An error occurred please try again");
        }
    }

    private SqlParameterSource getParamSource(String userUuid, String firstName, String lastName, String email, String phone, String bio, String address)
    {
        return new MapSqlParameterSource()
                .addValue("userUuid",userUuid, VARCHAR)
                .addValue("firstName",firstName, VARCHAR)
                .addValue("lastName",lastName, VARCHAR)
                .addValue("email",email.trim().toLowerCase(), VARCHAR)
                .addValue("phone",phone, VARCHAR)
                .addValue("bio",bio, VARCHAR)
                .addValue("address",address, VARCHAR);
    }

    private String generateUsername(String firstName, String lastName) {
        String base = (firstName.substring(0, 1) + lastName)
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "");
        // Limiter à 20 caractères pour laisser place aux chiffres
        if (base.length() > 20) {
            base = base.substring(0, 20);
        }
        // Ajouter 4 chiffres aléatoires
        int random = (int) (Math.random() * 10000);
        return base + String.format("%04d", random);
    }

    private SqlParameterSource getParamSource(String userUuid, String qrCodeSecret)
    {
        return new MapSqlParameterSource()
                .addValue("userUuid",userUuid, VARCHAR)
                .addValue("qrCodeSecret",qrCodeSecret, VARCHAR)
                .addValue("qrCodeImageUri",qrCodeImageUri.apply(qrCodeSecret), VARCHAR);
    }

    private SqlParameterSource getParamSourceWithMatricule(String firstName, String lastName, String email, String username, String password, String token, String matricule, String phone)
    {
        // Générer le username si null ou vide (combinaison prénom + nom)
        String generatedUsername = (username == null || username.trim().isEmpty())
                ? generateUsername(firstName, lastName)
                : username.trim().toLowerCase();

        return new MapSqlParameterSource()
                .addValue("userUuid", randomUUUID.get(), VARCHAR)
                .addValue("firstName", firstName, VARCHAR)
                .addValue("lastName", lastName, VARCHAR)
                .addValue("email", email.trim().toLowerCase(), VARCHAR)
                .addValue("username", generatedUsername, VARCHAR)
                .addValue("memberId", memberId.get(), VARCHAR)
                .addValue("credentialUuid", randomUUUID.get(), VARCHAR)
                .addValue("password", password, VARCHAR)
                .addValue("token", token, VARCHAR)
                .addValue("phone", phone, VARCHAR);
    }

    private SqlParameterSource getParamSourceAccount(String firstName, String lastName, String email,
                                                     String username, String password, String token, String roleName) {
        return new MapSqlParameterSource()
                .addValue("userUuid", randomUUUID.get(), VARCHAR)
                .addValue("firstName", firstName, VARCHAR)
                .addValue("lastName", lastName, VARCHAR)
                .addValue("email", email.trim().toLowerCase(), VARCHAR)
                .addValue("username", username.trim().toLowerCase(), VARCHAR)
                .addValue("memberId", memberId.get(), VARCHAR)
                .addValue("credentialUuid", randomUUUID.get(), VARCHAR)
                .addValue("password", password, VARCHAR)
                .addValue("token", token, VARCHAR)
                .addValue("roleName", roleName, VARCHAR);
    }

}
