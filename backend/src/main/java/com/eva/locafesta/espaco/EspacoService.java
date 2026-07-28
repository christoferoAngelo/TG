package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.Caracteristica;
import com.eva.locafesta.caracteristica.CaracteristicaRepository;
import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.GeocodingService;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EspacoService {

    @Autowired
    private EspacoRepository espacoRepository;

    @Autowired
    private PerfilLocadorRepository locadorRepository;

    @Autowired
    private CaracteristicaRepository caracteristicaRepository;

    @Autowired
    private GeocodingService geocodingService; // <--- Injetando nosso novo serviço

    // CREATE - Cadastrar um novo espaço para um locador
    @Transactional
    public EspacoDTO criarEspaco(Long locadorId, EspacoDTO dto) {
        PerfilLocador locador = locadorRepository.findById(locadorId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado."));

        if (dto.getEndereco() == null) {
            throw new RuntimeException("O endereço do espaço é obrigatório.");
        }

        // Busca a latitude e longitude se não vieram preenchidas
        geocodingService.preencherCoordenadas(dto.getEndereco());

        Endereco endereco = Endereco.builder()
                .cep(dto.getEndereco().getCep())
                .logradouro(dto.getEndereco().getLogradouro())
                .numero(dto.getEndereco().getNumero())
                .complemento(dto.getEndereco().getComplemento())
                .bairro(dto.getEndereco().getBairro())
                .cidade(dto.getEndereco().getCidade())
                .estado(dto.getEndereco().getEstado())
                .latitude(dto.getEndereco().getLatitude())
                .longitude(dto.getEndereco().getLongitude())
                .build();

        Espaco espaco = Espaco.builder()
                .locador(locador)
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .valorDiaria(dto.getValorDiaria())
                .capacidadePessoas(dto.getCapacidadePessoas())
                .restricoesHorario(dto.getRestricoesHorario())
                .horarioFechamento(dto.getHorarioFechamento())
                .endereco(endereco)
                .build();

        // Lógica de características...
        if (dto.getCaracteristicas() != null && !dto.getCaracteristicas().isEmpty()) {
            Set<Caracteristica> caracteristicas = new HashSet<>();
            for (CaracteristicaDTO caracDTO : dto.getCaracteristicas()) {
                if (caracDTO.getId() != null) {
                    Caracteristica carac = caracteristicaRepository.findById(caracDTO.getId())
                            .orElseThrow(() -> new RuntimeException("Característica não encontrada para o ID: " + caracDTO.getId()));
                    caracteristicas.add(carac);
                }
            }
            espaco.setCaracteristicas(caracteristicas);
        }

        Espaco espacoSalvo = espacoRepository.save(espaco);
        return new EspacoDTO(espacoSalvo);
    }

    // READ - Listar todos os espaços de um locador específico
    public List<EspacoDTO> listarPorLocador(Long locadorId) {
        if (!locadorRepository.existsById(locadorId)) {
            throw new RuntimeException("Perfil de locador não encontrado.");
        }
        return espacoRepository.findByLocadorId(locadorId).stream()
                .map(EspacoDTO::new)
                .collect(Collectors.toList());
    }

    // READ - Listar TODOS os espaços do sistema (para o Painel do Admin)
    public List<EspacoDTO> listarTodos() {
        return espacoRepository.findAll().stream()
                .map(EspacoDTO::new)
                .collect(Collectors.toList());
    }
}