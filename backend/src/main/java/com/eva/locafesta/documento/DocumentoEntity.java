package com.eva.locafesta.documento;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.usuario.Usuario;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "documentos")
public class DocumentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================================================
    // TIPO DO DOCUMENTO
    // =========================================================

    @Column(name = "tipo_documento", nullable = false, length = 50)
    private String tipoDocumento;

    // PESSOA ou ESPACO
    @Column(nullable = false, length = 20)
    private String categoria;

    // =========================================================
    // RELACIONAMENTOS
    // =========================================================

    // Documento pertencente a um usuário
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    // Documento pertencente a um espaço
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espaco_id")
    private Espaco espaco;

    // =========================================================
    // ARQUIVO
    // =========================================================

    @Column(name = "nome_arquivo", length = 255)
    private String nomeArquivo;

    /*
     * Para o TG vamos armazenar somente a URL.
     *
     * Não estamos armazenando o arquivo físico no MySQL.
     */
    @Column(name = "arquivo_url", columnDefinition = "TEXT")
    private String arquivoUrl;

    // =========================================================
    // STATUS
    // =========================================================

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDENTE";

    @Column(name = "motivo_rejeicao", columnDefinition = "TEXT")
    private String motivoRejeicao;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    // =========================================================
    // DATAS
    // =========================================================

    @CreationTimestamp
    @Column(name = "data_envio", updatable = false)
    private LocalDateTime dataEnvio;

    @Column(name = "data_analise")
    private LocalDateTime dataAnalise;
}