package io.multi.immobilierservice.securite;

import io.multi.immobilierservice.handler.CustomAccessDeniedHandler;
import io.multi.immobilierservice.handler.CustomAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

import static com.google.common.net.HttpHeaders.X_REQUESTED_WITH;
import static org.springframework.http.HttpHeaders.*;
import static org.springframework.http.HttpMethod.*;

@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity                    // active @PreAuthorize
@RequiredArgsConstructor
public class ResourceServerConfig {

    /**
     * Forme d'un UUID. Sert à n'ouvrir au public que les fiches désignées par un
     * identifiant, jamais un chemin nommé comme mes-proprietes ou moderation.
     */
    private static final String MOTIF_UUID =
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

    @Value("${jwks.uri}")
    private String jwtSetUri;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/immo/health"
                        ).permitAll()
                        // GET publics : consultation libre (sans JWT)
                        // Listes et référentiels : aucun identifiant, rien de nominatif.
                        .requestMatchers(HttpMethod.GET,
                                "/immo/agences",
                                "/immo/proprietes/recherche",
                                "/immo/types-bien",
                                "/immo/commodites"
                        ).permitAll()
                        // Fiches qui se lisent sans compte. Expression régulière et non
                        // joker : seul un UUID passe. Les jokers "/immo/agences/*",
                        // "/immo/proprietes/*" et "/immo/profils/*" rendaient publics
                        // mes-agences, mes-proprietes, moderation, admin et me — et
                        // rendront public tout chemin nommé ajouté demain.
                        // Les profils ne sont plus publics : ils portent le téléphone du
                        // vendeur et le lien de ses pièces KYC, et "/immo/profils/user/{id}"
                        // se parcourait par identifiant croissant, sans aucun jeton.
                        // DOIT rester aligné entre la gateway et immobilierservice.
                        .requestMatchers(RegexRequestMatcher.regexMatcher(HttpMethod.GET,
                                "^/immo/(agences/" + MOTIF_UUID + "(/agents)?"
                                        + "|proprietes/" + MOTIF_UUID + "(/photos)?"
                                        + "|photos/" + MOTIF_UUID + ")$")).permitAll()
                        // Toutes les routes /immo/agences/invitations/** sont privées (JWT requis)
                        .requestMatchers("/immo/agences/invitations/**").authenticated()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .accessDeniedHandler(new CustomAccessDeniedHandler())
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
                        .jwt(jwt -> jwt.jwkSetUri(jwtSetUri)
                                .jwtAuthenticationConverter(new JwtConverter())));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.setAllowedOrigins(List.of("http://localhost:9000", "http://localhost:4202"));
        corsConfiguration.setAllowedHeaders(Arrays.asList(
                ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE, ACCEPT, AUTHORIZATION,
                X_REQUESTED_WITH, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS,
                ACCESS_CONTROL_ALLOW_CREDENTIALS));
        corsConfiguration.setExposedHeaders(Arrays.asList(
                ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE, ACCEPT, AUTHORIZATION,
                X_REQUESTED_WITH, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS,
                ACCESS_CONTROL_ALLOW_CREDENTIALS));
        corsConfiguration.setAllowedMethods(Arrays.asList(
                GET.name(), POST.name(), PUT.name(), PATCH.name(), DELETE.name(), OPTIONS.name()));
        corsConfiguration.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}
