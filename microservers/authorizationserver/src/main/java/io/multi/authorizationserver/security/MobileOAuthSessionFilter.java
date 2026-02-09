package io.multi.authorizationserver.security;


import jakarta.servlet.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MobileOAuthSessionFilter implements Filter {

    private static final String MOBILE_CLIENT_ID = "mobile-app-client";
    public static final String MOBILE_AUTH_COOKIE = "MOBILE_OAUTH_URL";
    public static final String MOBILE_LOGIN_DONE_COOKIE = "MOBILE_LOGIN_DONE";
    public static final String MOBILE_AUTH_SESSION_KEY = "MOBILE_OAUTH_URL_SESSION";
    public static final String MOBILE_AUTH_TOKEN_PARAM = "mobile_auth_token";

    // Cache côté serveur pour stocker les URLs OAuth (solution la plus robuste)
    // Clé: token unique, Valeur: URL OAuth + timestamp
    private static final ConcurrentHashMap<String, CachedOAuthUrl> oauthUrlCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = TimeUnit.MINUTES.toMillis(5);

    private static class CachedOAuthUrl {
        final String url;
        final long timestamp;

        CachedOAuthUrl(String url) {
            this.url = url;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }

    // Méthode statique pour récupérer l'URL depuis le cache
    public static String getOAuthUrlFromCache(String token) {
        if (token == null) return null;
        CachedOAuthUrl cached = oauthUrlCache.get(token);
        if (cached != null && !cached.isExpired()) {
            return cached.url;
        }
        return null;
    }

    // Méthode statique pour supprimer l'URL du cache
    public static void removeFromCache(String token) {
        if (token != null) {
            oauthUrlCache.remove(token);
        }
    }

    // Nettoyage périodique des entrées expirées
    private void cleanupExpiredEntries() {
        oauthUrlCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String requestUri = httpRequest.getRequestURI();

        // Intercepter les requêtes OAuth2 authorize
        if (requestUri.contains("/oauth2/authorize")) {
            String clientId = httpRequest.getParameter("client_id");
            String redirectUri = httpRequest.getParameter("redirect_uri");

            log.info("========================================");
            log.info("🔐 OAuth2 Authorize Request");
            log.info("Client ID: {}", clientId);
            log.info("Redirect URI: {}", redirectUri);

            // Détecter requête mobile
            boolean isMobileRequest = MOBILE_CLIENT_ID.equals(clientId) ||
                    (redirectUri != null && redirectUri.startsWith("com.billetterie.gn://"));

            if (isMobileRequest) {
                log.info("📱 MOBILE REQUEST DETECTED");

                // Vérifier si on vient du success handler (login déjà fait)
                boolean loginJustCompleted = hasCookie(httpRequest, MOBILE_LOGIN_DONE_COOKIE) ||
                        hasSessionAttribute(httpRequest, "MOBILE_LOGIN_DONE_SESSION");
                log.info("🔍 Login just completed: {}", loginJustCompleted);

                if (loginJustCompleted) {
                    // On vient du login - laisser passer sans toucher à rien
                    log.info("✅ Post-login OAuth2 request - letting through");

                    // Supprimer les cookies et attributs session
                    clearCookie(httpResponse, MOBILE_LOGIN_DONE_COOKIE);
                    clearCookie(httpResponse, MOBILE_AUTH_COOKIE);
                    HttpSession session = httpRequest.getSession(false);
                    if (session != null) {
                        session.removeAttribute("MOBILE_LOGIN_DONE_SESSION");
                        session.removeAttribute(MOBILE_AUTH_SESSION_KEY);
                    }

                    log.info("========================================");
                    chain.doFilter(request, response);
                    return;
                }

                // Première requête - sauvegarder l'URL et forcer le login
                log.info("🔒 First OAuth2 request - saving URL and forcing login");

                // Nettoyer les entrées expirées
                cleanupExpiredEntries();

                // Construire l'URL OAuth2 complète
                String fullOAuthUrl = httpRequest.getRequestURL().toString();
                String queryString = httpRequest.getQueryString();
                if (queryString != null) {
                    fullOAuthUrl += "?" + queryString;
                }
                log.info("📎 Saving OAuth URL: {}", fullOAuthUrl);

                // SOLUTION 1: Générer un token unique et stocker dans le cache serveur
                String authToken = UUID.randomUUID().toString();
                oauthUrlCache.put(authToken, new CachedOAuthUrl(fullOAuthUrl));
                log.info("✅ OAuth URL saved to server cache with token: {}", authToken);

                // SOLUTION 2: Sauvegarder dans la SESSION (backup)
                HttpSession session = httpRequest.getSession(true);
                session.setAttribute(MOBILE_AUTH_SESSION_KEY, fullOAuthUrl);
                session.setAttribute(MOBILE_AUTH_TOKEN_PARAM, authToken);
                log.info("✅ OAuth URL also saved to session, session ID: {}", session.getId());

                // SOLUTION 3: Sauvegarder aussi dans un COOKIE (backup)
                String encodedUrl = URLEncoder.encode(fullOAuthUrl, StandardCharsets.UTF_8);
                Cookie mobileAuthCookie = new Cookie(MOBILE_AUTH_COOKIE, encodedUrl);
                mobileAuthCookie.setPath("/");
                mobileAuthCookie.setMaxAge(300);
                mobileAuthCookie.setHttpOnly(false);
                mobileAuthCookie.setSecure(httpRequest.isSecure());
                httpResponse.addCookie(mobileAuthCookie);

                // Stocker aussi le token dans un cookie
                Cookie tokenCookie = new Cookie(MOBILE_AUTH_TOKEN_PARAM, authToken);
                tokenCookie.setPath("/");
                tokenCookie.setMaxAge(300);
                tokenCookie.setHttpOnly(false);
                tokenCookie.setSecure(httpRequest.isSecure());
                httpResponse.addCookie(tokenCookie);
                log.info("✅ OAuth URL and token saved to cookies");

                // Log tous les cookies actuels pour debug
                logCurrentCookies(httpRequest);

                // Effacer le contexte de sécurité pour forcer un nouveau login
                SecurityContextHolder.clearContext();
                session.removeAttribute("SPRING_SECURITY_CONTEXT");

                log.info("✅ Security context cleared, redirecting to login with token");

                // Rediriger vers /login avec le token comme paramètre
                httpResponse.sendRedirect("/login?mobile_auth_token=" + authToken);
                return;
            }
            log.info("========================================");
        }

        chain.doFilter(request, response);
    }

    private boolean hasSessionAttribute(HttpServletRequest request, String attributeName) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object value = session.getAttribute(attributeName);
            return value != null && !"".equals(value.toString());
        }
        return false;
    }

    private void logCurrentCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            log.info("📋 Current cookies ({}):", cookies.length);
            for (Cookie cookie : cookies) {
                log.info("  - {}: {} (path: {})", cookie.getName(),
                    cookie.getName().contains("SESSION") ? "[hidden]" : cookie.getValue(),
                    cookie.getPath());
            }
        } else {
            log.info("📋 No cookies in request");
        }
    }

    private boolean hasCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName()) && !"".equals(cookie.getValue())) {
                    return true;
                }
            }
        }
        return false;
    }

    private void clearCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
