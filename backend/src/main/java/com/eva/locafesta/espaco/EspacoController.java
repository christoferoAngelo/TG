package com.eva.locafesta.espaco;

import com.eva.locafesta.espaco.EspacoDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locadores")
@CrossOrigin(origins = "*")
public class EspacoController {

    @Autowired
    private EspacoService espacoService;

    // CREATE - POST http://localhost:8080/api/locadores/{locadorId}/espacos
    @PostMapping("/{locadorId}/espacos")
    public ResponseEntity<?> criarEspaco(@PathVariable Long locadorId, @Valid @RequestBody EspacoDTO dto) {
        try {
            EspacoDTO novoEspaco = espacoService.criarEspaco(locadorId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(novoEspaco);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // READ - GET http://localhost:8080/api/locadores/{locadorId}/espacos
    @GetMapping("/{locadorId}/espacos")
    public ResponseEntity<?> listarEspacosDoLocador(@PathVariable Long locadorId) {
        try {
            List<EspacoDTO> espacos = espacoService.listarPorUsuarioId(locadorId);
            return ResponseEntity.ok(espacos);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
	// GET http://localhost:8080/api/locadores/espacos/todos
	@GetMapping("/espacos/todos")
	public ResponseEntity<?> listarTodosEspacos() {
	    try {
	        List<EspacoDTO> espacos = espacoService.listarTodos(); // Crie este método na sua Service se ainda não existir
	        return ResponseEntity.ok(espacos);
	    } catch (RuntimeException e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
	    }
	}
	
	// UPDATE - PATCH http://localhost:8080/api/locadores/{locadorId}/espacos/{espacoId}/status
    @PatchMapping("/{locadorId}/espacos/{espacoId}/status")
    public ResponseEntity<?> alternarStatusAtivo(@PathVariable Long locadorId, @PathVariable Long espacoId) {
        try {
            // Esse método precisará ser criado no seu EspacoService
            EspacoDTO espacoAtualizado = espacoService.alternarStatusAtivo(locadorId, espacoId);
            return ResponseEntity.ok(espacoAtualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @GetMapping("/espacos/busca")
    public ResponseEntity<?> buscarEspacos(@RequestParam(name = "q", defaultValue = "") String termo) {
        try {
            List<EspacoDTO> espacos = espacoService.buscarEspacosPorTermo(termo);
            return ResponseEntity.ok(espacos);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

}