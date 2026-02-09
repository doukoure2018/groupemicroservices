package io.multi.userservice.service.impl;

import io.multi.userservice.event.Event;
import io.multi.userservice.model.Credential;
import io.multi.userservice.model.Device;
import io.multi.userservice.model.Role;
import io.multi.userservice.model.User;
import io.multi.userservice.repository.UserRepository;
import io.multi.userservice.service.OrangeSmsService;
import io.multi.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.errors.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Function;

import static io.multi.userservice.constant.Constants.PHOTO_DIRECTORY;
import static io.multi.userservice.enumeration.EventType.RESETPASSWORD;
import static io.multi.userservice.enumeration.EventType.USER_CREATED;
import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;
import static java.util.Objects.nonNull;
import static org.apache.commons.lang.WordUtils.capitalizeFully;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;
    private final ApplicationEventPublisher publisher;
    private final OrangeSmsService orangeSmsService;

    @Value("${ui.app.url}")
    private String uiAppUrl;

    @Value("${sms.sender.name}")
    private String senderName;

    @Override
    public User getUserByEmail(String email) {
        return userRepository.getUserByEmail(email);
    }

    @Override
    public User getUserByUuid(String userUuid) {
        return userRepository.getUserByUuid(userUuid);
    }

    @Override
    public User updateUser(String userUuid, String firstName, String lastName, String email, String phone, String bio, String address) {
        return userRepository.updateUser(userUuid,firstName,lastName,email,phone,bio,address);
    }

    @Override
    public void createUser(String firstName, String lastName, String email, String username, String password, String phone) {
        var token = userRepository.createUser(firstName, lastName, email, username, encoder.encode(password), phone);
        System.out.println(token);
        publisher.publishEvent(new Event(USER_CREATED, Map.of("token", token, "name", capitalizeFully(firstName), "email", email)));

    }

    @Override
    public void createAccountUser(String firstName, String lastName, String email, String username, String password, String roleName) {
        log.info("Service: Creating standard user account for role: {}", roleName);

        var token = userRepository.createAccountUser(firstName, lastName, email, username,
                encoder.encode(password), roleName);

        System.out.println(token);
        publisher.publishEvent(new Event(USER_CREATED, Map.of(
                "token", token,
                "name", capitalizeFully(firstName),
                "email", email,
                "roleName", roleName
        )));
    }

    @Override
    public void verifyAccount(String token) {
        var accountToken = userRepository.getAccountToken(token);
        if(!nonNull(accountToken)){
            throw new ApiException("Invalid Link. Please try again.");
        }
        if(accountToken.isExpired()){
            userRepository.deleteAccountToken(token);
            throw new ApiException("Link has expired. Please Create your account again");
        }
        userRepository.updateAccountSettings(accountToken.getUserId());
        userRepository.deleteAccountToken(token);
    }

    @Override
    public User verifyPasswordToken(String token) {
        var passwordToken = userRepository.getPasswordToken(token);
        if(!nonNull(passwordToken)){
            throw new ApiException("Invalid Link. Please try again.");
        }
        if(passwordToken.isExpired()){
            userRepository.deletePasswordToken(token);
            throw new ApiException("Link has expired. Please Reset your password again");
        }
        return userRepository.getUserById(passwordToken.getUserId());
    }

    @Override
    public User enableMfa(String userUuid) {
        return userRepository.enableMfa(userUuid);
    }

    @Override
    public User disableMfa(String userUuid) {
        return userRepository.disableMfa(userUuid);
    }

    @Override
    public User uploadPhoto(String userUuid, MultipartFile file) {
        var user = userRepository.getUserByUuid(userUuid);
        var imageUrl=photoFunction.apply(user.getImageUrl(), file);
        userRepository.updateImageUrl(userUuid,imageUrl);
        user.setImageUrl(imageUrl + "?timestamp=" + System.currentTimeMillis());
        return user;
    }

    @Override
    public User toggleAccountExpired(String userUuid) {
        return userRepository.toggleAccountExpired(userUuid);
    }

    @Override
    public User toggleAccountLocked(String userUuid) {
        return userRepository.toggleAccountLocked(userUuid);
    }

    @Override
    public User toggleAccountEnabled(String userUuid) {
        return null;
    }

    @Override
    public User toggleCredentialsExpired(String userUuid) {
        return userRepository.toggleAccountEnabled(userUuid);
    }

    @Override
    public void updatePassword(String userUuid, String currentPassword, String newPassword, String confirmNewPassword) {
        if(!Objects.equals(confirmNewPassword,newPassword)){
            throw new ApiException("Password don't match. Please try again");
        }
        if(!encoder.matches(currentPassword, userRepository.getPassword(userUuid))){
            throw new ApiException("Existing password is incorrect. Please try again");
        }
        userRepository.updatePassword(userUuid,encoder.encode(newPassword));
    }

    @Override
    public User updateRole(String userUuid, String role) {
        return null;
    }

    @Override
    public void resetPassword(String email) {
        var user = userRepository.getUserByEmail(email);
        var passwordToken = userRepository.getPasswordToken(user.getUserId());
        if(!nonNull(passwordToken)){
            var newToken = userRepository.createPasswordToken(user.getUserId());
            publisher.publishEvent(new Event(RESETPASSWORD, Map.of("token", newToken,"email",email, "name", Objects.requireNonNull(capitalizeFully(user.getFirstName())))));
        } else if (passwordToken.isExpired()) {
            userRepository.deletePasswordToken(user.getUserId());
            var newToken = userRepository.createPasswordToken(user.getUserId());
            publisher.publishEvent(new Event(RESETPASSWORD, Map.of("token", newToken,"email",email, "name", capitalizeFully(user.getFirstName()))));
        }else {
            publisher.publishEvent(new Event(RESETPASSWORD, Map.of("token", passwordToken.getToken(),"email",email, "name", capitalizeFully(user.getFirstName()))));
        }
    }

    @Override
    public void doResetPassword(String userUuid, String token, String password, String confirmPassword) {
        if(!Objects.equals(confirmPassword, password)) {
            throw new ApiException("Passwords don't match. Please try again.");
        }
        var user = userRepository.getUserByUuid(userUuid);
        var passwordToken = userRepository.getPasswordToken(token);
        if(!Objects.equals(user.getUserId(), passwordToken.getUserId())) {
            throw new ApiException("Invalid link. Please try again.");
        }
        userRepository.updatePassword(userUuid, encoder.encode(password));
        userRepository.deletePasswordToken(user.getUserId());
    }

    @Override
    public List<User> getUsers() {
        return userRepository.getUsers();
    }

    @Override
    public List<Role> getRoles() {
        return userRepository.getRoles();
    }

    @Override
    public User getAssignee(String ticketUuid) {
        return userRepository.getAssignee(ticketUuid);
    }

    @Override
    public Credential getCredential(String userUuid) {
        return userRepository.getCredential(userUuid);
    }

    @Override
    public List<Device> getDevices(String userUuid) {
        return userRepository.getDevices(userUuid);
    }

    @Override
    public User getUserId(Long userId) {
        return userRepository.getUserById(userId);
    }

    private final Function<String, String> fileExtension = filename -> Optional.of(filename).filter(name -> name.contains("."))
            .map(name -> "." + name.substring(filename.lastIndexOf(".") + 1)).orElse(".png");

    private final BiFunction<String, MultipartFile, String> photoFunction = (String imageUrl, MultipartFile image) -> {
        try {
            var filename = imageUrl.split("/")[imageUrl.split("/").length - 1].split("\\.")[0] + fileExtension.apply(image.getOriginalFilename());
            var existingImage = Paths.get(PHOTO_DIRECTORY + imageUrl.split("/")[imageUrl.split("/").length - 1]);
            var fileStorageLocation = Paths.get(PHOTO_DIRECTORY).toAbsolutePath().normalize();
            if(!Files.exists(fileStorageLocation)) { Files.createDirectories(fileStorageLocation); }
            if(Files.exists(existingImage)) { Files.deleteIfExists(existingImage); }
            Files.copy(image.getInputStream(), fileStorageLocation.resolve(filename), REPLACE_EXISTING);
            return ServletUriComponentsBuilder
                    .fromCurrentContextPath()
                    .path("/user/image/" + filename).toUriString();
        } catch (Exception exception) {
            log.error(exception.getMessage());
            throw new ApiException("Unable to save image");
        }
    };
}
