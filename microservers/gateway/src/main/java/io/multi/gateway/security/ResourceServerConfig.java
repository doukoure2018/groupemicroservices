package io.multi.gateway.security;


import io.multi.gateway.handler.GatewayAccessDeniedHandler;
import io.multi.gateway.handler.GatewayAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests( authorize -> authorize
                        .requestMatchers("/actuator/health","/actuator/info","/user/register/**", "/user/verify/account/**","/user/verify/password/**", "/user/resetpassword/**", "/user/image/**","user/getUser/**").permitAll()
                        .requestMatchers("/authorization/**").permitAll()
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
        corsConfiguration.setAllowedOrigins(List.of( "http://localhost:3000","http://localhost:4202","https://guidipress-io.com","https://www.guidipress-io.com","http://guidipress-io.com"));
        corsConfiguration.setAllowedHeaders(Arrays.asList(ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE, ACCEPT, AUTHORIZATION, X_REQUESTED_WITH, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS, ACCESS_CONTROL_ALLOW_CREDENTIALS));
        corsConfiguration.setExposedHeaders(Arrays.asList(ORIGIN, ACCESS_CONTROL_ALLOW_ORIGIN, CONTENT_TYPE, ACCEPT, AUTHORIZATION, X_REQUESTED_WITH, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS, ACCESS_CONTROL_ALLOW_CREDENTIALS));
        corsConfiguration.setAllowedMethods(Arrays.asList(GET.name(), POST.name(), PUT.name(), PATCH.name(), DELETE.name(), OPTIONS.name()));
        corsConfiguration.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}
