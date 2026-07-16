package com.eva.locafesta.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Classe DTO para receber os dados de registo enviados pelo frontend React.
 * Apenas os campos essenciais para a criação da conta base.
 */
public class UsuarioCreateDTO {

    @NotBlank(message = "O UID do Firebase é obrigatório")
    private String firebaseUid;

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Formato de email inválido")
    private String email;

    private String telefone;

    // Construtores
    public UsuarioCreateDTO() {}

    public UsuarioCreateDTO(String firebaseUid, String nome, String email, String telefone) {
        this.firebaseUid = firebaseUid;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
    }

    // Getters e Setters
    public String getFirebaseUid() {
        return firebaseUid;
    }

    public void setFirebaseUid(String firebaseUid) {
        this.firebaseUid = firebaseUid;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }
}