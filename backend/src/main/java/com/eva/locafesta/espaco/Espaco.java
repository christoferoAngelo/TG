
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

import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "espacos")
public class Espaco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Proprietário do espaço
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locador_id", nullable = false)
    private PerfilLocador locador;

    // Endereço do espaço
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "endereco_id", referencedColumnName = "id")
    private Endereco endereco;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descricao;

    @Column(name = "valor_diaria", precision = 12, scale = 2)
    private BigDecimal valorDiaria;
    
    @Column(name = "valor_meio_periodo", precision = 12, scale = 2)
    private BigDecimal valorMeioPeriodo;

    @Column(name = "valor_hora", precision = 12, scale = 2)
    private BigDecimal valorHora;

    @Column(name = "capacidade_pessoas", nullable = false)
    private Integer capacidadePessoas;

    // Funcionamento do espaço
    @Column(name = "horario_abertura")
    private LocalTime horarioAbertura;

    @Column(name = "horario_fechamento")
    private LocalTime horarioFechamento;

    // Modalidades de locação
    @Builder.Default
    @Column(name = "permite_meio_periodo", nullable = false)
    private Boolean permiteMeioPeriodo = true;

    @Builder.Default
    @Column(name = "permite_periodo_integral", nullable = false)
    private Boolean permitePeriodoIntegral = true;

    @Builder.Default
    @Column(name = "permite_horario_personalizado", nullable = false)
    private Boolean permiteHorarioPersonalizado = false;

    // false: o locatário envia um pedido e o locador aprova.
    // true: a reserva já nasce aprovada e a tela de detalhes segue para o pagamento.
    @Builder.Default
    @Column(name = "aprovacao_instantanea", nullable = false)
    private Boolean aprovacaoInstantanea = false;

    // Limite de duração em horas. Pode ser nulo.
    @Column(name = "duracao_max_horas", precision = 4, scale = 2)
    private BigDecimal duracaoMaxHoras;

    // Tempo necessário para limpeza entre eventos
    @Builder.Default
    @Column(name = "intervalo_limpeza_min", nullable = false)
    private Integer intervaloLimpezaMin = 0;

    // Dias mínimos entre hoje e a data do evento. 0 permite reservar para hoje.
    @Builder.Default
    @Column(name = "antecedencia_minima_dias", nullable = false)
    private Integer antecedenciaMinimaDias = 0;

    // O locador só cancela uma reserva confirmada até esse número de dias antes do evento.
    @Builder.Default
    @Column(name = "prazo_cancelamento_dias", nullable = false)
    private Integer prazoCancelamentoDias = 2;

    @Column(name = "restricoes_horario", columnDefinition = "TEXT")
    private String restricoesHorario;

    // Status do anúncio
    @Builder.Default
    @Column(name = "status_aprovacao", nullable = false, length = 20)
    private String statusAprovacao = "PENDENTE";

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "motivo_rejeicao", columnDefinition = "TEXT")
    private String motivoRejeicao;

    @Column(name = "resposta_locador", columnDefinition = "TEXT")
    private String respostaLocador;

    // Características do espaço
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "espaco_caracteristicas",
        joinColumns = @JoinColumn(name = "espaco_id"),
        inverseJoinColumns = @JoinColumn(name = "caracteristica_id")
    )
    @Builder.Default
    private Set<Caracteristica> caracteristicas = new HashSet<>();

    // Foto de capa do anúncio (URL). Se vazia, a listagem usa a primeira foto dos ambientes.
    @Column(name = "foto_capa_url", length = 500)
    private String fotoCapaUrl;

    // Ambientes e imagens
    @OneToMany(
        mappedBy = "espaco",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @Builder.Default
    private List<EspacoAmbiente> ambientes = new ArrayList<>();

    // Avaliações
    @Column(name = "nota_media")
    private Double notaMedia;

    @Builder.Default
    @Column(name = "quantidade_avaliacoes")
    private Integer quantidadeAvaliacoes = 0;

    @CreationTimestamp
    @Column(name = "data_cadastro", updatable = false)
    private LocalDateTime dataCadastro;
}
