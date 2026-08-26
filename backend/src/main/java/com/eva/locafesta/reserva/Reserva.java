// Reserva.java
package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity 
@Table(name = "reservas")
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "espaco_id", nullable = false)
    @JsonIgnoreProperties("reservas")
    private Espaco espaco;

    @ManyToOne
    @JoinColumn(name = "locatario_id", nullable = false)
    private Usuario locatario;

    private LocalDate dataEvento;
    private BigDecimal valorTotal;
    // Status: PENDENTE, APROVADA, REJEITADA, CANCELADA
    private String status = "PENDENTE"; 

    @Column(length = 500) // Opcional: aumenta o limite de caracteres no banco
    private String observacao;

}