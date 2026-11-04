package com.eva.locafesta.termo;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/termos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TermoAdminController {

    private final TermoService termoService;

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam String tipo) {
        try {
            return ResponseEntity.ok(termoService.listarAdmin(tipo));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalhe(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(termoService.detalheAdmin(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody TermoCreateDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(termoService.criarRascunho(dto));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody TermoUpdateDTO dto) {
        try {
            return ResponseEntity.ok(termoService.atualizarRascunho(id, dto));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping("/{id}/publicar")
    public ResponseEntity<?> publicar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(termoService.publicar(id));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("erro", e.getMessage()));
        }
    }
}
