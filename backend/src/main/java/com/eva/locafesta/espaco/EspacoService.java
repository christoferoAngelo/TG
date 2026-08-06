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

    // CREATE - Cadastrar um novo espaço
    @Transactional
    public EspacoDTO criarEspaco(Long usuarioId, EspacoDTO dto) {
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
                .locador(locador)
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .valorDiaria(dto.getValorDiaria())
                .capacidadePessoas(dto.getCapacidadePessoas())
                .restricoesHorario(dto.getRestricoesHorario())
                .horarioFechamento(dto.getHorarioFechamento())
                .endereco(endereco)
                .statusAprovacao("PENDENTE")
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

    // UPDATE / REENVIO - Atualizar espaço e reenviar para aprovação
    @Transactional
    public EspacoDTO atualizarEspaco(Long espacoId, Long usuarioId, EspacoDTO dto) {
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado com o ID: " + espacoId));

        PerfilLocador locador = locadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado para este usuário."));

        // Valida se o espaço realmente pertence ao locador logado
        if (!espaco.getLocador().getId().equals(locador.getId())) {
            throw new RuntimeException("Acesso negado: você não tem permissão para alterar este espaço.");
        }

        // Atualiza campos cadastrais
        espaco.setTitulo(dto.getTitulo());
        espaco.setDescricao(dto.getDescricao());
        espaco.setValorDiaria(dto.getValorDiaria());
        espaco.setCapacidadePessoas(dto.getCapacidadePessoas());
        espaco.setRestricoesHorario(dto.getRestricoesHorario());
        espaco.setHorarioFechamento(dto.getHorarioFechamento());

        // Se o locador enviou uma mensagem de ajuste/réplica
        if (dto.getRespostaLocador() != null) {
            espaco.setRespostaLocador(dto.getRespostaLocador());
        }

        // Ao reenviar/editar, o status volta para PENDENTE para análise do Admin
        espaco.setStatusAprovacao("PENDENTE");

        // Atualiza Endereço se informado
        if (dto.getEndereco() != null) {
            geocodingService.preencherCoordenadas(dto.getEndereco());
            Endereco end = espaco.getEndereco() != null ? espaco.getEndereco() : new Endereco();
            end.setCep(dto.getEndereco().getCep());
            end.setLogradouro(dto.getEndereco().getLogradouro());
            end.setNumero(dto.getEndereco().getNumero());
            end.setComplemento(dto.getEndereco().getComplemento());
            end.setBairro(dto.getEndereco().getBairro());
            end.setCidade(dto.getEndereco().getCidade());
            end.setEstado(dto.getEndereco().getEstado());
            end.setLatitude(dto.getEndereco().getLatitude());
            end.setLongitude(dto.getEndereco().getLongitude());
            espaco.setEndereco(end);
        }

        // Atualiza Características
        if (dto.getCaracteristicas() != null) {
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

    // READ - Listar espaços do usuário logado
    @Transactional(readOnly = true)
    public List<EspacoDTO> listarPorUsuarioId(Long usuarioId) {
        PerfilLocador locador = locadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado para este usuário."));
        
        return espacoRepository.findByLocadorId(locador.getId()).stream()
                .map(EspacoDTO::new)
                .collect(Collectors.toList());
    }

    // READ - Listar todos os espaços do sistema (Admin)
    @Transactional(readOnly = true)
    public List<EspacoDTO> listarTodos() {
        return espacoRepository.findAll().stream()
                .map(EspacoDTO::new)
                .collect(Collectors.toList());
    }

    // READ - Listar por status de aprovação
    @Transactional(readOnly = true)
    public List<EspacoDTO> listarPorStatus(String status) {
        return espacoRepository.findByStatusAprovacao(status.toUpperCase()).stream()
                .map(EspacoDTO::new)
                .collect(Collectors.toList());
    }

    // Aprovar espaço (Limpa o motivo e a resposta do locador)
    @Transactional
    public EspacoDTO aprovarEspaco(Long espacoId) {
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado com o ID: " + espacoId));

        espaco.setStatusAprovacao("APROVADO");
        espaco.setMotivoRejeicao(null);
        espaco.setRespostaLocador(null);
        
        Espaco espacoSalvo = espacoRepository.save(espaco);
        return new EspacoDTO(espacoSalvo);
    }

    // Rejeitar espaço gravando o motivo fornecido pelo admin
    @Transactional
    public EspacoDTO rejeitarEspaco(Long espacoId, String motivo) {
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado com o ID: " + espacoId));

        espaco.setStatusAprovacao("REJEITADO");
        espaco.setMotivoRejeicao(motivo);
        espaco.setRespostaLocador(null); // Reseta para aguardar a nova réplica do locador
        
        Espaco espacoSalvo = espacoRepository.save(espaco);
        return new EspacoDTO(espacoSalvo);
    }

    // Alterar status genérico
    @Transactional
    public EspacoDTO alterarStatusAprovacao(Long espacoId, String novoStatus) {
        if ("APROVADO".equalsIgnoreCase(novoStatus)) {
            return aprovarEspaco(espacoId);
        }
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado com o ID: " + espacoId));

        espaco.setStatusAprovacao(novoStatus.toUpperCase());
        Espaco espacoSalvo = espacoRepository.save(espaco);
        return new EspacoDTO(espacoSalvo);
    }
}