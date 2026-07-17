package com.eva.locafesta.locatario;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/locatarios")
@CrossOrigin(origins = "*")
public class PerfilLocatarioController {

    @Autowired
    private PerfilLocatarioService service;

    // POST http://localhost:8080/api/locatarios/{usuarioId}?cpf=12345678900
    @PostMapping("/{usuarioId}")
    public ResponseEntity<?> criarPerfil(@PathVariable Long usuarioId, @RequestParam String cpf) {
        try {
            PerfilLocatario novoPerfil = service.criarPerfil(usuarioId, cpf);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoPerfil);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}