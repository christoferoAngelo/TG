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
            List<EspacoDTO> espacos = espacoService.listarPorLocador(locadorId);
            return ResponseEntity.ok(espacos);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}