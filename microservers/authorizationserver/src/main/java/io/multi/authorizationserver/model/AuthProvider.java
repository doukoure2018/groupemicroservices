package io.multi.authorizationserver.model;

/**
 * Enum representing the authentication providers supported by the application.
 */
public enum AuthProvider {
    LOCAL,      // Traditional email/password authentication
    GOOGLE,     // Google OAuth2
    FACEBOOK,   // Facebook OAuth2 (for future use)
    APPLE       // Apple Sign In (for future use)
}
