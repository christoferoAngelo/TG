package com.eva.locafesta.usuario.dto;

import com.eva.locafesta.usuario.Usuario;

public class UsuarioDTO {
    private Long id;
    private String firebaseUid;
    private String nome;
    private String email;
    private String telefone;
    private boolean isLocatario; // Diz ao React se já tem CPF cadastrado
    private boolean isLocador;   // Diz ao React se já pode anunciar festas

    public UsuarioDTO(Usuario usuario, boolean isLocatario, boolean isLocador) {
        this.id = usuario.getId();
        this.firebaseUid = usuario.getFirebaseUid();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.telefone = usuario.getTelefone();
        this.isLocatario = isLocatario;
        this.isLocador = isLocador;
    }

    // Adicione os Getters aqui (obrigatório para o Spring transformar em JSON)
    public Long getId() { return id; }
    public String getFirebaseUid() { return firebaseUid; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public boolean isLocatario() { return isLocatario; }
    public boolean isLocador() { return isLocador; }
    
    
    public void setId(Long id) {
		this.id = id;
	}

	public void setFirebaseUid(String firebaseUid) {
		this.firebaseUid = firebaseUid;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public void setTelefone(String telefone) {
		this.telefone = telefone;
	}

	public void setLocatario(boolean isLocatario) {
		this.isLocatario = isLocatario;
	}

	public void setLocador(boolean isLocador) {
		this.isLocador = isLocador;
	}

}

