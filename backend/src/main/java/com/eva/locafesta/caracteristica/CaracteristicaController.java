package com.eva.locafesta.caracteristica;

import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caracteristicas")
@CrossOrigin(origins = "*")
public class CaracteristicaController {

    @Autowired
    private CaracteristicaService service;

    // CREATE - POST http://localhost:8080/api/caracteristicas
    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody CaracteristicaDTO dto) {
        try {
            CaracteristicaDTO nova = service.criar(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(nova);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // READ (Todos) - GET http://localhost:8080/api/caracteristicas
    @GetMapping
    public ResponseEntity<List<CaracteristicaDTO>> listarTodas() {
        return ResponseEntity.ok(service.listarTodas());
    }

    // READ (Por ID) - GET http://localhost:8080/api/caracteristicas/1
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        try {
            CaracteristicaDTO caracteristica = service.buscarPorId(id);
            return ResponseEntity.ok(caracteristica);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // UPDATE - PUT http://localhost:8080/api/caracteristicas/1
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @Valid @RequestBody CaracteristicaDTO dto) {
        try {
            CaracteristicaDTO atualizada = service.atualizar(id, dto);
            return ResponseEntity.ok(atualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // DELETE - DELETE http://localhost:8080/api/caracteristicas/1
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}