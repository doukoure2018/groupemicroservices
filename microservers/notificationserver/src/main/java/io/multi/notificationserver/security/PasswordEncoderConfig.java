package io.multi.notificationserver.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class PasswordEncoderConfig {
    public static final int STRENGTH = 12;

    @Bean
    public BCryptPasswordEncoder encoder() {
        return new BCryptPasswordEncoder(STRENGTH);
    }
}
