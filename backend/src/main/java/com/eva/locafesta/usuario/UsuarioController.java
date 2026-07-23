package com.eva.locafesta.usuario;

import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") 
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/{firebaseUid}")
    public ResponseEntity<?> buscarPorUid(@PathVariable String firebaseUid) {
        try {
            UsuarioDTO usuarioDTO = usuarioService.buscarPorFirebaseUid(firebaseUid);
            return ResponseEntity.ok(usuarioDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @PostMapping
    public ResponseEntity<UsuarioDTO> cadastrar(@RequestBody @Valid UsuarioCreateDTO dto) {
        UsuarioDTO usuarioDTO = usuarioService.cadastrarUsuario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioDTO);
    }

    // =========================================================================
    // NOVO ENDPOINT: SALVAR OU ATUALIZAR O ENDEREÇO DO USUÁRIO
    // PUT http://localhost:8080/api/users/{idUsuario}/endereco
    // =========================================================================
    @PutMapping("/{id}/endereco")
    public ResponseEntity<?> salvarOuAtualizarEndereco(
            @PathVariable Long id, 
            @RequestBody @Valid EnderecoDTO enderecoDTO) {
        try {
            UsuarioDTO usuarioAtualizado = usuarioService.atualizarEndereco(id, enderecoDTO);
            return ResponseEntity.ok(usuarioAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}