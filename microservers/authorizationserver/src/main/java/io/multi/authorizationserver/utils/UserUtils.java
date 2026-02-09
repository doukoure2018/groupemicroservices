package io.multi.authorizationserver.utils;


import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.security.oauth2.CustomOAuth2User;
import io.multi.authorizationserver.security.oauth2.CustomOidcUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationToken;

public class UserUtils {

    public static boolean verifyQrCode(String secret,String code){
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator,timeProvider);
        return verifier.isValidCode(secret,code);
    }

    public static User getUser(Authentication authentication){
        if (authentication instanceof OAuth2AuthorizationCodeRequestAuthenticationToken oauthToken) {
            Object principal = oauthToken.getPrincipal();

            // Handle UsernamePasswordAuthenticationToken (standard login)
            if (principal instanceof UsernamePasswordAuthenticationToken upat) {
                return extractUserFromPrincipal(upat.getPrincipal());
            }

            // Handle OAuth2AuthenticationToken (Google login)
            if (principal instanceof OAuth2AuthenticationToken oauth2Token) {
                return extractUserFromPrincipal(oauth2Token.getPrincipal());
            }

            // Try direct extraction
            return extractUserFromPrincipal(principal);
        }

        // Direct authentication principal
        return extractUserFromPrincipal(authentication.getPrincipal());
    }

    private static User extractUserFromPrincipal(Object principal) {
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof CustomOidcUser customOidcUser) {
            return customOidcUser.getUser();
        }
        if (principal instanceof CustomOAuth2User customOAuth2User) {
            return customOAuth2User.getUser();
        }
        throw new IllegalStateException("Cannot extract User from principal of type: " +
                (principal != null ? principal.getClass().getName() : "null"));
    }
}

