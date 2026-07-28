package com.eva.locafesta.locador;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class PerfilLocadorDTO {

	@NotBlank
    private Long id;

    @NotBlank(message = "O documento (CPF ou CNPJ) é obrigatório.")
    @Size(max = 20, message = "O documento deve ter no máximo 20 caracteres.")
    private String documento;

    @Size(max = 150, message = "O nome fantasia deve ter no máximo 150 caracteres.")
    @NotBlank(message = "O nome fantasia é obrigatório.")
    private String nomeFantasia;
    
    @NotBlank(message = "UsuarioId é obrigatório.")
    private Long usuarioId;
    

    
}