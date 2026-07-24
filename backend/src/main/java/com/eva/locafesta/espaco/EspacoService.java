package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.Caracteristica;
import com.eva.locafesta.caracteristica.CaracteristicaRepository;
import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.espaco.EspacoDTO;
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

    // CREATE - Cadastrar um novo espaço para um locador
    @Transactional
    public EspacoDTO criarEspaco(Long locadorId, EspacoDTO dto) {
        PerfilLocador locador = locadorRepository.findById(locadorId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado."));

        Espaco espaco = new Espaco();
        espaco.setLocador(locador);
        espaco.setTitulo(dto.getTitulo());
        espaco.setDescricao(dto.getDescricao());
        espaco.setValorDiaria(dto.getValorDiaria());
        espaco.setCapacidadePessoas(dto.getCapacidadePessoas());
        espaco.setRestricoesHorario(dto.getRestricoesHorario());
        espaco.setHorarioFechamento(dto.getHorarioFechamento());

        // Converte o EnderecoDTO para a entidade Endereco
        if (dto.getEndereco() != null) {
            Endereco endereco = new Endereco();
            endereco.setCep(dto.getEndereco().getCep());
            endereco.setLogradouro(dto.getEndereco().getLogradouro());
            endereco.setNumero(dto.getEndereco().getNumero());
            endereco.setComplemento(dto.getEndereco().getComplemento());
            endereco.setBairro(dto.getEndereco().getBairro());
            endereco.setCidade(dto.getEndereco().getCidade());
            endereco.setEstado(dto.getEndereco().getEstado());
            endereco.setLatitude(dto.getEndereco().getLatitude());
            endereco.setLongitude(dto.getEndereco().getLongitude());
            
            // O dono do endereço é o usuário atrelado ao locador
            endereco.setUsuario(locador.getUsuario());
            espaco.setEndereco(endereco);
        } else {
            throw new RuntimeException("O endereço do espaço é obrigatório.");
        }

        // Associa as Características (@ManyToMany) com base nos IDs enviados pelo Front-End
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
}