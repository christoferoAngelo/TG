package com.eva.locafesta.core;

import com.eva.locafesta.termo.TermosAceiteFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final FirebaseFilter firebaseFilter;
    private final TermosAceiteFilter termosAceiteFilter;

    public SecurityConfig(FirebaseFilter firebaseFilter, TermosAceiteFilter termosAceiteFilter) {
        this.firebaseFilter = firebaseFilter;
        this.termosAceiteFilter = termosAceiteFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 1. Libera requisições OPTIONS (Pre-flight do CORS)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 2. Libera rotas específicas por método HTTP
                .requestMatchers(HttpMethod.POST, "/api/users/admin").permitAll()
                
                // 3. Libera características e erros
                .requestMatchers("/api/caracteristicas", "/api/caracteristicas/**").permitAll()
                .requestMatchers("/error", "/error/**").permitAll()
                
                // 4. Libera todas as rotas de negócio, reservas e auditoria
                .requestMatchers(
                    "/api/users", "/api/users/**", 
                    "/api/locadores", "/api/locadores/**",
                    "/api/locador", "/api/locador/**", 
                    "/api/locatarios", "/api/locatarios/**",
                    "/api/espacos", "/api/espacos/**", 
                    "/api/reservas", "/api/reservas/**",
                    "/api/notificacoes", "/api/notificacoes/**",
                    "/api/favoritos", "/api/favoritos/**",
                    "/api/admin", "/api/admin/**",
                    "/api/pagamento", "/api/pagamento/**",
                    "/api/v1/pagamentos", "/api/v1/pagamentos/**",
                    "/api/v1/**", "/api/v1/pagamentos/criar-preferencia",
                    "/api/logs-auditoria", "/api/logs-auditoria/**",
                    // Documentação do espaço/usuário (mesma política das demais APIs de negócio)
                    "/documentos", "/documentos/**",
                    "/api/documentos", "/api/documentos/**",
                    // Termos: vigente público; aceitar/pendente e admin validam no serviço (Firebase)
                    "/api/termos", "/api/termos/**"
                ).permitAll()
                
                // 5. Demais rotas exigem autenticação
                .anyRequest().authenticated()
            )
            .addFilterBefore(firebaseFilter, UsernamePasswordAuthenticationFilter.class)
            // Depois do Firebase: exige aceite dos Termos vigentes (exceto allowlist / admin)
            .addFilterAfter(termosAceiteFilter, FirebaseFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        
        // Permite todos os cabeçalhos padrão e explicitamente o Usuario-Id usado no backend
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Usuario-Id", "*"));
        configuration.setExposedHeaders(Arrays.asList("Usuario-Id"));
        
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}