package com.eva.locafesta.core;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // 1. OBRIGATÓRIO: Libera requisições OPTIONS (Pre-flight do CORS no React/Navegador)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 2. Libera explicitamente a raiz e os sub-caminhos de características
                .requestMatchers("/api/caracteristicas", "/api/caracteristicas/**").permitAll()
                
                // 3. Libera os demais endpoints do sistema
                .requestMatchers(
                    "/api/users", "/api/users/**", 
                    "/api/locadores", "/api/locadores/**", 
                    "/api/locatarios", "/api/locatarios/**",
                    "/api/espacos", "/api/espacos/**", 
                    "/error", "/error/**"
                ).permitAll()
                
                // Qualquer outra rota precisará de autenticação
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // NO SPRING BOOT 3: Use OriginPatterns no lugar de AllowedOrigins para evitar bloqueio 403
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); 
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}