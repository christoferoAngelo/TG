package com.eva.locafesta.termo;

import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "aceites_termos",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_aceite_usuario_termo",
                columnNames = {"usuario_id", "termo_id"}
        )
)
public class AceiteTermo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "termo_id", nullable = false)
    private TermoUso termo;

    /** Cópia da versão do termo no momento do aceite (prova em disputa). */
    @Column(nullable = false)
    private Integer versao;

    @Column(name = "aceito_em", nullable = false)
    private LocalDateTime aceitoEm;
}
