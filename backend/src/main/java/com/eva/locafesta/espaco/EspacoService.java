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
    private GeocodingService geocodingService;

    // CREATE - Cadastrar um novo espaço buscando pelo ID do USUÁRIO
    @Transactional
    public EspacoDTO criarEspaco(Long usuarioId, EspacoDTO dto) { // <-- MUDOU AQUI (recebe usuarioId)
        
        // <-- MUDOU AQUI: Agora busca o locador através do ID do Usuário
        PerfilLocador locador = locadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado para este usuário."));

        if (dto.getEndereco() == null) {
            throw new RuntimeException("O endereço do espaço é obrigatório.");
        }

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
                .locador(locador) // O locador correto foi encontrado na busca acima
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .valorDiaria(dto.getValorDiaria())
                .capacidadePessoas(dto.getCapacidadePessoas())
                .restricoesHorario(dto.getRestricoesHorario())
                .horarioFechamento(dto.getHorarioFechamento())
                .endereco(endereco)
                .build();

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

    // READ - Listar todos os espaços buscando pelo ID do USUÁRIO
    public List<EspacoDTO> listarPorUsuarioId(Long usuarioId) { // <-- MUDOU AQUI
        
        // 1. Primeiro achamos quem é o locador desse usuário
        PerfilLocador locador = locadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado para este usuário."));
        
        // 2. Agora usamos o seu EspacoRepository (que está certinho!) para buscar os espaços do locador encontrado
        return espacoRepository.findByLocadorId(locador.getId()).stream()
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