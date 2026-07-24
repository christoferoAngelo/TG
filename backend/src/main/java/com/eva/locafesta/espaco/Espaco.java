package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.Caracteristica;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.locador.PerfilLocador; 
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "espacos")
public class Espaco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locador_id", nullable = false)
    private PerfilLocador locador;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "endereco_id", referencedColumnName = "id", nullable = false)
    private Endereco endereco;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descricao;

    @Column(name = "valor_diaria", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorDiaria;

    @Column(name = "capacidade_pessoas", nullable = false)
    private Integer capacidadePessoas;

    @Column(name = "restricoes_horario", length = 255)
    private String restricoesHorario;

    @Column(name = "horario_fechamento", length = 10)
    private String horarioFechamento;

    // --- NOVA RELAÇÃO COM CARACTERÍSTICAS (@ManyToMany) ---
    // Usamos Set para evitar características duplicadas no mesmo espaço
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "espaco_caracteristicas",
        joinColumns = @JoinColumn(name = "espaco_id"),
        inverseJoinColumns = @JoinColumn(name = "caracteristica_id")
    )
    private Set<Caracteristica> caracteristicas = new HashSet<>();

    @Column(name = "status_aprovacao", nullable = false, length = 20)
    private String statusAprovacao = "PENDENTE";

    @CreationTimestamp
    @Column(name = "data_cadastro", updatable = false)
    private LocalDateTime dataCadastro;

    public Espaco() {
    }

    // --- Getters e Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PerfilLocador getLocador() { return locador; }
    public void setLocador(PerfilLocador locador) { this.locador = locador; }

    public Endereco getEndereco() { return endereco; }
    public void setEndereco(Endereco endereco) { this.endereco = endereco; }

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

    public Set<Caracteristica> getCaracteristicas() { return caracteristicas; }
    public void setCaracteristicas(Set<Caracteristica> caracteristicas) { this.caracteristicas = caracteristicas; }

    public String getStatusAprovacao() { return statusAprovacao; }
    public void setStatusAprovacao(String statusAprovacao) { this.statusAprovacao = statusAprovacao; }

    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public void setDataCadastro(LocalDateTime dataCadastro) { this.dataCadastro = dataCadastro; }
}