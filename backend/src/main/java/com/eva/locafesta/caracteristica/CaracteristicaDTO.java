package com.eva.locafesta.caracteristica;

import com.eva.locafesta.caracteristica.Caracteristica;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CaracteristicaDTO {
    	
    private Long id;

    @NotBlank(message = "O nome da característica é obrigatório")
    @Size(min = 2, max = 50, message = "O nome deve ter entre 2 e 50 caracteres")
    private String nome;

    @Size(max = 100, message = "O ícone não pode exceder 100 caracteres")
    private String icone;

    public CaracteristicaDTO() {}

    public CaracteristicaDTO(Caracteristica caracteristica) {
        if (caracteristica != null) {
            this.id = caracteristica.getId();
            this.nome = caracteristica.getNome();
            this.icone = caracteristica.getIcone();
        }
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getIcone() { return icone; }
    public void setIcone(String icone) { this.icone = icone; }
}