package com.eva.locafesta.usuario;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

import com.eva.locafesta.endereco.Endereco;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor 

@Entity
@Table(name = "users") // Mapeamento da tabela de utilizadores no MySQL
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    
    @Column(name = "data_ativo")
    private LocalDateTime dataAtivo;

    @Column(name = "status_conta")
    private String statusConta = "ATIVO"; // Estados possíveis: ATIVO, INATIVO, SUSPENSO

    @Column(name = "nota_geral")
    private Integer nota;
    
    @Embedded
    private Endereco endereco;

    @Column(name = "is_admin", nullable = false)
    private boolean isAdmin = false;


}



    

