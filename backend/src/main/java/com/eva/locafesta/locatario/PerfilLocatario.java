package com.eva.locafesta.locatario;

import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;

@Entity
@Table(name = "perfis_locatario")
public class PerfilLocatario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 14)
    private String cpf; // Formato: 000.000.000-00 ou apenas números

    // Relacionamento 1 para 1: Um usuário tem apenas 1 perfil de locatário
    @OneToOne
    @JoinColumn(name = "usuario_id", referencedColumnName = "id", nullable = false, unique = true)
    private Usuario usuario;

    public PerfilLocatario() {}

    public PerfilLocatario(String cpf, Usuario usuario) {
        this.cpf = cpf;
        this.usuario = usuario;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    
    
    
}
