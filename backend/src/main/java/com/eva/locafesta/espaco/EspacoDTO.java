package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.espaco.Espaco;
import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

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

    public EspacoDTO() {
    }

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

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLocadorId() { return locadorId; }
    public void setLocadorId(Long locadorId) { this.locadorId = locadorId; }

    public EnderecoDTO getEndereco() { return endereco; }
    public void setEndereco(EnderecoDTO endereco) { this.endereco = endereco; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public BigDecimal getValorDiaria() { return valorDiaria; }
    public void setValorDiaria(BigDecimal valorDiaria) { this.valorDiaria = valorDiaria; }

    public Integer getCapacidadePessoas() { return capacidadePessoas; }
    public void setCapacidadePessoas(Integer capacidadePessoas) { this.capacidadePessoas = capacidadePessoas; }

    public String getRestricoesHorario() { return restricoesHorario; }
    public void setRestricoesHorario(String restricoesHorario) { this.restricoesHorario = restricoesHorario; }

    public String getHorarioFechamento() { return horarioFechamento; }
    public void setHorarioFechamento(String horarioFechamento) { this.horarioFechamento = horarioFechamento; }

    public String getStatusAprovacao() { return statusAprovacao; }
    public void setStatusAprovacao(String statusAprovacao) { this.statusAprovacao = statusAprovacao; }

    public Set<CaracteristicaDTO> getCaracteristicas() { return caracteristicas; }
    public void setCaracteristicas(Set<CaracteristicaDTO> caracteristicas) { this.caracteristicas = caracteristicas; }
}