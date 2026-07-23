package com.eva.locafesta.locatario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PerfilLocatarioDTO {

    private Long id;

    @NotBlank(message = "O documento (CPF ou CNPJ) é obrigatório.")
    @Size(max = 20, message = "O documento deve ter no máximo 20 caracteres.")
    private String documento;


    private Long usuarioId;
    

    public PerfilLocatarioDTO() {
    }

    public PerfilLocatarioDTO(Long id, String documento, Long usuarioId) {
        this.id = id;
        this.documento = documento;
        this.usuarioId = usuarioId;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }


    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
}