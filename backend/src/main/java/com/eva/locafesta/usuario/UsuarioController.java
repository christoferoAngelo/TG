package com.eva.locafesta.usuario;

import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Permite que o seu frontend React (mesmo rodando em portas diferentes como 5173 ou 3000) consiga aceder à API
public class UsuarioController {

    @Autowired
    private UsuarioService userService;

    /**
     * Endpoint para criar um utilizador no MySQL.
     * POST http://localhost:8080/api/users
     */
    @PostMapping
    public ResponseEntity<?> criarUsuario(@Valid @RequestBody UsuarioCreateDTO dto) {
        try {
            Usuario novoUsuario = userService.registrarUsuario(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoUsuario);
        } catch (RuntimeException e) {
            // Retorna uma mensagem amigável em caso de erro (ex: email duplicado)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Endpoint para procurar o perfil no MySQL através do UID do Firebase.
     * GET http://localhost:8080/api/users/{firebaseUid}
     */
    @GetMapping("/{firebaseUid}")
    public ResponseEntity<?> buscarPorUid(@PathVariable String firebaseUid) {
        return userService.buscarPorFirebaseUid(firebaseUid)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok().body(user))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Utilizador não encontrado com o UID fornecido."));
    }
}