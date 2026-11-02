package com.eva.locafesta.locador.financeiro;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/locador/financeiro")
public class LocadorFinanceiroController {

    private final LocadorFinanceiroService financeiroService;

    public LocadorFinanceiroController(LocadorFinanceiroService financeiroService) {
        this.financeiroService = financeiroService;
    }

    @GetMapping
    public ResponseEntity<?> resumo(
            @RequestHeader("Usuario-Id") Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate,
            @RequestParam(required = false) Long espacoId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho
    ) {
        try {
            return ResponseEntity.ok(financeiroService.resumo(usuarioId, de, ate, espacoId, pagina, tamanho));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }
}
