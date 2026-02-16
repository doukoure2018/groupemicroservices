package io.multi.authorizationserver.controller;


import io.multi.authorizationserver.dto.RegisterRequest;
import io.multi.authorizationserver.event.Event;
import io.multi.authorizationserver.event.EventType;
import io.multi.authorizationserver.event.Notification;
import io.multi.authorizationserver.exception.ApiException;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import io.multi.authorizationserver.security.MfaAuthentication;
import io.multi.authorizationserver.service.UserService;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.WebAttributes;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.Map;

import static io.multi.authorizationserver.utils.RequestUtils.getMessage;
import static io.multi.authorizationserver.utils.UserUtils.getUser;
import static org.springframework.kafka.support.KafkaHeaders.TOPIC;

@Slf4j
@Controller
@RequiredArgsConstructor
public class LoginController {
    private static final String NOTIFICATION_TOPIC = "NOTIFICATION_TOPIC";
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final AuthenticationFailureHandler authenticationFailureHandler = new SimpleUrlAuthenticationFailureHandler("/mfa?error");
    private final AuthenticationSuccessHandler authenticationSuccessHandler;
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, Notification> kafkaTemplate;

    @GetMapping("/login")
    public String login(@RequestParam(value = "error", required = false) String error,
                        HttpServletRequest request,
                        Model model) {
        if (error != null) {
            String errorMessage = getErrorMessage(request);
            model.addAttribute("errorMessage", errorMessage);
        }
        return "login";
    }

    @GetMapping("/register")
    public String register(@RequestParam(value = "error", required = false) String error,
                          Model model) {
        if (error != null) {
            model.addAttribute("errorMessage", "Une erreur est survenue lors de l'inscription.");
        }
        return "register";
    }

    @PostMapping("/register")
    public String processRegistration(@ModelAttribute RegisterRequest registerRequest,
                                      RedirectAttributes redirectAttributes) {
        try {
            // Validate passwords match
            if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
                redirectAttributes.addFlashAttribute("errorMessage", "Les mots de passe ne correspondent pas.");
                return "redirect:/register";
            }

            // Validate password length
            if (registerRequest.getPassword().length() < 8) {
                redirectAttributes.addFlashAttribute("errorMessage", "Le mot de passe doit contenir au moins 8 caractères.");
                return "redirect:/register";
            }

            // Check if email already exists
            if (userRepository.emailExists(registerRequest.getEmail())) {
                redirectAttributes.addFlashAttribute("errorMessage", "Cette adresse email est déjà utilisée.");
                return "redirect:/register";
            }

            // Encode password and create user
            String encodedPassword = passwordEncoder.encode(registerRequest.getPassword());
            String token = userRepository.createLocalUser(
                    registerRequest.getEmail(),
                    registerRequest.getFirstName(),
                    registerRequest.getLastName(),
                    registerRequest.getPhone(),
                    encodedPassword
            );

            // Send verification email via Kafka
            try {
                var event = new Event(EventType.USER_CREATED, Map.of(
                        "token", token,
                        "name", registerRequest.getFirstName(),
                        "email", registerRequest.getEmail()
                ));
                var message = MessageBuilder.withPayload(new Notification(event))
                        .setHeader(TOPIC, NOTIFICATION_TOPIC)
                        .build();
                kafkaTemplate.send(message);
                log.info("Verification email event sent for: {}", registerRequest.getEmail());
            } catch (Exception e) {
                log.error("Failed to send verification email event: {}", e.getMessage());
            }

            redirectAttributes.addFlashAttribute("successMessage", "Votre compte a été créé. Veuillez vérifier votre email pour activer votre compte.");
            return "redirect:/login";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Une erreur est survenue lors de l'inscription: " + e.getMessage());
            return "redirect:/register";
        }
    }

    private String getErrorMessage(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            AuthenticationException exception = (AuthenticationException) session.getAttribute(WebAttributes.AUTHENTICATION_EXCEPTION);
            if (exception != null) {
                // Clear the exception from session after reading
                session.removeAttribute(WebAttributes.AUTHENTICATION_EXCEPTION);

                // Return French error messages based on exception type
                if (exception instanceof BadCredentialsException) {
                    return "Email ou mot de passe incorrect";
                } else if (exception instanceof UsernameNotFoundException) {
                    return "Compte utilisateur introuvable";
                } else if (exception instanceof DisabledException) {
                    return "Votre compte a été désactivé";
                } else if (exception instanceof LockedException) {
                    return "Votre compte a été verrouillé";
                } else {
                    // Return the original message or a default one
                    String message = exception.getMessage();
                    return (message != null && !message.isEmpty()) ? message : "Échec de l'authentification";
                }
            }
        }
        return "Email ou mot de passe incorrect";
    }

    @GetMapping("/mfa")
    public String mfa(Model model, @CurrentSecurityContext SecurityContext context) {
        model.addAttribute("email", getAuthenticatedUser(context.getAuthentication()));
        return "mfa";
    }

    @PostMapping("/mfa")
    public void validateCode(@RequestParam("code") String code, HttpServletRequest request, HttpServletResponse response, @CurrentSecurityContext SecurityContext context) throws ServletException, IOException {
        var user = getUser(context.getAuthentication());
        if(userService.verifyQrCode(user.getUserUuid(), code)) {
            this.authenticationSuccessHandler.onAuthenticationSuccess(request, response, getAuthentication(request, response));
            return;
        }
        this.authenticationFailureHandler.onAuthenticationFailure(request, response, new BadCredentialsException("Invalid QR code. Please try again."));
    }

    @GetMapping("/logout")
    public String logout() {
        return "logout";
    }

    @GetMapping("/error")
    public String error(HttpServletRequest request, HttpServletResponse response, Model model, Exception exception) {
        var errorException = (Exception) request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);
        if(errorException instanceof ApiException || errorException instanceof BadCredentialsException) {
            request.getSession().setAttribute(WebAttributes.AUTHENTICATION_EXCEPTION, errorException);
            return "login";
        }
        model.addAttribute("message", getMessage(request));
        return "error";
    }

    private Authentication getAuthentication(HttpServletRequest request, HttpServletResponse response) {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        MfaAuthentication mfaAuthentication = (MfaAuthentication) securityContext.getAuthentication();
        securityContext.setAuthentication(mfaAuthentication);
        SecurityContextHolder.setContext(securityContext);
        securityContextRepository.saveContext(securityContext, request, response);
        return mfaAuthentication.getPrimaryAuthentication();
    }

    private Object getAuthenticatedUser(Authentication authentication) {
        return ((User) authentication.getPrincipal()).getEmail();
    }
}
