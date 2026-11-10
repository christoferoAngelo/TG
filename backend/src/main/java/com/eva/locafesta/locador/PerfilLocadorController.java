package com.eva.locafesta.locador;

import com.eva.locafesta.termo.TermosAceiteFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/locadores")
@CrossOrigin(origins = "*")
public class PerfilLocadorController {

    @Autowired
    private PerfilLocadorService service;

    // CREATE - POST http://localhost:8080/api/locadores
    @PostMapping
    public ResponseEntity<?> criarPerfil(@Valid @RequestBody PerfilLocadorDTO dto) {
        try {
            PerfilLocadorDTO novoPerfil = service.criarPerfil(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoPerfil);
        } catch (ResponseStatusException e) {
            if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "codigo", TermosAceiteFilter.CODIGO,
                        "erro", e.getReason() != null ? e.getReason() : "Aceite os Termos de Uso para continuar."
                ));
            }
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // READ - GET http://localhost:8080/api/locadores/1
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        try {
            PerfilLocadorDTO perfil = service.buscarPorId(id);
            return ResponseEntity.ok(perfil);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // READ - GET http://localhost:8080/api/locadores/usuario/5
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> buscarPorUsuarioId(@PathVariable Long usuarioId) {
        try {
            PerfilLocadorDTO perfil = service.buscarPorUsuarioId(usuarioId);
            return ResponseEntity.ok(perfil);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // READ - GET http://localhost:8080/api/locadores
    @GetMapping
    public ResponseEntity<List<PerfilLocadorDTO>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    // UPDATE - PUT http://localhost:8080/api/locadores/1
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarPerfil(@PathVariable Long id, @Valid @RequestBody PerfilLocadorDTO dto) {
        try {
            PerfilLocadorDTO perfilAtualizado = service.atualizarPerfil(id, dto);
            return ResponseEntity.ok(perfilAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}