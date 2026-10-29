package com.eva.locafesta.documento;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoDTO {

    private Long id;

    private String tipoDocumento;

    private String categoria;

    private Long usuarioId;

    private String usuarioNome;

    private String usuarioEmail;

    private Long espacoId;

    private String espacoTitulo;

    private String nomeArquivo;

    private String arquivoUrl;

    private String status;

    private String motivoRejeicao;

    private String observacao;

    private LocalDateTime dataEnvio;

    private LocalDateTime dataAnalise;

    public DocumentoDTO(DocumentoEntity documento) {

        this.id = documento.getId();

        this.tipoDocumento = documento.getTipoDocumento();

        this.categoria = documento.getCategoria();

        if (documento.getUsuario() != null) {
            this.usuarioId = documento.getUsuario().getId();
            this.usuarioNome = documento.getUsuario().getNome();
            this.usuarioEmail = documento.getUsuario().getEmail();
        }

        if (documento.getEspaco() != null) {
            this.espacoId = documento.getEspaco().getId();
            this.espacoTitulo = documento.getEspaco().getTitulo();
            if (this.usuarioId == null
                    && documento.getEspaco().getLocador() != null
                    && documento.getEspaco().getLocador().getUsuario() != null) {
                var dono = documento.getEspaco().getLocador().getUsuario();
                this.usuarioId = dono.getId();
                this.usuarioNome = dono.getNome();
                this.usuarioEmail = dono.getEmail();
            }
        }

        this.nomeArquivo = documento.getNomeArquivo();

        this.arquivoUrl = documento.getArquivoUrl();

        this.status = documento.getStatus();

        this.motivoRejeicao = documento.getMotivoRejeicao();

        this.observacao = documento.getObservacao();

        this.dataEnvio = documento.getDataEnvio();

        this.dataAnalise = documento.getDataAnalise();
    }
}