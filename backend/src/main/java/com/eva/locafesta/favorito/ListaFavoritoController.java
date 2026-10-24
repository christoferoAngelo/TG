package com.eva.locafesta.favorito;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

record PedidoLista(String nome, Long espacoId) {}

record PedidoNome(String nome) {}

@RestController
@RequestMapping("/api/favoritos")
public class ListaFavoritoController {

    private final ListaFavoritoService listaService;

    public ListaFavoritoController(ListaFavoritoService listaService) {
        this.listaService = listaService;
    }

    @GetMapping
    public ResponseEntity<List<ListaFavoritoDTO>> listar(@RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(listaService.listar(usuarioId));
    }

    @PostMapping
    public ResponseEntity<ListaFavoritoDTO> criar(
            @RequestHeader("Usuario-Id") Long usuarioId,
            @RequestBody PedidoLista pedido) {
        return ResponseEntity.status(201).body(listaService.criar(usuarioId, pedido.nome(), pedido.espacoId()));
    }

    @PatchMapping("/{listaId}")
    public ResponseEntity<ListaFavoritoDTO> renomear(
            @PathVariable Long listaId,
            @RequestHeader("Usuario-Id") Long usuarioId,
            @RequestBody PedidoNome pedido) {
        return ResponseEntity.ok(listaService.renomear(usuarioId, listaId, pedido.nome()));
    }

    @DeleteMapping("/{listaId}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long listaId,
            @RequestHeader("Usuario-Id") Long usuarioId) {
        listaService.excluir(usuarioId, listaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{listaId}/espacos/{espacoId}")
    public ResponseEntity<ListaFavoritoDTO> adicionar(
            @PathVariable Long listaId,
            @PathVariable Long espacoId,
            @RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(listaService.adicionarEspaco(usuarioId, listaId, espacoId));
    }

    @DeleteMapping("/{listaId}/espacos/{espacoId}")
    public ResponseEntity<ListaFavoritoDTO> remover(
            @PathVariable Long listaId,
            @PathVariable Long espacoId,
            @RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(listaService.removerEspaco(usuarioId, listaId, espacoId));
    }
}
