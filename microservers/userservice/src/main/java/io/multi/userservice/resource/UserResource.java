package io.multi.userservice.resource;


import io.multi.userservice.domain.Response;
import io.multi.userservice.dto.*;
import io.multi.userservice.model.User;
import io.multi.userservice.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

import static io.multi.userservice.constant.Constants.PHOTO_DIRECTORY;
import static io.multi.userservice.utils.RequestUtils.getResponse;
import static java.util.Collections.emptyMap;
import static org.springframework.http.HttpStatus.*;
import static org.springframework.http.ResponseEntity.*;

@RestController
@AllArgsConstructor
@RequestMapping("/user")
@Slf4j
public class UserResource {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Response> register(@RequestBody UserRequest user, HttpServletRequest request) {
        userService.createUser(
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getUsername(),
                user.getPassword(),
                user.getPhone()
        );
        return created(getUri()).body(getResponse(request, emptyMap(), "Account created. Check your email to enable your account", CREATED));
    }

    /**
     *   Get User information via Communication Open Feign
     */
    @GetMapping("/getUser/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable(name = "userId") Long userId) {
        var user= userService.getUserId(userId);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/getUser/uuid/{uuid}")
    public ResponseEntity<User> getUserByUuid(@PathVariable(name = "uuid") String uuid) {
        User user = userService.getUserByUuid(uuid);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/verify/account")
    public ResponseEntity<Response> verifyAccount(@RequestParam("token") String token, HttpServletRequest request) {
        userService.verifyAccount(token);
        return ok(getResponse(request, emptyMap(), "Account verified. You may login now", OK));
    }

    // When user is logged in
    @PatchMapping("/mfa/enable")
    public ResponseEntity<Response> enableMfa(@NotNull Authentication authentication, HttpServletRequest request) {
        var user= userService.enableMfa(authentication.getName());
        return ok(getResponse(request, Map.of("user",user), "2FA enabled Successfully", OK));
    }

    // When user is logged in
    @PatchMapping("/mfa/disabled")
    public ResponseEntity<Response> disableMfa(@NotNull Authentication authentication, HttpServletRequest request) {
        var user= userService.disableMfa(authentication.getName());
        return ok(getResponse(request, Map.of("user",user), "2FA disabled Successfully", OK));
    }

    // When user is logged in
    @GetMapping("/profile")
    public ResponseEntity<Response> profile(@NotNull Authentication authentication, HttpServletRequest request) {
        System.out.println(authentication.getName());
        var user= userService.getUserByUuid(authentication.getName());
        var devices = userService.getDevices(authentication.getName());
        return ok(getResponse(request, Map.of("user",user,"devices",devices), "Profile retrieved", OK));
    }

    @GetMapping("/instanceUser")
    public ResponseEntity<Response> getUserInfo(@NotNull Authentication authentication, HttpServletRequest request)
    {
        //System.out.println(authentication.getName());
        var user= userService.getUserByUuid(authentication.getName());
        return ok(getResponse(request, Map.of("user",user), "user retrieved Successfully", OK));
    }

    // When user is  logged in
    @GetMapping("/userUuid")
    public ResponseEntity<Response> getUserUuid(@NotNull Authentication authentication,@PathVariable("userUuid") String userUuid, HttpServletRequest request) {
        var user= userService.getUserByUuid(userUuid);
        return ok(getResponse(request, Map.of("user", user), "Profile retrieved", OK));
    }


    // When user is logged in
    @GetMapping("/assignee/{ticketUuid}")
    public ResponseEntity<Response> getAssigneeByUuid(@NotNull Authentication authentication,@PathVariable("ticketUuid") String ticketUuid, HttpServletRequest request) {
        var user= userService.getAssignee(ticketUuid);
        return ok(getResponse(request, Map.of("user",user), "Profile retrieved", OK));
    }


    // When user is  logged in
    @GetMapping("/user/{email}")
    public ResponseEntity<Response> getUserEmail(@NotNull Authentication authentication, @PathVariable("email") String email, HttpServletRequest request) {
        var user= userService.getUserByEmail(email);
        return ok(getResponse(request, Map.of("user",user), "Profile retrieved", OK));
    }

    // When user is  logged in
    @GetMapping("/credential/{userUuid}")
    public ResponseEntity<Response> getCredential(@NotNull Authentication authentication, @PathVariable("userUuid") String userUuid, HttpServletRequest request) {
        var credential = userService.getCredential(userUuid);
        return ok(getResponse(request, Map.of("credential",credential), "Profile retrieved", OK));
    }

    @PatchMapping("/{update}")
    public ResponseEntity<Response> updateUser(@NotNull Authentication authentication, @RequestBody UserRequest user, HttpServletRequest request) {
        var updatedUser = userService.updateUser(authentication.getName(),user.getFirstName(),user.getLastName(),user.getEmail(),user.getPhone(),user.getBio(),user.getAddress());
        return ok(getResponse(request, Map.of("user",updatedUser), "User Updated Successfully", OK));
    }

    // When user is  logged in
    @PatchMapping("/{updateRole}")
    public ResponseEntity<Response> updateRole(@NotNull Authentication authentication, @RequestBody RoleRequest role, HttpServletRequest request) {
        var updatedRole = userService.updateRole(authentication.getName(), role.getRole());
        return ok(getResponse(request, Map.of("user",updatedRole), "Role Updated Successfully", OK));
    }

    // When user is logged in
    @PatchMapping("/toggleaccountexpired")
    public ResponseEntity<Response> toggleaccountexpired(@NotNull Authentication authentication, HttpServletRequest request) {
        var user = userService.toggleAccountExpired(authentication.getName());
        return ok(getResponse(request, Map.of("user",user), "User Updated Successfully", OK));
    }

    // When user is logged in
    @PatchMapping("/toggleaccountlocked")
    public ResponseEntity<Response> toggleaccountlocked(@NotNull Authentication authentication, HttpServletRequest request) {
        var user = userService.toggleAccountLocked(authentication.getName());
        return ok(getResponse(request, Map.of("user",user), "User Updated Successfully", OK));
    }

    // When user is logged in
    @PatchMapping("/toggleaccountenabled")
    public ResponseEntity<Response> toggleaccountenabled(@NotNull Authentication authentication, HttpServletRequest request) {
        var user = userService.toggleAccountEnabled(authentication.getName());
        return ok(getResponse(request, Map.of("user",user), "User Updated Successfully", OK));
    }

    // When user is logged in
    @PostMapping("/updatepassword")
    public ResponseEntity<Response> updatePassword(@NotNull Authentication authentication, @RequestBody PasswordRequest passwordRequest, HttpServletRequest request) {
        userService.updatePassword(authentication.getName(), passwordRequest.getCurrentPassword(), passwordRequest.getNewPassword(), passwordRequest.getConfirmedPassword());
        return ok(getResponse(request, emptyMap(), "User Updated Successfully", OK));
    }

    // When user is not logged in
    @PostMapping("/resetpassword")
    public ResponseEntity<Response> resetPassword(@RequestParam("email") String email, HttpServletRequest request) {
        userService.resetPassword(email);
        return ok(getResponse(request, emptyMap(), "We sent you an email for you to reset your password", OK));
    }

    // When user is not logged in
    @GetMapping("/verify/password")
    public ResponseEntity<Response> verifyPassword(@RequestParam("token") String token, HttpServletRequest request) {
        var user = userService.verifyPasswordToken(token);
        return ok(getResponse(request, Map.of("user",user), "Enter your new password", OK));
    }

    // When user is not logged in
    @PostMapping("/resetpassword/reset")
    public ResponseEntity<Response> doResetPassword(@RequestBody ResetPasswordRequest passwordRequest, HttpServletRequest request) {
        userService.doResetPassword(passwordRequest.getUserUuid(),passwordRequest.getToken(),passwordRequest.getPassword(),passwordRequest.getConfirmPassword());
        return ok(getResponse(request, emptyMap(), "Password reset Successfully. You may login now", OK));
    }
    // When user is logged in
    @GetMapping("/list")
    public ResponseEntity<Response> getUsers(@NotNull Authentication authentication, HttpServletRequest request) {
        return ok(getResponse(request, Map.of("users",userService.getUsers()), "List of Users Retreived Successfully", OK));
    }
    // When user is logged in
    @GetMapping("/photo")
    public ResponseEntity<Response> uploadPhoto(@NotNull Authentication authentication, @RequestParam("file") MultipartFile file, HttpServletRequest request) {
        var user = userService.uploadPhoto(authentication.getName(),file);
        return ok(getResponse(request, Map.of("user",user), "User Updated Successfully", OK));
    }

    @GetMapping("/image/{filename}")
    public byte []  getPhoto(@PathVariable("filename") String filename) throws IOException {
        return Files.readAllBytes((Paths.get(PHOTO_DIRECTORY + filename)));
    }


    private URI getUri() {
        return URI.create("/user/profile/userId");
    }



}
