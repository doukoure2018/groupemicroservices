package io.multi.authorizationserver.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.multi.authorizationserver.model.User;
import io.multi.authorizationserver.repository.UserRepository;
import io.multi.authorizationserver.security.oauth2.CustomOAuth2User;
import io.multi.authorizationserver.security.oauth2.CustomOAuth2UserService;
import io.multi.authorizationserver.security.oauth2.CustomOidcUser;
import io.multi.authorizationserver.security.oauth2.CustomOidcUserService;
import io.multi.authorizationserver.security.oauth2.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.JdbcRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;  // ← FIXED
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.DelegatingOAuth2TokenGenerator;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.google.common.net.HttpHeaders.X_REQUESTED_WITH;
import static org.springframework.http.HttpHeaders.*;
import static org.springframework.http.HttpMethod.*;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class AuthorizationServerConfig {
    private static final String AUTHORITY_KEY = "authorities";
    private final JwtConfiguration jwtConfiguration;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${UI_APP_URL:https://guidipress-io.com}")
    private String uiAppUrl;

    @Value("${oauth.issuer:http://localhost:8080}")
    private String oauthIssuer;

    private final UserRepository userRepository;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOidcUserService customOidcUserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Bean
    @Order(1)
    public SecurityFilterChain oauth2ServerConfig(HttpSecurity http, RegisteredClientRepository registeredClientRepository, OAuth2TokenCustomizer<JwtEncodingContext> customizer) throws Exception {
        http.cors(corsConfigurer -> corsConfigurer.configurationSource(corsConfigurationSource()));

        var authorizationConfig = new OAuth2AuthorizationServerConfigurer();

        http
                .securityMatcher(authorizationConfig.getEndpointsMatcher())
                .with(authorizationConfig, authorizationServer -> authorizationServer
                        .oidc(Customizer.withDefaults())
                        .authorizationServerSettings(authorizationServerSettings())
                        .registeredClientRepository(registeredClientRepository)
                        .tokenGenerator(tokenGenerator())
                        .clientAuthentication(authentication -> {
                            authentication.authenticationConverter(new ClientRefreshTokenAuthenticationConverter());
                            authentication.authenticationProvider(new ClientAuthenticationProvider(registeredClientRepository));
                        }))
                .authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated());
        http.exceptionHandling(exceptions -> exceptions.accessDeniedPage("/accessdenied")
                .defaultAuthenticationEntryPointFor(new LoginUrlAuthenticationEntryPoint("/login"),
                        new MediaTypeRequestMatcher(MediaType.TEXT_HTML)));
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http, AuthenticationConfiguration authConfig) throws Exception {
        http.cors(corsConfigurer -> corsConfigurer.configurationSource(corsConfigurationSource()));

        http.securityMatcher("/api/**", "/user/**")
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/login").permitAll()
                        .requestMatchers("/api/auth/token", "/api/auth/register", "/api/auth/google", "/api/auth/refresh").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
                        }))
                .addFilterBefore(jsonAuthenticationFilter(authConfig), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain webSecurityFilterChain(HttpSecurity http) throws Exception {
        http.cors(corsConfigurer -> corsConfigurer.configurationSource(corsConfigurationSource()));

        http.securityMatcher("/**")
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/login", "/register", "/forgot-password", "/oauth2/authorize/**", "/oauth2/authorize").permitAll()
                        .requestMatchers(POST, "/register", "/forgot-password").permitAll()
                        .requestMatchers("/login/oauth2/code/**", "/oauth2/**").permitAll()
                        .requestMatchers(POST, "/logout").permitAll()
                        .requestMatchers("/mfa").hasAuthority("MFA_REQUIRED")
                        .anyRequest().authenticated());

        http.formLogin(login -> login
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .successHandler((request, response, authentication) -> {
                    log.info("========================================");
                    log.info("🎉 Login Success Handler");
                    log.info("User: {}", authentication.getName());

                    String mobileOAuthUrl = null;
                    String mobileAuthToken = null;
                    HttpSession session = request.getSession(false);

                    // MÉTHODE 1: Chercher le token dans les paramètres de la requête
                    mobileAuthToken = request.getParameter(MobileOAuthSessionFilter.MOBILE_AUTH_TOKEN_PARAM);
                    log.info("📋 Token from request param: {}", mobileAuthToken);

                    // MÉTHODE 2: Si pas de token dans les params, chercher dans le cookie
                    if (mobileAuthToken == null) {
                        Cookie[] cookies = request.getCookies();
                        if (cookies != null) {
                            for (Cookie cookie : cookies) {
                                if (MobileOAuthSessionFilter.MOBILE_AUTH_TOKEN_PARAM.equals(cookie.getName())) {
                                    mobileAuthToken = cookie.getValue();
                                    log.info("📋 Token from cookie: {}", mobileAuthToken);
                                    break;
                                }
                            }
                        }
                    }

                    // MÉTHODE 3: Si pas de token dans le cookie, chercher dans la session
                    if (mobileAuthToken == null && session != null) {
                        Object tokenObj = session.getAttribute(MobileOAuthSessionFilter.MOBILE_AUTH_TOKEN_PARAM);
                        if (tokenObj != null) {
                            mobileAuthToken = tokenObj.toString();
                            log.info("📋 Token from session: {}", mobileAuthToken);
                        }
                    }

                    // Récupérer l'URL depuis le cache serveur avec le token
                    if (mobileAuthToken != null) {
                        mobileOAuthUrl = MobileOAuthSessionFilter.getOAuthUrlFromCache(mobileAuthToken);
                        if (mobileOAuthUrl != null) {
                            log.info("📱 Found mobile OAuth URL from SERVER CACHE");
                            // Supprimer du cache après utilisation
                            MobileOAuthSessionFilter.removeFromCache(mobileAuthToken);
                        }
                    }

                    // FALLBACK 1: Chercher dans la session
                    if (mobileOAuthUrl == null && session != null) {
                        Object sessionUrl = session.getAttribute(MobileOAuthSessionFilter.MOBILE_AUTH_SESSION_KEY);
                        if (sessionUrl != null && !sessionUrl.toString().isEmpty()) {
                            mobileOAuthUrl = sessionUrl.toString();
                            log.info("📱 Found mobile OAuth URL in SESSION (fallback)");
                        }
                    }

                    // FALLBACK 2: Chercher dans le cookie
                    if (mobileOAuthUrl == null) {
                        Cookie[] cookies = request.getCookies();
                        log.info("📋 Checking cookies for OAuth URL (count: {})", cookies != null ? cookies.length : 0);
                        if (cookies != null) {
                            for (Cookie cookie : cookies) {
                                if (MobileOAuthSessionFilter.MOBILE_AUTH_COOKIE.equals(cookie.getName())) {
                                    mobileOAuthUrl = java.net.URLDecoder.decode(
                                            cookie.getValue(),
                                            java.nio.charset.StandardCharsets.UTF_8
                                    );
                                    log.info("📱 Found mobile OAuth URL in COOKIE (fallback)");
                                    break;
                                }
                            }
                        }
                    }

                    log.info("Final Mobile OAuth URL: {}", mobileOAuthUrl);

                    // Priorité 1: Redirection mobile
                    if (mobileOAuthUrl != null && !mobileOAuthUrl.isEmpty()) {
                        log.info("📱 Redirecting to mobile OAuth URL: {}", mobileOAuthUrl);

                        // Marquer le login comme fait
                        if (session != null) {
                            session.setAttribute("MOBILE_LOGIN_DONE_SESSION", "true");
                        }

                        Cookie loginDoneCookie = new Cookie(MobileOAuthSessionFilter.MOBILE_LOGIN_DONE_COOKIE, "true");
                        loginDoneCookie.setPath("/");
                        loginDoneCookie.setMaxAge(60);
                        loginDoneCookie.setHttpOnly(false);
                        loginDoneCookie.setSecure(request.isSecure());
                        response.addCookie(loginDoneCookie);

                        log.info("✅ Login done markers set, redirecting to OAuth2 flow");
                        response.sendRedirect(mobileOAuthUrl);
                        return;
                    }

                    // Priorité 2: Saved Request standard
                    if (session != null) {
                        SavedRequest savedRequest = (SavedRequest) session.getAttribute("SPRING_SECURITY_SAVED_REQUEST");
                        if (savedRequest != null) {
                            String redirectUrl = savedRequest.getRedirectUrl();
                            log.info("📋 Found saved request: {}", redirectUrl);
                            if (redirectUrl.contains("/oauth2/authorize")) {
                                log.info("➡️ Redirecting to OAuth2 flow");
                                response.sendRedirect(redirectUrl);
                                return;
                            }
                        }
                    }

                    // Vérifier MFA
                    if (authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("MFA_REQUIRED"))) {
                        log.info("🔐 MFA required");
                        response.sendRedirect("/mfa");
                        return;
                    }

                    // Redirection par défaut
                    log.info("🌐 Default redirect to: {}", uiAppUrl);
                    response.sendRedirect(uiAppUrl);
                })
                .failureHandler(new SimpleUrlAuthenticationFailureHandler("/login?error")));

        // OAuth2 Login Configuration for Google
        http.oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                        .userService(customOAuth2UserService)
                        .oidcUserService(customOidcUserService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler((request, response, exception) -> {
                    log.error("OAuth2 authentication failed: {}", exception.getMessage());
                    response.sendRedirect("/login?error=oauth2");
                }));

        http.logout(logout -> logout
                .logoutSuccessUrl(uiAppUrl)
                .addLogoutHandler(new CookieClearingLogoutHandler("JSESSIONID")));

        return http.build();
    }

    @Bean
    public JsonAuthenticationFilter jsonAuthenticationFilter(AuthenticationConfiguration authConfig) throws Exception {
        JsonAuthenticationFilter filter = new JsonAuthenticationFilter();
        filter.setAuthenticationManager(authConfig.getAuthenticationManager());
        filter.setRequiresAuthenticationRequestMatcher(new AntPathRequestMatcher("/api/login", "POST"));

        filter.setAuthenticationSuccessHandler((request, response, authentication) -> {
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\": \"success\", \"message\": \"Authentication successful\"}");
        });

        filter.setAuthenticationFailureHandler((request, response, exception) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\": \"error\", \"message\": \"" + exception.getMessage() + "\"}");
        });

        return filter;
    }

    public class JsonAuthenticationFilter extends UsernamePasswordAuthenticationFilter {
        @Override
        public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
                throws AuthenticationException {
            if (!request.getMethod().equals("POST")) {
                throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
            }

            try {
                Map<String, String> credentials = objectMapper.readValue(
                        request.getInputStream(),
                        new TypeReference<Map<String, String>>() {}
                );

                String username = credentials.getOrDefault(getUsernameParameter(), "");
                String password = credentials.getOrDefault(getPasswordParameter(), "");

                UsernamePasswordAuthenticationToken authRequest =
                        UsernamePasswordAuthenticationToken.unauthenticated(username, password);

                setDetails(request, authRequest);

                return this.getAuthenticationManager().authenticate(authRequest);
            } catch (IOException e) {
                throw new AuthenticationServiceException("Authentication failed: " + e.getMessage(), e);
            }
        }
    }

    @Bean
    public OAuth2TokenGenerator<? extends OAuth2Token> tokenGenerator() {
        var jwtGenerator = UserJwtGenerator.init(new NimbusJwtEncoder((jwtConfiguration.jwkSource())));
        jwtGenerator.setJwtCustomizer(customizer());
        OAuth2TokenGenerator<OAuth2RefreshToken> refreshTokenOAuth2TokenGenerator = new ClientOAuth2RefreshTokenGenerator();
        return new DelegatingOAuth2TokenGenerator(jwtGenerator, refreshTokenOAuth2TokenGenerator);
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
                .issuer(oauthIssuer)  // ← Utiliser la variable
                .build();
    }

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> customizer() {
        return context -> {
            Authentication principal = context.getPrincipal();

            // Add authorities and user_id to access token
            if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
                context.getClaims().claims(claims ->
                        claims.put(AUTHORITY_KEY, getAuthoritiesAsString(context))
                );

                // Add user_id to access token for microservices
                try {
                    Object principalObj = principal.getPrincipal();
                    User user = extractUser(principalObj);

                    if (user != null && user.getUserId() != null) {
                        context.getClaims()
                                .claim("user_id", user.getUserId())
                                .claim("user_uuid", user.getUserUuid());
                        log.debug("✅ Added user_id={} and user_uuid={} to access token",
                                user.getUserId(), user.getUserUuid());
                    }
                } catch (Exception e) {
                    log.warn("⚠️ Could not add user_id to access token: {}", e.getMessage());
                }
            }

            // Add user info to ID token for Flutter app
            if (OidcParameterNames.ID_TOKEN.equals(context.getTokenType().getValue())) {
                try {
                    Object principalObj = principal.getPrincipal();
                    User user = extractUser(principalObj);

                    if (user != null) {
                        log.info("✅ Adding user claims to ID token for user: {} (ID: {})",
                                user.getEmail(), user.getUserId());

                        context.getClaims()
                                .claim("sub", user.getUserId().toString())
                                .claim("name", user.getFirstName() + " " + user.getLastName())
                                .claim("given_name", user.getFirstName())
                                .claim("family_name", user.getLastName())
                                .claim("email", user.getEmail())
                                .claim("preferred_username", user.getEmail());
                    } else {
                        log.warn("⚠️ Could not extract User from principal: {}", principalObj.getClass().getName());
                    }
                } catch (Exception e) {
                    log.error("❌ Error adding user claims to ID token: {}", e.getMessage(), e);
                }
            }
        };
    }

    private User extractUser(Object principal) {
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof CustomOidcUser customOidcUser) {
            return customOidcUser.getUser();
        }
        if (principal instanceof CustomOAuth2User customOAuth2User) {
            return customOAuth2User.getUser();
        }
        return null;
    }

    // Method for access token authorities (returns String)
    private String getAuthoritiesAsString(JwtEncodingContext context) {
        return context.getPrincipal().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
    }


    @Bean
    public RegisteredClientRepository registeredClientRepository(JdbcTemplate jdbcTemplate) {
        JdbcRegisteredClientRepository repository = new JdbcRegisteredClientRepository(jdbcTemplate);

        // Check if mobile client exists, if not create it
        try {
            RegisteredClient existingClient = repository.findByClientId("mobile-app-client");
            if (existingClient == null) {
                RegisteredClient mobileClient = RegisteredClient.withId(UUID.randomUUID().toString())
                        .clientId("mobile-app-client")
                        .clientName("Billetterie GN Mobile App")
                        .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                        .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                        .redirectUri("com.billetterie.gn://oauth2redirect")
                        .postLogoutRedirectUri("com.billetterie.gn://oauth2redirect")
                        .scope(OidcScopes.OPENID)
                        .scope(OidcScopes.PROFILE)
                        .scope(OidcScopes.EMAIL)
                        .clientSettings(ClientSettings.builder()
                                .requireProofKey(true)
                                .requireAuthorizationConsent(false)
                                .build())
                        .tokenSettings(TokenSettings.builder()
                                .accessTokenTimeToLive(Duration.ofHours(1))
                                .refreshTokenTimeToLive(Duration.ofDays(30))
                                .reuseRefreshTokens(false)
                                .build())
                        .build();

                repository.save(mobileClient);
                log.info("Mobile client registered successfully");
            } else {
                log.info("Mobile client already exists");
            }
        } catch (Exception e) {
            log.error("Error checking/creating mobile client: {}", e.getMessage());
        }

        return repository;
    }



    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.setAllowedOrigins(List.of(
                "http://localhost:4202",
                "https://guidipress-io.com",
                "https://www.guidipress-io.com",
                "http://guidipress-io.com",
                "http://www.guidipress-io.com",
                // Add mobile origins
                "http://localhost", // For local mobile testing
                "capacitor://localhost",
                "com.billetterie.gn://"  // Mobile app scheme
        ));
        corsConfiguration.setAllowedHeaders(Arrays.asList(
                ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE,
                ACCEPT, AUTHORIZATION, X_REQUESTED_WITH,
                ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS,
                ACCESS_CONTROL_ALLOW_CREDENTIALS, "X-XSRF-TOKEN"
        ));
        corsConfiguration.setExposedHeaders(Arrays.asList(
                ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE,
                ACCEPT, AUTHORIZATION, X_REQUESTED_WITH,
                ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS,
                ACCESS_CONTROL_ALLOW_CREDENTIALS
        ));
        corsConfiguration.setAllowedMethods(Arrays.asList(
                GET.name(), POST.name(), PUT.name(), PATCH.name(),
                DELETE.name(), OPTIONS.name()
        ));
        corsConfiguration.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }

    private String getAuthorities(JwtEncodingContext context) {
        return context.getPrincipal().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
    }
}
