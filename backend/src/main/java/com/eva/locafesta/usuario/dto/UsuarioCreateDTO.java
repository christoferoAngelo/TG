package com.eva.locafesta.usuario.dto;


import com.eva.locafesta.endereco.EnderecoDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Classe DTO para receber os dados de registo enviados pelo frontend React.
 * Apenas os campos essenciais para a criação da conta base.
 */

@Getter @Setter @NoArgsConstructor @AllArgsConstructor 

public class UsuarioCreateDTO {

    @NotBlank(message = "O UID do Firebase é obrigatório")
    private String firebaseUid;

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Formato de email inválido")
    private String email;

    private String telefone;

    private EnderecoDTO endereco;
    
   
}