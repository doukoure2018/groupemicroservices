package io.multi.discoveryserver;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


@EnableEurekaServer
@SpringBootApplication
public class DiscoveryserverApplication {

	public static void main(String[] args) {
		SpringApplication.run(DiscoveryserverApplication.class, args);
	}

	@Bean
	public CommandLineRunner startup(BCryptPasswordEncoder encoder) {
		return args -> {
			var password = encoder.encode("manager2711");
			System.out.println(password);
		};
	}
}
