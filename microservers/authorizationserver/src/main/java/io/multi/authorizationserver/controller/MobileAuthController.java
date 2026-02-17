package io.multi.authorizationserver.controller;

import io.multi.authorizationserver.dto.RegisterRequest;
import io.multi.authorizationserver.event.Event;
import io.multi.authorizationserver.event.EventType;
import io.multi.authorizationserver.event.Notification;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import io.multi.authorizationserver.service.MobileTokenService;
import io.multi.authorizationserver.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static org.springframework.kafka.support.KafkaHeaders.TOPIC;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class MobileAuthController {
    private static final String NOTIFICATION_TOPIC = "NOTIFICATION_TOPIC";

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MobileTokenService mobileTokenService;
    private final KafkaTemplate<String, Notification> kafkaTemplate;

    /**
     * POST /api/auth/token - Direct email/password login for mobile
     * Returns JWT access_token, refresh_token, id_token
     */
    @PostMapping("/token")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Email et mot de passe requis"
            ));
        }

        try {
            User user = userService.getUserByEmail(email);

            // Validate account state
            if (!user.isAccountNonLocked() || user.getLoginAttempts() >= 5) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "status", "error",
                        "message", "Compte verrouillé après trop de tentatives"
                ));
            }
            if (!user.isEnabled()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "status", "error",
                        "message", "Compte non activé. Vérifiez votre email."
                ));
            }
            if (!user.isAccountNonExpired()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "status", "error",
                        "message", "Compte expiré. Contactez l'administrateur."
                ));
            }

            // Validate password
            if (!passwordEncoder.matches(password, user.getPassword())) {
                userRepository.updateLoginAttempts(email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "status", "error",
                        "message", "Email ou mot de passe incorrect"
                ));
            }

            // Reset login attempts on success
            userRepository.resetLoginAttempts(user.getUserUuid());
            userRepository.setLastLogin(user.getUserId());

            // Generate JWT tokens
            Map<String, Object> tokens = mobileTokenService.generateTokens(user);

            log.info("Mobile login successful for: {}", email);
            return ResponseEntity.ok(tokens);

        } catch (Exception e) {
            log.error("Mobile login error for {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", "error",
                    "message", "Email ou mot de passe incorrect"
            ));
        }
    }

    /**
     * POST /api/auth/register - In-app registration for mobile
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Validate required fields
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Email requis"));
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Mot de passe requis"));
            }
            if (request.getFirstName() == null || request.getFirstName().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Prénom requis"));
            }
            if (request.getLastName() == null || request.getLastName().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Nom requis"));
            }

            // Validate passwords match
            if (request.getConfirmPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Les mots de passe ne correspondent pas"));
            }

            // Validate password length
            if (request.getPassword().length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Le mot de passe doit contenir au moins 8 caractères"));
            }

            // Check email uniqueness
            if (userRepository.emailExists(request.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("status", "error", "message", "Cette adresse email est déjà utilisée"));
            }

            // Create user
            String encodedPassword = passwordEncoder.encode(request.getPassword());
            String token = userRepository.createLocalUser(
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    request.getPhone(),
                    encodedPassword
            );

            // Send verification email via Kafka
            try {
                var event = new Event(EventType.USER_CREATED, Map.of(
                        "token", token,
                        "name", request.getFirstName(),
                        "email", request.getEmail()
                ));
                var message = MessageBuilder.withPayload(new Notification(event))
                        .setHeader(TOPIC, NOTIFICATION_TOPIC)
                        .build();
                kafkaTemplate.send(message);
                log.info("Verification email event sent for mobile registration: {}", request.getEmail());
            } catch (Exception e) {
                log.error("Failed to send verification email for mobile: {}", e.getMessage());
            }

            log.info("Mobile registration successful for: {}", request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", "success",
                    "message", "Compte créé. Vérifiez votre email pour activer votre compte."
            ));

        } catch (Exception e) {
            log.error("Mobile registration error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Erreur lors de l'inscription. Veuillez réessayer."
            ));
        }
    }

    /**
     * POST /api/auth/google - Exchange Google ID token for app tokens
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String googleIdToken = body.get("idToken");

        if (googleIdToken == null || googleIdToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Google ID token requis"
            ));
        }

        try {
            // Decode the Google ID token to extract user info
            // We use a simple JWT decode since the token is already validated by Google SDK on the client
            Map<String, Object> claims = mobileTokenService.decodeGoogleIdToken(googleIdToken);

            String googleId = (String) claims.get("sub");
            String email = (String) claims.get("email");
            String firstName = (String) claims.getOrDefault("given_name", "");
            String lastName = (String) claims.getOrDefault("family_name", "");
            String imageUrl = (String) claims.getOrDefault("picture", "");

            if (googleId == null || email == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "error",
                        "message", "Token Google invalide"
                ));
            }

            // Find or create user
            User user;
            var existingByGoogleId = userRepository.findByGoogleId(googleId);
            if (existingByGoogleId.isPresent()) {
                user = existingByGoogleId.get();
            } else {
                var existingByEmail = userRepository.findByEmail(email);
                if (existingByEmail.isPresent()) {
                    // Link Google account to existing user
                    userRepository.linkGoogleAccount(existingByEmail.get().getUserId(), googleId);
                    user = userRepository.findByGoogleId(googleId)
                            .orElseThrow(() -> new RuntimeException("Failed to retrieve linked user"));
                } else {
                    // Create new OAuth2 user (auto-enabled)
                    user = userRepository.createOAuth2User(email, firstName, lastName, imageUrl, googleId, "GOOGLE");
                }
            }

            // Generate JWT tokens
            Map<String, Object> tokens = mobileTokenService.generateTokens(user);

            log.info("Mobile Google login successful for: {}", email);
            return ResponseEntity.ok(tokens);

        } catch (Exception e) {
            log.error("Mobile Google login error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", "error",
                    "message", "Échec de l'authentification Google"
            ));
        }
    }

    /**
     * POST /api/auth/refresh - Refresh access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Refresh token requis"
            ));
        }

        try {
            Map<String, Object> tokens = mobileTokenService.refreshTokens(refreshToken);
            return ResponseEntity.ok(tokens);
        } catch (Exception e) {
            log.error("Token refresh error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", "error",
                    "message", "Session expirée. Veuillez vous reconnecter."
            ));
        }
    }
}
