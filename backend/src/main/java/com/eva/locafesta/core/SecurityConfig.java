package com.eva.locafesta.core;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

@Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Desativamos o CSRF
            .csrf(csrf -> csrf.disable())
            
            // Ativamos o CORS corretamente
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Definimos as permissões
            .authorizeHttpRequests(auth -> auth
                    // AQUI É O SEGREDO: Adicionamos /api/locadores aqui
                    .requestMatchers(
                        "/api/users", 
                        "/api/users/**", 
                        "/api/locadores", 
                        "/api/locadores/**", 
                        "/error"
                    ).permitAll() 
                    
                    // Qualquer outra rota precisa de autenticação
                    .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Permite origens do Frontend
        configuration.setAllowedOrigins(Arrays.asList("*")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}