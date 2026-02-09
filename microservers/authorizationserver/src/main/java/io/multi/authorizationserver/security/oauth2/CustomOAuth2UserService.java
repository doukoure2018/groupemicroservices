package io.multi.authorizationserver.security.oauth2;

import io.multi.authorizationserver.model.AuthProvider;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Custom OAuth2UserService that handles Google OAuth2 authentication.
 * This service is called after successful OAuth2 authentication with Google.
 * It either finds an existing user or creates a new one based on the Google profile.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        log.info("OAuth2 login attempt with provider: {}", registrationId);

        try {
            return processOAuth2User(userRequest, oauth2User);
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user: {}", ex.getMessage(), ex);
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("processing_error", ex.getMessage(), null)
            );
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if ("google".equalsIgnoreCase(registrationId)) {
            return processGoogleUser(oauth2User);
        }

        throw new OAuth2AuthenticationException(
                new OAuth2Error("unsupported_provider",
                        "OAuth2 provider " + registrationId + " is not supported", null)
        );
    }

    private CustomOAuth2User processGoogleUser(OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();

        String googleId = (String) attributes.get("sub");
        String email = (String) attributes.get("email");
        String firstName = (String) attributes.get("given_name");
        String lastName = (String) attributes.get("family_name");
        String imageUrl = (String) attributes.get("picture");

        log.info("Processing Google user: email={}, googleId={}", email, googleId);

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
                log.info("Creating new user from Google account: {}", email);
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

        return new CustomOAuth2User(oauth2User, user);
    }
}
