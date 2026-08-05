package com.eva.locafesta.endereco;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnderecoService {

    private final EnderecoRepository repository;
    private final GeocodingService geocodingService; // Injetando o serviço do seu colega

    @Transactional
    public EnderecoDTO salvar(EnderecoDTO dto) {
        // 1. Tenta preencher as coordenadas usando a API externa antes de salvar
        geocodingService.preencherCoordenadas(dto);

        // 2. Converte de DTO para Entidade
        Endereco endereco = Endereco.builder()
                .cep(dto.getCep())
                .logradouro(dto.getLogradouro())
                .numero(dto.getNumero())
                .complemento(dto.getComplemento())
                .bairro(dto.getBairro())
                .cidade(dto.getCidade())
                .estado(dto.getEstado())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();

        // 3. Salva no banco de dados
        Endereco enderecoSalvo = repository.save(endereco);

        // 4. Retorna o DTO atualizado com o ID gerado
        return new EnderecoDTO(enderecoSalvo);
    }

    @Transactional(readOnly = true)
    public EnderecoDTO buscarPorId(Long id) {
        Endereco endereco = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Endereço não encontrado com ID: " + id));
        return new EnderecoDTO(endereco);
    }

    @Transactional(readOnly = true)
    public List<EnderecoDTO> listarTodos() {
        return repository.findAll().stream()
                .map(EnderecoDTO::new)
                .collect(Collectors.toList());
    }
}