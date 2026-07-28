package com.eva.locafesta.usuario.dto;

import java.time.LocalDateTime;

import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.usuario.Usuario;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor 

public class UsuarioDTO {
    private Long id;
    private String firebaseUid;
    private String nome;
    private String email;
    private String telefone;
    private EnderecoDTO endereco;
    private LocalDateTime dataCadastro;
    private LocalDateTime dataAtivo;
    
    @JsonProperty("isLocatario")
    private boolean isLocatario;

    @JsonProperty("isLocador")
    private boolean isLocador;

    @JsonProperty("isAdmin")
    private boolean isAdmin;
    
    // CONSTRUTOR PRINCIPAL (Usado pela UsuarioService)
    public UsuarioDTO(Usuario usuario, boolean isLocatario, boolean isLocador) {
        this.id = usuario.getId();
        this.firebaseUid = usuario.getFirebaseUid();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.telefone = usuario.getTelefone();
        this.dataCadastro = usuario.getDataCadastro(); 
        this.dataAtivo = usuario.getDataAtivo();
        this.isLocatario = isLocatario;
        this.isLocador = isLocador;
        this.isAdmin = usuario.isAdmin();

        if (usuario.getEndereco() != null) {
            this.endereco = new EnderecoDTO(usuario.getEndereco());
        }
    }
}