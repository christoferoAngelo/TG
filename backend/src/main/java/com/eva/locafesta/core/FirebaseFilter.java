package com.eva.locafesta.core;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class FirebaseFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        System.out.println("========================================");
        System.out.println("FIREBASE FILTER");
        System.out.println("URI: " + request.getRequestURI());
        System.out.println("METHOD: " + request.getMethod());

        String authorization = request.getHeader("Authorization");

        System.out.println(
                "AUTHORIZATION: " +
                (authorization != null ? "PRESENTE" : "AUSENTE")
        );

        if (authorization != null) {
            System.out.println(
                    "BEARER: " + authorization.startsWith("Bearer ")
            );
        }

        System.out.println("========================================");

        // Não existe token: continua normalmente.
        // As permissões das rotas serão tratadas pelo Spring Security.
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7).trim();

        if (token.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"erro\":\"Token Firebase ausente\"}"
            );
            return;
        }

        try {

            /*
             * Agora o FirebaseApp já deve ter sido inicializado
             * pelo FirebaseConfig.
             */
            FirebaseToken decodedToken =
                    FirebaseAuth.getInstance().verifyIdToken(token);

            String firebaseUid = decodedToken.getUid();

            System.out.println("Firebase UID autenticado: " + firebaseUid);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            firebaseUid,
                            null,
                            Collections.emptyList()
                    );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

            System.out.println(
                    "AUTENTICAÇÃO CRIADA NO SECURITY CONTEXT"
            );

            filterChain.doFilter(request, response);

        } catch (Exception e) {

            System.err.println("========================================");
            System.err.println("ERRO AO VALIDAR TOKEN FIREBASE");
            System.err.println("URI: " + request.getRequestURI());
            System.err.println("TIPO: " + e.getClass().getName());
            System.err.println("MENSAGEM: " + e.getMessage());
            System.err.println("========================================");

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");

            String detalhe = e.getMessage() != null
                    ? e.getMessage().replace("\"", "'")
                    : "Erro desconhecido";

            response.getWriter().write(
                    "{\"erro\":\"Token Firebase inválido\",\"detalhe\":\""
                            + detalhe
                            + "\"}"
            );
        }
    }
}

