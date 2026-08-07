package com.eva.locafesta.usuario;

import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioUpdateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarTodos() {
        List<UsuarioDTO> usuarios = usuarioService.listarTodos();
        return ResponseEntity.ok(usuarios);
    }
    
    @PostMapping
    public ResponseEntity<UsuarioDTO> cadastrar(@RequestBody @Valid UsuarioCreateDTO dto) {
        UsuarioDTO usuarioDTO = usuarioService.cadastrarUsuario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioDTO);
    }

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
    
    @PatchMapping("/{id}/ativo")
    public ResponseEntity<Void> pingAtividade(@PathVariable Long id) {
        usuarioService.atualizarDataAtivo(id);
        return ResponseEntity.noContent().build(); 
    }
    
    @PutMapping("/{id}/telefone")
    public ResponseEntity<?> atualizarTelefone(
            @PathVariable Long id, 
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String telefone = payload.get("telefone");
            UsuarioDTO usuarioAtualizado = usuarioService.atualizarTelefone(id, telefone);
            return ResponseEntity.ok(usuarioAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // =========================================================================
    // ENDPOINTS DE ADMINISTRAÇÃO E GERENCIAMENTO (COM AUDITORIA)
    // =========================================================================

    @PostMapping("/admin")
    public ResponseEntity<UsuarioDTO> cadastrarAdmin(
            @RequestBody @Valid UsuarioCreateDTO dto,
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @RequestHeader(value = "X-Admin-Nome", required = false) String adminNome) {
        
        Long executorId = (adminId != null) ? adminId : 1L; 
        String executorNome = (adminNome != null && !adminNome.isBlank()) ? adminNome : "Administrador";

        UsuarioDTO adminCriado = usuarioService.cadastrarAdmin(dto, executorId, executorNome);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCriado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> atualizarUsuario(
            @PathVariable Long id, 
            @RequestBody @Valid UsuarioUpdateDTO dto,
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @RequestHeader(value = "X-Admin-Nome", required = false) String adminNome) {
        
        Long executorId = (adminId != null) ? adminId : 1L; 
        String executorNome = (adminNome != null && !adminNome.isBlank()) ? adminNome : "Administrador";

        UsuarioDTO usuarioAtualizado = usuarioService.atualizarUsuario(id, dto, executorId, executorNome);
        return ResponseEntity.ok(usuarioAtualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirUsuario(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Id", required = false) Long adminId,
            @RequestHeader(value = "X-Admin-Nome", required = false) String adminNome) {
        
        Long executorId = (adminId != null) ? adminId : 1L; 
        String executorNome = (adminNome != null && !adminNome.isBlank()) ? adminNome : "Administrador";

        usuarioService.excluirUsuario(id, executorId, executorNome);
        return ResponseEntity.noContent().build(); 
    }
}