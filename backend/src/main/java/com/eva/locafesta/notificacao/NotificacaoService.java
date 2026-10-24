package com.eva.locafesta.notificacao;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository, UsuarioRepository usuarioRepository) {
        this.notificacaoRepository = notificacaoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void avisar(Long usuarioId, Long reservaId, String titulo, String mensagem) {
        if (usuarioId == null) return;
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) return;

        Notificacao aviso = new Notificacao();
        aviso.setUsuario(usuario);
        aviso.setReservaId(reservaId);
        aviso.setTitulo(titulo);
        aviso.setMensagem(mensagem);
        aviso.setLida(false);
        aviso.setCriadaEm(LocalDateTime.now());
        notificacaoRepository.save(aviso);
    }

    @Transactional(readOnly = true)
    public List<NotificacaoDTO> listar(Long usuarioId) {
        return notificacaoRepository.findByUsuarioIdOrderByCriadaEmDesc(usuarioId).stream()
                .map(NotificacaoDTO::new)
                .toList();
    }

    @Transactional
    public void marcarLida(Long avisoId, Long usuarioId) {
        Notificacao aviso = notificacaoRepository.findById(avisoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aviso não encontrado"));
        if (aviso.getUsuario() == null || !aviso.getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este aviso não é seu.");
        }
        aviso.setLida(true);
    }

    @Transactional
    public void marcarTodasLidas(Long usuarioId) {
        notificacaoRepository.findByUsuarioIdOrderByCriadaEmDesc(usuarioId)
                .forEach(aviso -> aviso.setLida(true));
    }
}
