package io.multi.authorizationserver.security.oauth2;

import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import io.multi.authorizationserver.security.MobileOAuthSessionFilter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Success handler for OAuth2 authentication.
 * After successful Google authentication, this handler:
 * 1. Replaces the OAuth2 authentication with a UsernamePasswordAuthenticationToken containing our User object
 * 2. Redirects to the OAuth2 authorization flow if there's a saved request
 * 3. Otherwise redirects to the UI application
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @Value("${UI_APP_URL:http://localhost:4202}")
    private String uiAppUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        log.info("========================================");
        log.info("OAuth2 Authentication Success Handler");

        User user = extractUser(authentication.getPrincipal());
        if (user != null) {
            log.info("OAuth2 User authenticated: {} (ID: {})", user.getEmail(), user.getUserId());

            // Update last login
            try {
                userRepository.setLastLogin(user.getUserId());
            } catch (Exception e) {
                log.warn("Failed to update last login: {}", e.getMessage());
            }

            // Create a new authentication with our User object as principal
            // This is important for the JWT token generation to work correctly
            String role = user.getRole();
            if (role != null && !role.startsWith("ROLE_")) {
                role = "ROLE_" + role;
            }

            UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(
                    user,  // Our User object as principal
                    null,  // No credentials
                    List.of(new SimpleGrantedAuthority(role != null ? role : "ROLE_USER"))
            );

            // Replace the authentication in the security context
            SecurityContextHolder.getContext().setAuthentication(newAuth);
            log.info("Replaced OAuth2 authentication with UsernamePasswordAuthenticationToken");

            // Check for mobile OAuth URL using multiple methods
            String mobileOAuthUrl = null;
            String mobileAuthToken = null;
            HttpSession session = request.getSession(false);
            Cookie[] cookies = request.getCookies();

            // Method 1: Get token from request parameter
            mobileAuthToken = request.getParameter(MobileOAuthSessionFilter.MOBILE_AUTH_TOKEN_PARAM);
            log.info("Token from request param: {}", mobileAuthToken);

            // Method 2: Get token from cookie
            if (mobileAuthToken == null && cookies != null) {
                for (Cookie cookie : cookies) {
                    if (MobileOAuthSessionFilter.MOBILE_AUTH_TOKEN_PARAM.equals(cookie.getName())) {
                        mobileAuthToken = cookie.getValue();
                        log.info("Token from cookie: {}", mobileAuthToken);
                        break;
                    }
                }
            }

            // Method 3: Get token from session
            if (mobileAuthToken == null && session != null) {
                Object tokenObj = session.getAttribute(MobileOAuthSessionFilter.MOBILE_AUTH_TOKEN_PARAM);
                if (tokenObj != null) {
                    mobileAuthToken = tokenObj.toString();
                    log.info("Token from session: {}", mobileAuthToken);
                }
            }

            // Get OAuth URL from server cache using token
            if (mobileAuthToken != null) {
                mobileOAuthUrl = MobileOAuthSessionFilter.getOAuthUrlFromCache(mobileAuthToken);
                if (mobileOAuthUrl != null) {
                    log.info("Found mobile OAuth URL from SERVER CACHE");
                    MobileOAuthSessionFilter.removeFromCache(mobileAuthToken);
                }
            }

            // Fallback 1: Check session
            if (mobileOAuthUrl == null && session != null) {
                Object sessionUrl = session.getAttribute(MobileOAuthSessionFilter.MOBILE_AUTH_SESSION_KEY);
                if (sessionUrl != null && !sessionUrl.toString().isEmpty()) {
                    mobileOAuthUrl = sessionUrl.toString();
                    log.info("Found mobile OAuth URL in SESSION (fallback)");
                }
            }

            // Fallback 2: Check cookie
            if (mobileOAuthUrl == null && cookies != null) {
                for (Cookie cookie : cookies) {
                    if (MobileOAuthSessionFilter.MOBILE_AUTH_COOKIE.equals(cookie.getName())) {
                        mobileOAuthUrl = java.net.URLDecoder.decode(
                                cookie.getValue(), StandardCharsets.UTF_8
                        );
                        log.info("Found mobile OAuth URL in COOKIE (fallback)");
                        break;
                    }
                }
            }

            // Priority 1: Mobile OAuth redirect
            if (mobileOAuthUrl != null && !mobileOAuthUrl.isEmpty()) {
                log.info("Redirecting to mobile OAuth URL: {}", mobileOAuthUrl);

                if (session != null) {
                    session.setAttribute("MOBILE_LOGIN_DONE_SESSION", "true");
                }

                Cookie loginDoneCookie = new Cookie(MobileOAuthSessionFilter.MOBILE_LOGIN_DONE_COOKIE, "true");
                loginDoneCookie.setPath("/");
                loginDoneCookie.setMaxAge(60);
                loginDoneCookie.setHttpOnly(false);
                loginDoneCookie.setSecure(request.isSecure());
                response.addCookie(loginDoneCookie);
                response.sendRedirect(mobileOAuthUrl);
                return;
            }

            // Priority 2: Saved Request (OAuth2 authorization flow)
            if (session != null) {
                SavedRequest savedRequest = (SavedRequest) session.getAttribute("SPRING_SECURITY_SAVED_REQUEST");
                if (savedRequest != null) {
                    String redirectUrl = savedRequest.getRedirectUrl();
                    log.info("Found saved request: {}", redirectUrl);
                    if (redirectUrl.contains("/oauth2/authorize")) {
                        log.info("Redirecting to OAuth2 authorization flow");
                        response.sendRedirect(redirectUrl);
                        return;
                    }
                }
            }

            // Default: Redirect to UI application
            log.info("Default redirect to: {}", uiAppUrl);
            response.sendRedirect(uiAppUrl);

        } else {
            // Fallback to default behavior
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private User extractUser(Object principal) {
        if (principal instanceof CustomOidcUser customOidcUser) {
            return customOidcUser.getUser();
        }
        if (principal instanceof CustomOAuth2User customOAuth2User) {
            return customOAuth2User.getUser();
        }
        return null;
    }
}
