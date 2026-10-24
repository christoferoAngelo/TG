package com.eva.locafesta.favorito;

import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "listas_favoritos",
        uniqueConstraints = @UniqueConstraint(name = "uk_lista_usuario_nome", columnNames = {"usuario_id", "nome"})
)
public class ListaFavorito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(name = "criada_em", nullable = false)
    private LocalDateTime criadaEm;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lista_favorito_espacos", joinColumns = @JoinColumn(name = "lista_id"))
    @OrderColumn(name = "posicao")
    @Column(name = "espaco_id", nullable = false)
    private List<Long> espacoIds = new ArrayList<>();
}
