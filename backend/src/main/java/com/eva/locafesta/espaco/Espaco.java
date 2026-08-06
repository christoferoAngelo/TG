package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.Caracteristica;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.locador.PerfilLocador; 
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "espacos")
public class Espaco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locador_id", nullable = false)
    private PerfilLocador locador;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "endereco_id", referencedColumnName = "id")
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

    @Column(name = "motivo_rejeicao", columnDefinition = "TEXT")
    private String motivoRejeicao;

    @Column(name = "resposta_locador", columnDefinition = "TEXT")
    private String respostaLocador;

    // Usamos Set para evitar características duplicadas no mesmo espaço
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "espaco_caracteristicas",
        joinColumns = @JoinColumn(name = "espaco_id"),
        inverseJoinColumns = @JoinColumn(name = "caracteristica_id")
    )
    
    @Builder.Default
    private Set<Caracteristica> caracteristicas = new HashSet<>();

    @Column(name = "status_aprovacao", nullable = false, length = 20) @Builder.Default
    private String statusAprovacao = "PENDENTE";

    @CreationTimestamp
    @Column(name = "data_cadastro", updatable = false)
    private LocalDateTime dataCadastro;

    
}