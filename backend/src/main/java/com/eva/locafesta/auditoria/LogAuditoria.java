package com.eva.locafesta.auditoria;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_log_auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long adminId;

    // Guardar o nome evita depender da entidade Usuario se ela for modificada
    private String adminNome; 

    @Column(nullable = false)
    private String acao; // Ex: "CADASTRAR_ADMIN", "EXCLUIR_USUARIO", "APROVAR_LOCADOR"

    private String tipoEntidade; // Ex: "Usuario", "Imovel", "Reserva"

    private String idEntidade; // Aceita IDs numéricos ou Firebase UID

    @Column(columnDefinition = "TEXT")
    private String detalhes; // Ex: "Aprovou o cadastro com a observação: Documentos validados"

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @PrePersist
    public void prePersist() {
        this.dataHora = LocalDateTime.now();
    }
}