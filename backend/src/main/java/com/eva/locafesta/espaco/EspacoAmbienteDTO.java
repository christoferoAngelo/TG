package com.eva.locafesta.espaco;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EspacoAmbienteDTO {

    private Long id;
    private String titulo;
    private String descricao;
    private List<String> imagensUrls;

    // Construtor para converter da Entidade para DTO
    public EspacoAmbienteDTO(EspacoAmbiente ambiente) {
        this.id = ambiente.getId();
        this.titulo = ambiente.getTitulo();
        this.descricao = ambiente.getDescricao();
        this.imagensUrls = ambiente.getImagensUrls();
    }
}