package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.locatario.PerfilLocatarioDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
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
    private String motivoRejeicao;
    private String respostaLocador;

    // Lista de características
    private Set<CaracteristicaDTO> caracteristicas;

    // Lista de ambientes/cômodos (Nova estrutura estilo Airbnb)
    private List<EspacoAmbienteDTO> ambientes;

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
        this.motivoRejeicao = espaco.getMotivoRejeicao();
        this.respostaLocador = espaco.getRespostaLocador();

        // Mapeia o Set de Entidades para o Set de DTOs
        if (espaco.getCaracteristicas() != null) {
            this.caracteristicas = espaco.getCaracteristicas().stream()
                .map(CaracteristicaDTO::new)
                .collect(Collectors.toSet());
        }

        // Mapeia a Lista de Entidades Ambientes para a Lista de DTOs Ambientes
        if (espaco.getAmbientes() != null) {
            this.ambientes = espaco.getAmbientes().stream()
                .map(EspacoAmbienteDTO::new)
                .collect(Collectors.toList());
        }
    }
}