package com.eva.locafesta.usuario.dto;

import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.usuario.Usuario;

public class UsuarioDTO {
    private Long id;
    private String firebaseUid;
    private String nome;
    private String email;
    private String telefone;
    private EnderecoDTO endereco;

    public UsuarioDTO(Usuario usuario, boolean isLocatario, boolean isLocador) {
        this.id = usuario.getId();
        this.firebaseUid = usuario.getFirebaseUid();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.telefone = usuario.getTelefone();

        
        // Converte a entidade de endereço para DTO (se existir)
        if (usuario.getEndereco() != null) {
            this.endereco = new EnderecoDTO(usuario.getEndereco());
        }
    }

    // Adicione os Getters aqui (obrigatório para o Spring transformar em JSON)
    public Long getId() { return id; }
    public String getFirebaseUid() { return firebaseUid; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }

    
    public EnderecoDTO getEndereco() { return endereco; }
    public void setEndereco(EnderecoDTO endereco) { this.endereco = endereco; }
    
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



}

