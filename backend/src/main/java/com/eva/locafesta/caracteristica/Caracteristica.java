package com.eva.locafesta.caracteristica;

import jakarta.persistence.*;

@Entity
@Table(name = "caracteristicas")
public class Caracteristica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nome; // Ex: "Ao Ar Livre", "Piscina", "Churrasqueira"

    @Column(length = 100)
    private String icone; // Opcional: nome do ícone no front-end (ex: "fa-swimming-pool")

    public Caracteristica() {
    }

    public Caracteristica(Long id, String nome, String icone) {
        this.id = id;
        this.nome = nome;
        this.icone = icone;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getIcone() { return icone; }
    public void setIcone(String icone) { this.icone = icone; }
}