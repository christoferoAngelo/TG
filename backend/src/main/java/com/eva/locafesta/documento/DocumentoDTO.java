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

    private Long espacoId;

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
        }

        if (documento.getEspaco() != null) {
            this.espacoId = documento.getEspaco().getId();
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