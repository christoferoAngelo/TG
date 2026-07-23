package com.eva.locafesta.usuario.dto;

import java.time.LocalDateTime;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.usuario.Usuario;

public class UsuarioDTO {
    private Long id;
    private String firebaseUid;
    private String nome;
    private String email;
    private String telefone;
    private EnderecoDTO endereco;
    private LocalDateTime dataAtivo;
    private boolean isLocatario;
    private boolean isLocador;

    // Construtor Padrão
    public UsuarioDTO() {
    }

    // CONSTRUTOR PRINCIPAL (Usado pela UsuarioService)
    public UsuarioDTO(Usuario usuario, boolean isLocatario, boolean isLocador) {
        this.id = usuario.getId();
        this.firebaseUid = usuario.getFirebaseUid();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.telefone = usuario.getTelefone();
        this.dataAtivo = usuario.getDataAtivo(); // <--- Pegando o dataAtivo aqui
        this.isLocatario = isLocatario;
        this.isLocador = isLocador;

        if (usuario.getEndereco() != null) {
            this.endereco = new EnderecoDTO(usuario.getEndereco());
        }
    }

    // Construtor Secundário Completo
    public UsuarioDTO(Long id, String firebaseUid, String nome, String email, String telefone, 
                      EnderecoDTO endereco, LocalDateTime dataAtivo, boolean isLocatario, boolean isLocador) {
        this.id = id;
        this.firebaseUid = firebaseUid;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.endereco = endereco;
        this.dataAtivo = dataAtivo;
        this.isLocatario = isLocatario;
        this.isLocador = isLocador;
    }

    // --- GETTERS E SETTERS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirebaseUid() { return firebaseUid; }
    public void setFirebaseUid(String firebaseUid) { this.firebaseUid = firebaseUid; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public EnderecoDTO getEndereco() { return endereco; }
    public void setEndereco(EnderecoDTO endereco) { this.endereco = endereco; }

    public LocalDateTime getDataAtivo() { return dataAtivo; }
    public void setDataAtivo(LocalDateTime dataAtivo) { this.dataAtivo = dataAtivo; }

    public boolean isLocatario() { return isLocatario; }
    public void setLocatario(boolean isLocatario) { this.isLocatario = isLocatario; }

    public boolean isLocador() { return isLocador; }
    public void setLocador(boolean isLocador) { this.isLocador = isLocador; }
}