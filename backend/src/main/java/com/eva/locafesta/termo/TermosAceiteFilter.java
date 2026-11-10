package com.eva.locafesta.termo;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Bloqueia APIs autenticadas (não admin) sem aceite da versão vigente.
 * Responde 403 com {@code codigo=TERMOS_NAO_ACEITOS}.
 */
@Component
@Order(2)
public class TermosAceiteFilter extends OncePerRequestFilter {

    public static final String CODIGO = "TERMOS_NAO_ACEITOS";

    private final TermoService termoService;
    private final UsuarioRepository usuarioRepository;

    public TermosAceiteFilter(TermoService termoService, UsuarioRepository usuarioRepository) {
        this.termoService = termoService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return estaNaAllowlist(path(request), request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Optional<Usuario> usuarioOpt = resolverUsuario(request);
        if (usuarioOpt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        Usuario usuario = usuarioOpt.get();
        if (usuario.isAdmin()) {
            filterChain.doFilter(request, response);
            return;
        }

        List<TermoDTO> pendentes = termoService.listarPendentesPara(usuario);
        if (pendentes.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(jsonBloqueio(pendentes));
    }

    private static String jsonBloqueio(List<TermoDTO> pendentes) {
        String lista = pendentes.stream()
                .map(t -> "{"
                        + "\"id\":" + t.id() + ","
                        + "\"tipo\":\"" + esc(t.tipo()) + "\","
                        + "\"versao\":" + t.versao() + ","
                        + "\"titulo\":\"" + esc(t.titulo()) + "\""
                        + "}")
                .collect(Collectors.joining(","));
        return "{"
                + "\"codigo\":\"" + CODIGO + "\","
                + "\"erro\":\"Aceite os Termos de Uso vigentes para continuar.\","
                + "\"termosPendentes\":[" + lista + "]"
                + "}";
    }

    private static String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private Optional<Usuario> resolverUsuario(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null
                && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken)
                && auth.getName() != null
                && !auth.getName().isBlank()) {
            Optional<Usuario> porFirebase = usuarioRepository.findByFirebaseUid(auth.getName());
            if (porFirebase.isPresent()) {
                return porFirebase;
            }
        }

        String header = request.getHeader("Usuario-Id");
        if (header != null && !header.isBlank()) {
            try {
                Long id = Long.parseLong(header.trim());
                return usuarioRepository.findById(id);
            } catch (NumberFormatException ignored) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    static boolean estaNaAllowlist(String path, String method) {
        if (path == null) {
            return true;
        }
        if (path.startsWith("/api/termos")) {
            return true;
        }
        if (path.startsWith("/api/v1/pagamentos") || path.startsWith("/api/pagamento")) {
            return true;
        }
        if (path.equals("/api/users") && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.equals("/api/users/admin") && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.startsWith("/api/users/") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        if ("GET".equalsIgnoreCase(method)) {
            if (path.equals("/api/espacos")
                    || path.equals("/api/espacos/todos")
                    || path.equals("/api/espacos/busca")
                    || path.matches("/api/espacos/\\d+")
                    || path.startsWith("/api/caracteristicas")) {
                return true;
            }
            if (path.matches("/api/locadores/\\d+/espacos")) {
                return true;
            }
        }
        return path.startsWith("/error");
    }

    private static String path(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            return uri.substring(ctx.length());
        }
        return uri;
    }
}
