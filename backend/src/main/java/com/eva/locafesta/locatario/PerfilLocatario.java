package com.eva.locafesta.locatario;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.eva.locafesta.usuario.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder

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
    
    @CreationTimestamp
    @Column(name = "data_cadastro", updatable = false)
    private LocalDateTime dataCadastro;
    
    @Column(name = "data_ativo")
    private LocalDateTime dataAtivo;

      
    
}
