package com.eva.locafesta.favorito;

import java.util.List;

public record ListaFavoritoDTO(Long id, String nome, List<Long> espacoIds) {

    public ListaFavoritoDTO(ListaFavorito lista) {
        this(
                lista.getId(),
                lista.getNome(),
                lista.getEspacoIds() == null ? List.of() : List.copyOf(lista.getEspacoIds())
        );
    }
}
