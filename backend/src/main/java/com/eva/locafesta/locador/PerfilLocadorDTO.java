package com.eva.locafesta.locador;

import java.time.LocalDateTime;


import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class PerfilLocadorDTO {


    private Long id;

    @NotBlank(message = "O documento (CPF ou CNPJ) é obrigatório.")
    @Size(max = 20, message = "O documento deve ter no máximo 20 caracteres.")
    private String documento;

    @Size(max = 150, message = "O nome fantasia deve ter no máximo 150 caracteres.")
    @NotBlank(message = "O nome fantasia é obrigatório.")
    private String nomeFantasia;
    
    @NotNull(message = "UsuarioId é obrigatório.")
    private Long usuarioId;
    
    private LocalDateTime dataAtivo;
    
    
    // construtor pra transformar PerfilLocador em PerfilLocadorDTO
    public PerfilLocadorDTO(PerfilLocador perfil){
    	this.id = perfil.getId();
    	this.documento = perfil.getDocumento();
    	this.dataAtivo = perfil.getDataAtivo();
    	this.nomeFantasia = perfil.getNomeFantasia();
    	this.usuarioId = perfil.getUsuario().getId();
    };

    
}