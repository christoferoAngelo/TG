package com.eva.locafesta.endereco;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enderecos")
@RequiredArgsConstructor
public class EnderecoController {

    private final EnderecoService service;

    @PostMapping
    public ResponseEntity<EnderecoDTO> criar(@RequestBody @Valid EnderecoDTO dto) {
        EnderecoDTO enderecoSalvo = service.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(enderecoSalvo);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnderecoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<EnderecoDTO>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }
}