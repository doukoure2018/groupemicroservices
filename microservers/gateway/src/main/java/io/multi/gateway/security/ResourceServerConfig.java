package io.multi.gateway.security;


import io.multi.gateway.handler.GatewayAccessDeniedHandler;
import io.multi.gateway.handler.GatewayAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

import static com.google.common.net.HttpHeaders.X_REQUESTED_WITH;
import static org.springframework.http.HttpHeaders.*;
import static org.springframework.http.HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS;
import static org.springframework.http.HttpMethod.*;
import static org.springframework.http.HttpMethod.OPTIONS;

@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class ResourceServerConfig {
    @Value("${jwks.uri}")
    private String jwtSetUri;

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationProxyChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/authorization/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.disable())
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests( authorize -> authorize
                        // #28 : /error en permitAll pour que les forwards internes
                        // (downstream 5xx, ConnectException sur service down, etc.) sortent
                        // avec le vrai statut HTTP et le bon corps d'erreur — pas un 401
                        // trompeur "You are not logged in" qui masque la cause réelle.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health","/actuator/info","/user/register/**", "/user/verify/account/**","/user/verify/password/**", "/user/resetpassword/**", "/user/image/**").permitAll()
                        // FUITE RGPD #24 corrigée : "user/getUser/**" RETIRÉ du permitAll public.
                        // Quiconque sans JWT lisait email/phone/firstName/lastName d'un user par ID
                        // via api.guidipress-io.com/user/getUser/<id>. Désormais 401 sans JWT.
                        // Userservice direct (via Feign Eureka interne) reste permitAll côté
                        // userservice/ResourceServerConfig — Feign continue à marcher sans M2M token.
                        // Défense en profondeur : compose hardening loopback ferme aussi userservice
                        // direct depuis internet (commit 9901dec).
                        // --- Phase 13a : immo public alignment ---
                        // DOIT rester strictement aligné avec immobilierservice ResourceServerConfig.
                        // Toute divergence = 401 sur du public (bug SEO/découverte) OU fuite (public où ça ne devrait pas l'être).
                        .requestMatchers("/immo/health").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/immo/agences",
                                "/immo/agences/*",
                                "/immo/agences/*/agents",
                                "/immo/profils/*",
                                "/immo/profils/user/*",
                                "/immo/proprietes/recherche",
                                "/immo/proprietes/*",
                                "/immo/proprietes/*/photos",
                                "/immo/types-bien",
                                "/immo/commodites",
                                "/immo/photos/*"                    // Phase 13b serve photo reverse-proxy
                        ).permitAll()
                        // --- Recherche billetterie publique (home web, avant login) ---
                        // DOIT rester strictement aligné avec billetterieservice ResourceServerConfig.
                        // Volontairement SANS joker /billetterie/offres/* : il rendrait publics
                        // mes-offres, stats, etc. (endpoints nominatifs → NPE/fuite sans JWT).
                        .requestMatchers(HttpMethod.GET,
                                "/billetterie/villes/active",
                                "/billetterie/offres/recherche"
                        ).permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .accessDeniedHandler(new GatewayAccessDeniedHandler())
                        .authenticationEntryPoint(new GatewayAuthenticationEntryPoint())
                        .jwt(jwt -> jwt.jwkSetUri(jwtSetUri)
                                .jwtAuthenticationConverter(new JwtConverter())));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource()
    {
        var corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:4200",
                "http://localhost:4202",
                "https://sira-guinee.com",
                "https://www.sira-guinee.com",
                "https://test.sira-guinee.com",
                "https://api.sira-guinee.com",
                "https://api-test.sira-guinee.com"
        ));
        corsConfiguration.setAllowedHeaders(Arrays.asList(ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE, ACCEPT, AUTHORIZATION, X_REQUESTED_WITH, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS, ACCESS_CONTROL_ALLOW_CREDENTIALS));
        corsConfiguration.setExposedHeaders(Arrays.asList(ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE, ACCEPT, AUTHORIZATION, X_REQUESTED_WITH, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS, ACCESS_CONTROL_ALLOW_CREDENTIALS));
        corsConfiguration.setAllowedMethods(Arrays.asList(GET.name(), POST.name(), PUT.name(), PATCH.name(), DELETE.name(), OPTIONS.name()));
        corsConfiguration.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}
