package com.eva.locafesta.usuario;

import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;

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
    private UsuarioService usuarioService;

    /**
     * Endpoint para criar um utilizador no MySQL.
     * POST http://localhost:8080/api/users
     */

    /**
     * Endpoint para procurar o perfil no MySQL através do UID do Firebase.
     * GET http://localhost:8080/api/users/{firebaseUid}
     */
    
    @GetMapping("/{firebaseUid}")
    public ResponseEntity<?> buscarPorUid(@PathVariable String firebaseUid) {
        try {
            // Tenta buscar o usuário
            UsuarioDTO usuarioDTO = usuarioService.buscarPorFirebaseUid(firebaseUid);
            return ResponseEntity.ok(usuarioDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @PostMapping
    public ResponseEntity<UsuarioDTO> cadastrar(@RequestBody @Valid UsuarioCreateDTO dto) {
        // Chama o service que faz a persistência e a checagem dos perfis
        UsuarioDTO usuarioDTO = usuarioService.cadastrarUsuario(dto);
        
        // Devolve o HTTP 201 (Created) com o seu UsuarioDTO completo no corpo
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioDTO);
    }
}