package com.eva.locafesta.locador;

import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;

@Entity
@Table(name = "perfis_locador")
public class PerfilLocador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Aceita CPF (11 dígitos) ou CNPJ (14 dígitos)
    @Column(unique = true, nullable = false, length = 20)
    private String documento; 
    

    @Column(name = "nome_fantasia", length = 150)
    private String nomeFantasia; // Opcional, útil se for CNPJ (ex: "Buffet Alegria")

    @OneToOne
    @JoinColumn(name = "usuario_id", referencedColumnName = "id", nullable = false, unique = true)
    private Usuario usuario;

    public PerfilLocador() {}

    public PerfilLocador(String documento, String nomeFantasia, Usuario usuario) {
        this.documento = documento;
        this.nomeFantasia = nomeFantasia;
        this.usuario = usuario;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public String getNomeFantasia() { return nomeFantasia; }
    public void setNomeFantasia(String nomeFantasia) { this.nomeFantasia = nomeFantasia; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}