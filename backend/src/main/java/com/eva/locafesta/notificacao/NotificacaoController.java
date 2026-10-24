package com.eva.locafesta.notificacao;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    public NotificacaoController(NotificacaoService notificacaoService) {
        this.notificacaoService = notificacaoService;
    }

    @GetMapping
    public ResponseEntity<List<NotificacaoDTO>> listar(@RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(notificacaoService.listar(usuarioId));
    }

    @PatchMapping("/{avisoId}/lida")
    public ResponseEntity<Void> marcarLida(
            @PathVariable Long avisoId,
            @RequestHeader("Usuario-Id") Long usuarioId) {
        notificacaoService.marcarLida(avisoId, usuarioId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/lidas")
    public ResponseEntity<Void> marcarTodas(@RequestHeader("Usuario-Id") Long usuarioId) {
        notificacaoService.marcarTodasLidas(usuarioId);
        return ResponseEntity.noContent().build();
    }
}
