package com.eva.locafesta.endereco;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class EnderecoDTO {

    @NotBlank(message = "CEP é obrigatório")
    private String cep;

    @NotBlank(message = "Logradouro é obrigatório")
    private String logradouro;

    @NotBlank(message = "Número é obrigatório")
    private String numero;

    private String complemento;

    @NotBlank(message = "Bairro é obrigatório")
    private String bairro;

    @NotBlank(message = "Cidade é obrigatória")
    private String cidade;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Use a sigla do estado (ex: SP)")
    private String estado;

    private Double latitude;
    private Double longitude;

    // Construtor para converter da Entidade para o DTO (mantido e super útil)
    public EnderecoDTO(Endereco endereco) {
        if (endereco != null) {
            this.cep = endereco.getCep();
            this.logradouro = endereco.getLogradouro();
            this.numero = endereco.getNumero();
            this.complemento = endereco.getComplemento();
            this.bairro = endereco.getBairro();
            this.cidade = endereco.getCidade();
            this.estado = endereco.getEstado();
            this.latitude = endereco.getLatitude();
            this.longitude = endereco.getLongitude();
        }
    }
}