package io.multi.authorizationserver.security.oauth2;

import io.multi.authorizationserver.model.AuthProvider;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Custom OIDC UserService that handles Google OIDC authentication.
 * This service is called after successful OIDC authentication with Google.
 * It either finds an existing user or creates a new one based on the Google profile.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOidcUserService extends OidcUserService {

    /**
     * Avatar par défaut posé par le DEFAULT de la colonne {@code users.image_url}
     * (cf migration V1). image_url n'étant donc JAMAIS NULL, on doit considérer
     * ce placeholder comme "remplaçable" pour pouvoir capter la photo Google.
     * Le SQL reste la source de vérité ; cette constante en est le miroir Java.
     */
    public static final String DEFAULT_AVATAR_URL =
            "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    private final UserRepository userRepository;

    /**
     * Vrai si l'avatar courant est vide ou correspond au placeholder par défaut
     * (test robuste au éventuel suffixe {@code ?timestamp}), donc remplaçable par
     * la photo Google. Faux si l'user a un avatar uploadé custom (à ne pas écraser).
     */
    private static boolean isReplaceableAvatar(String current) {
        return current == null || current.isBlank()
                || current.contains("flaticon") || current.contains("149071");
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        log.info("OIDC login attempt with provider: {}", registrationId);

        try {
            return processOidcUser(userRequest, oidcUser);
        } catch (Exception ex) {
            log.error("Error processing OIDC user: {}", ex.getMessage(), ex);
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("processing_error", ex.getMessage(), null)
            );
        }
    }

    private CustomOidcUser processOidcUser(OidcUserRequest userRequest, OidcUser oidcUser) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if ("google".equalsIgnoreCase(registrationId)) {
            return processGoogleUser(oidcUser);
        }

        throw new OAuth2AuthenticationException(
                new OAuth2Error("unsupported_provider",
                        "OIDC provider " + registrationId + " is not supported", null)
        );
    }

    private CustomOidcUser processGoogleUser(OidcUser oidcUser) {
        String googleId = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String firstName = oidcUser.getGivenName();
        String lastName = oidcUser.getFamilyName();
        String imageUrl = oidcUser.getPicture();

        log.info("Processing Google OIDC user: email={}, googleId={}", email, googleId);

        // First, try to find user by Google ID
        Optional<User> userOptional = userRepository.findByGoogleId(googleId);

        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            log.info("Found existing user by Google ID: {}", user.getEmail());
        } else {
            // Check if user exists by email
            Optional<User> userByEmail = userRepository.findByEmail(email);

            if (userByEmail.isPresent()) {
                user = userByEmail.get();

                // Check if this account is a LOCAL account
                if (user.getAuthProvider() == null ||
                        AuthProvider.LOCAL.name().equals(user.getAuthProvider())) {
                    // Link Google account to existing LOCAL account
                    log.info("Linking Google account to existing LOCAL user: {}", email);
                    userRepository.linkGoogleAccount(user.getUserId(), googleId);

                    // Refresh user data
                    user = userRepository.findByGoogleId(googleId)
                            .orElseThrow(() -> new OAuth2AuthenticationException(
                                    new OAuth2Error("user_not_found",
                                            "Failed to retrieve user after linking", null)
                            ));
                } else {
                    log.info("User already linked with provider: {}", user.getAuthProvider());
                }
            } else {
                // Create new user
                log.info("Creating new user from Google OIDC account: {}", email);
                user = userRepository.createOAuth2User(
                        email,
                        firstName != null ? firstName : email.split("@")[0],
                        lastName != null ? lastName : "",
                        imageUrl,
                        googleId,
                        AuthProvider.GOOGLE.name()
                );
            }
        }

        // Capture la photo de profil Google pour les comptes pré-existants : avant,
        // image_url n'était posé qu'à la CRÉATION (createOAuth2User). Les comptes liés
        // (LOCAL → Google) ou déjà liés restaient donc sans avatar.
        // Garde élargie : image_url n'est JAMAIS NULL (DEFAULT SQL = placeholder
        // flaticon, V1), donc un simple isBlank() ne se déclenchait jamais. On
        // remplace aussi le placeholder par défaut — mais pas un avatar uploadé custom.
        if (imageUrl != null && !imageUrl.isBlank()
                && isReplaceableAvatar(user.getImageUrl())) {
            userRepository.updateImageUrl(user.getUserId(), imageUrl);
            user.setImageUrl(imageUrl);
        }

        return new CustomOidcUser(oidcUser, user);
    }
}
