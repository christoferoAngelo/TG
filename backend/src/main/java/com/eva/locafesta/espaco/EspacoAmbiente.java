package com.eva.locafesta.espaco;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity 
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
@Table(name = "espaco_ambientes")
public class EspacoAmbiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relacionamento com o Espaço principal
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espaco_id", nullable = false)
    private Espaco espaco;

    // Ex: "Cozinha completa", "Quarto 1"
    @Column(nullable = false, length = 100)
    private String titulo; 

    // Ex: "Fogão, Forno, Freezer, Itens básicos..."
    @Column(columnDefinition = "TEXT")
    private String descricao; 

    // O @ElementCollection cria uma tabela auxiliar simples (ambiente_imagens)
    // apenas para guardar as URLs das imagens ligadas a este ambiente.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "ambiente_imagens", 
        joinColumns = @JoinColumn(name = "ambiente_id")
    )
    @Column(name = "url_imagem", nullable = false)
    @Builder.Default
    private List<String> imagensUrls = new ArrayList<>();
}