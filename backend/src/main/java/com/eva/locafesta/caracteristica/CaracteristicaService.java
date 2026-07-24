package com.eva.locafesta.caracteristica;

import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CaracteristicaService {

    @Autowired
    private CaracteristicaRepository repository;

    private CaracteristicaDTO converterParaDTO(Caracteristica caracteristica) {
        return new CaracteristicaDTO(caracteristica);
    }

    // CREATE - Criar nova característica
    @Transactional
    public CaracteristicaDTO criar(CaracteristicaDTO dto) {
        if (repository.existsByNomeIgnoreCase(dto.getNome())) {
            throw new RuntimeException("Já existe uma característica cadastrada com o nome: " + dto.getNome());
        }

        Caracteristica novaCaracteristica = new Caracteristica();
        novaCaracteristica.setNome(dto.getNome());
        novaCaracteristica.setIcone(dto.getIcone());

        Caracteristica salva = repository.save(novaCaracteristica);
        return converterParaDTO(salva);
    }

    // READ - Listar todas (usado no front-end para montar os checkboxes de filtros e cadastros)
    public List<CaracteristicaDTO> listarTodas() {
        return repository.findAll().stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    // READ - Buscar por ID
    public CaracteristicaDTO buscarPorId(Long id) {
        Caracteristica caracteristica = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Característica não encontrada para o ID: " + id));
        return converterParaDTO(caracteristica);
    }

    // UPDATE - Atualizar característica
    @Transactional
    public CaracteristicaDTO atualizar(Long id, CaracteristicaDTO dto) {
        Caracteristica caracteristica = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Característica não encontrada."));

        // Verifica se está alterando para um nome que já existe no banco
        if (!caracteristica.getNome().equalsIgnoreCase(dto.getNome()) && 
            repository.existsByNomeIgnoreCase(dto.getNome())) {
            throw new RuntimeException("Já existe outra característica com o nome: " + dto.getNome());
        }

        caracteristica.setNome(dto.getNome());
        caracteristica.setIcone(dto.getIcone());

        Caracteristica atualizada = repository.save(caracteristica);
        return converterParaDTO(atualizada);
    }

    // DELETE - Excluir característica
    @Transactional
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Característica não encontrada para exclusão.");
        }
        try {
            repository.deleteById(id);
        } catch (Exception e) {
            throw new RuntimeException("Não é possível excluir esta característica pois ela já está vinculada a um ou mais espaços.");
        }
    }
}