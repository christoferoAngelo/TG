package com.eva.locafesta.locador.painel;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/locador/painel")
public class LocadorPainelController {

    private final LocadorPainelService painelService;

    public LocadorPainelController(LocadorPainelService painelService) {
        this.painelService = painelService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<?> resumo(@RequestHeader("Usuario-Id") Long usuarioId) {
        try {
            return ResponseEntity.ok(painelService.resumo(usuarioId));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }
}
