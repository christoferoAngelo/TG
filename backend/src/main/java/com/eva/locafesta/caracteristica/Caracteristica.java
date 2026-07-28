package com.eva.locafesta.caracteristica;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "caracteristicas")
public class Caracteristica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50) @NotBlank
    private String nome; // Ex: "Ao Ar Livre", "Piscina", "Churrasqueira"

    @Column(length = 100)
    private String icone; // Opcional: nome do ícone no front-end (ex: "fa-swimming-pool")

  
}