package com.eva.locafesta.documento;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "documentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Tipo do documento.
     *
     * Exemplos:
     * RG
     * CNH
     * CPF
     * CNPJ
     * ALVARA
     * LICENCA
     * OUTRO
     */
    @Column(name = "tipo_documento", nullable = false, length = 30)
    private String tipoDocumento;

    /*
     * Indica se o documento pertence a uma PESSOA
     * ou a um ESPACO.
     *
     * Valores esperados:
     * PESSOA
     * ESPACO
     */
    @Column(nullable = false, length = 20)
    private String categoria;

    /*
     * Usuário proprietário do documento.
     *
     * Será preenchido para documentos pessoais
     * de locadores e locatários.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    /*
     * Espaço ao qual o documento pertence.
     *
     * Será preenchido para documentos do espaço.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espaco_id")
    private Espaco espaco;

    /*
     * Nome original do arquivo enviado.
     *
     * Não armazenamos o conteúdo do documento aqui.
     */
    @Column(name = "nome_arquivo", length = 255)
    private String nomeArquivo;

    /*
     * Referência para o arquivo armazenado.
     *
     * Pode ser uma URL ou caminho do Firebase Storage.
     */
    @Column(name = "arquivo_url", length = 1000)
    private String arquivoUrl;

    /*
     * Status da análise administrativa.
     *
     * PENDENTE
     * APROVADO
     * REJEITADO
     * CORRECAO_SOLICITADA
     */
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDENTE";

    /*
     * Motivo informado pelo administrador
     * em caso de rejeição/correção.
     */
    @Column(name = "motivo_rejeicao", columnDefinition = "TEXT")
    private String motivoRejeicao;

    /*
     * Observação administrativa.
     */
    @Column(columnDefinition = "TEXT")
    private String observacao;

    @CreationTimestamp
    @Column(name = "data_envio", updatable = false)
    private LocalDateTime dataEnvio;

    @Column(name = "data_analise")
    private LocalDateTime dataAnalise;
}