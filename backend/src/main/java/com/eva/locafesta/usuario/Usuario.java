package com.eva.locafesta.usuario;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "users") // Mapeamento da tabela de utilizadores no MySQL
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Elo de ligação único entre o utilizador no banco MySQL e o registo de autenticação do Firebase
    @Column(name = "firebase_uid", unique = true, nullable = false)
    private String firebaseUid; 

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String telefone;

    @CreationTimestamp
    @Column(name = "data_cadastro", updatable = false)
    private LocalDateTime dataCadastro;

    @Column(name = "status_conta")
    private String statusConta = "ATIVO"; // Estados possíveis: ATIVO, INATIVO, SUSPENSO

    @Column(name = "nota_geral")
    private Integer nota;

    // Construtor padrão obrigatório pelo JPA
    public Usuario() {
    }
    
    

    public Usuario(Long id, String firebaseUid, String nome, String email, String telefone,
			LocalDateTime dataCadastro, String statusConta, Integer nota) {
		super();
		this.id = id;
		this.firebaseUid = firebaseUid;
		this.nome = nome;
		this.email = email;
		this.telefone = telefone;
		this.dataCadastro = dataCadastro;
		this.statusConta = statusConta;
		this.nota = nota;
	}



	// Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    public void setDataCadastro(LocalDateTime dataCadastro) {
        this.dataCadastro = dataCadastro;
    }

    public String getStatusConta() {
        return statusConta;
    }

    public void setStatusConta(String statusConta) {
        this.statusConta = statusConta;
    }

    public Integer getNota() {
        return nota;
    }

    public void setNota(Integer nota) {
        this.nota = nota;
    }
}