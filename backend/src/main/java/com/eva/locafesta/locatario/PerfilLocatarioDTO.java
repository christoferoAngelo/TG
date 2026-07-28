package com.eva.locafesta.locatario;

import java.time.LocalDateTime;

import com.eva.locafesta.locador.PerfilLocador;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfilLocatarioDTO {

    private Long id;

    @NotBlank(message = "O documento (CPF ou CNPJ) é obrigatório.")
    @Size(max = 20, message = "O documento deve ter no máximo 20 caracteres.")
    private String documento;

    @NotNull
    private Long usuarioId;
    
    private LocalDateTime dataAtivo;
    
    public PerfilLocatarioDTO(PerfilLocatario perfil){
    	this.id = perfil.getId();
    	this.documento = perfil.getCpf();
    	this.dataAtivo = perfil.getDataAtivo();
    	this.usuarioId = perfil.getUsuario().getId();
    };
    

    
}