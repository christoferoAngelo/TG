package com.eva.locafesta.locador;

import java.time.LocalDateTime;

import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder

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


}