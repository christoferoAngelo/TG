package com.eva.locafesta.locador;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/locadores")
@CrossOrigin(origins = "*")
public class PerfilLocadorController {

    @Autowired
    private PerfilLocadorService service;

    // POST http://localhost:8080/api/locadores/{usuarioId}?documento=00000000000100&nomeFantasia=Buffet
    @PostMapping("/{usuarioId}")
    public ResponseEntity<?> criarPerfil(
            @PathVariable Long usuarioId, 
            @RequestParam String documento,
            @RequestParam(required = false) String nomeFantasia) {
        try {
            PerfilLocador novoPerfil = service.criarPerfil(usuarioId, documento, nomeFantasia);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoPerfil);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}