package com.eva.locafesta.favorito;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListaFavoritoRepository extends JpaRepository<ListaFavorito, Long> {

    List<ListaFavorito> findByUsuarioIdOrderByCriadaEmAsc(Long usuarioId);

    boolean existsByUsuarioIdAndNomeIgnoreCase(Long usuarioId, String nome);

    boolean existsByUsuarioIdAndNomeIgnoreCaseAndIdNot(Long usuarioId, String nome, Long id);
}
