package com.eva.locafesta.locatario;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.eva.locafesta.locador.PerfilLocadorDTO;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/locatarios")
@CrossOrigin(origins = "*")
public class PerfilLocatarioController {

    @Autowired
    private PerfilLocatarioService service;

    // CREATE - POST http://localhost:8080/api/locatarios
    @PostMapping
    public ResponseEntity<?> criarPerfil(@Valid @RequestBody PerfilLocatarioDTO dto) {
        try {
            PerfilLocatarioDTO novoPerfil = service.criarPerfil(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoPerfil);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<?> buscarPorUsuarioId(@PathVariable Long usuarioId) {
        try {
            PerfilLocatarioDTO dto = service.buscarPorUsuarioId(usuarioId);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}