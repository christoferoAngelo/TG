package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.locatario.PerfilLocatarioDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EspacoDTO {

    private Long id;
    private Long locadorId;
    private EnderecoDTO endereco;
    private String titulo;
    private String descricao;
    private BigDecimal valorDiaria;
    private Integer capacidadePessoas;
    private String restricoesHorario;
    private String horarioFechamento;
    private String statusAprovacao;
    
    // Lista de características convertidas para DTO
    private Set<CaracteristicaDTO> caracteristicas;

   
    public EspacoDTO(Espaco espaco) {
        this.id = espaco.getId();
        if (espaco.getLocador() != null) {
            this.locadorId = espaco.getLocador().getId();
        }
        if (espaco.getEndereco() != null) {
            this.endereco = new EnderecoDTO(espaco.getEndereco());
        }
        this.titulo = espaco.getTitulo();
        this.descricao = espaco.getDescricao();
        this.valorDiaria = espaco.getValorDiaria();
        this.capacidadePessoas = espaco.getCapacidadePessoas();
        this.restricoesHorario = espaco.getRestricoesHorario();
        this.horarioFechamento = espaco.getHorarioFechamento();
        this.statusAprovacao = espaco.getStatusAprovacao();
        
        // Mapeia o Set de Entidades para o Set de DTOs usando Streams
        if (espaco.getCaracteristicas() != null) {
            this.caracteristicas = espaco.getCaracteristicas().stream()
                .map(CaracteristicaDTO::new)
                .collect(Collectors.toSet());
        }
    }


}