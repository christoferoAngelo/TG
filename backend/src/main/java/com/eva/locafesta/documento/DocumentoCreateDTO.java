package com.eva.locafesta.documento;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoCreateDTO {

    private String tipoDocumento;

    private String nomeArquivo;

    private String arquivoUrl;

    private String observacao;
}