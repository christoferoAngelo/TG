package com.eva.locafesta.espaco;

import com.eva.locafesta.caracteristica.Caracteristica;
import com.eva.locafesta.caracteristica.CaracteristicaRepository;
import com.eva.locafesta.caracteristica.CaracteristicaDTO;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.endereco.GeocodingService;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.notificacao.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
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

    @Autowired
    private NotificacaoService notificacaoService;

    // ------------------------------------------------------------------
    // Validações e helpers compartilhados entre criar e atualizar
    // ------------------------------------------------------------------

    // Validação de horário com suporte a madrugada.
    // Se NÃO fecha no dia seguinte, o fechamento precisa ser depois da abertura.
    private void validarHorario(EspacoDTO dto) {
        if (dto.getHorarioAbertura() == null || dto.getHorarioFechamento() == null) {
            throw new IllegalArgumentException(
                "Informe o horário de abertura e fechamento do espaço."
            );
        }

        boolean fechaNoDiaSeguinte = Boolean.TRUE.equals(dto.getFechaNoDiaSeguinte());

        if (!fechaNoDiaSeguinte && !dto.getHorarioFechamento().isAfter(dto.getHorarioAbertura())) {
            throw new IllegalArgumentException(
                "O fechamento deve ocorrer depois da abertura. "
                + "Espaços que funcionam após a meia-noite "
                + "precisam marcar a opção de fechamento no dia seguinte."
            );
        }
    }

    private void validarLimites(EspacoDTO dto) {
        if (dto.getIntervaloLimpezaMin() != null && dto.getIntervaloLimpezaMin() < 0) {
            throw new IllegalArgumentException(
                "O intervalo de limpeza não pode ser negativo."
            );
        }

        if (dto.getDuracaoMaxHoras() != null && dto.getDuracaoMaxHoras().signum() <= 0) {
            throw new IllegalArgumentException(
                "A duração máxima deve ser maior que zero."
            );
        }

        if (dto.getAntecedenciaMinimaDias() != null
                && (dto.getAntecedenciaMinimaDias() < 0 || dto.getAntecedenciaMinimaDias() > 365)) {
            throw new IllegalArgumentException(
                "A antecedência mínima deve ser um número de 0 a 365 dias."
            );
        }

        if (dto.getPrazoCancelamentoDias() != null
                && (dto.getPrazoCancelamentoDias() < 0 || dto.getPrazoCancelamentoDias() > 30)) {
            throw new IllegalArgumentException(
                "O prazo de cancelamento do locador deve ser um número de 0 a 30 dias."
            );
        }

        exigirTamanho(dto.getTitulo(), 150, "O nome do espaço");
        exigirTamanho(dto.getDescricao(), 2000, "A descrição");
        exigirTamanho(dto.getRestricoesHorario(), 4000, "As regras");
        if (dto.getEndereco() != null) {
            exigirTamanho(dto.getEndereco().getLogradouro(), 120, "O logradouro");
            exigirTamanho(dto.getEndereco().getNumero(), 20, "O número");
            exigirTamanho(dto.getEndereco().getComplemento(), 80, "O complemento");
            exigirTamanho(dto.getEndereco().getBairro(), 80, "O bairro");
            exigirTamanho(dto.getEndereco().getCidade(), 80, "A cidade");
        }
        exigirTamanho(dto.getRespostaLocador(), 500, "A resposta do locador");
        exigirTamanho(dto.getMotivoRejeicao(), 500, "O motivo da recusa");

        boolean integral = !Boolean.FALSE.equals(dto.getPermitePeriodoIntegral());
        boolean fracionado = Boolean.TRUE.equals(dto.getPermiteMeioPeriodo());
        if (!integral && !fracionado) {
            throw new IllegalArgumentException("Escolha diária, fracionada ou as duas.");
        }

        int fotos = 0;
        if (dto.getAmbientes() != null) {
            for (EspacoAmbienteDTO ambiente : dto.getAmbientes()) {
                exigirTamanho(ambiente.getTitulo(), 100, "O nome do cômodo");
                exigirTamanho(ambiente.getDescricao(), 800, "A descrição do cômodo");
                int doAmbiente = ambiente.getImagensUrls() == null ? 0 : ambiente.getImagensUrls().size();
                if (doAmbiente > 8) {
                    throw new IllegalArgumentException("Cada cômodo aceita no máximo 8 fotos.");
                }
                fotos += doAmbiente;
            }
        }
        if (fotos > 24) {
            throw new IllegalArgumentException("O anúncio aceita no máximo 24 fotos.");
        }
    }

    private void exigirTamanho(String valor, int maximo, String nome) {
        if (valor != null && valor.trim().length() > maximo) {
            throw new IllegalArgumentException(nome + " deve ter no máximo " + maximo + " caracteres.");
        }
    }

    private Set<Caracteristica> resolverCaracteristicas(Set<CaracteristicaDTO> dtos) {
        Set<Caracteristica> caracteristicas = new HashSet<>();
        if (dtos == null) {
            return caracteristicas;
        }
        for (CaracteristicaDTO caracDTO : dtos) {
            if (caracDTO.getId() != null) {
                Caracteristica carac = caracteristicaRepository.findById(caracDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Característica não encontrada para o ID: " + caracDTO.getId()));
                caracteristicas.add(carac);
            }
        }
        return caracteristicas;
    }

    private List<EspacoAmbiente> montarAmbientes(Espaco espaco, List<EspacoAmbienteDTO> dtos) {
        return dtos.stream().map(ambDTO ->
            EspacoAmbiente.builder()
                    .espaco(espaco)
                    .titulo(ambDTO.getTitulo())
                    .descricao(ambDTO.getDescricao())
                    .imagensUrls(ambDTO.getImagensUrls() != null
                            ? new ArrayList<>(ambDTO.getImagensUrls())
                            : new ArrayList<>())
                    .build()
        ).collect(Collectors.toList());
    }

    // ------------------------------------------------------------------
    // Detecção de mudanças "sensíveis" (as que exigem nova análise do admin)
    // ------------------------------------------------------------------

    private String norm(String s) {
        return s == null ? "" : s.trim();
    }

    private String normCep(String s) {
        return s == null ? "" : s.replaceAll("\\D", "");
    }

    private boolean valorMudou(BigDecimal atual, BigDecimal novo) {
        if (atual == null || novo == null) {
            return atual != novo;
        }
        return atual.compareTo(novo) != 0;
    }

    private boolean enderecoMudou(Endereco atual, EnderecoDTO novo) {
        if (novo == null) {
            return false;
        }
        if (atual == null) {
            return true;
        }
        return !normCep(atual.getCep()).equals(normCep(novo.getCep()))
            || !norm(atual.getLogradouro()).equals(norm(novo.getLogradouro()))
            || !norm(atual.getNumero()).equals(norm(novo.getNumero()))
            || !norm(atual.getComplemento()).equals(norm(novo.getComplemento()))
            || !norm(atual.getBairro()).equals(norm(novo.getBairro()))
            || !norm(atual.getCidade()).equals(norm(novo.getCidade()))
            || !norm(atual.getEstado()).equalsIgnoreCase(norm(novo.getEstado()));
    }

    private String assinaturaAmbiente(String titulo, String descricao, List<String> urls) {
        return norm(titulo) + "|" + norm(descricao) + "|"
            + (urls == null ? "" : String.join(",", urls));
    }

    private boolean ambientesMudaram(List<EspacoAmbiente> atuais, List<EspacoAmbienteDTO> novos) {
        if (novos == null) {
            return false;
        }

        List<String> assinaturasAtuais = atuais.stream()
            .map(a -> assinaturaAmbiente(a.getTitulo(), a.getDescricao(), a.getImagensUrls()))
            .collect(Collectors.toList());

        List<String> assinaturasNovas = novos.stream()
            .map(a -> assinaturaAmbiente(a.getTitulo(), a.getDescricao(), a.getImagensUrls()))
            .collect(Collectors.toList());

        return !assinaturasAtuais.equals(assinaturasNovas);
    }

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

        validarHorario(dto);
        validarLimites(dto);
        
        boolean temDiaria = dto.getValorDiaria() != null && dto.getValorDiaria().compareTo(BigDecimal.ZERO) > 0;
        boolean temMeioPeriodo = dto.getValorMeioPeriodo() != null && dto.getValorMeioPeriodo().compareTo(BigDecimal.ZERO) > 0;
        boolean temHora = dto.getValorHora() != null && dto.getValorHora().compareTo(BigDecimal.ZERO) > 0;

        if (!temDiaria && !temMeioPeriodo && !temHora) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe pelo menos um valor de locação (diária, meio período ou por hora).");
        }
        
        validarPrecos(dto);
        
        
        
        Espaco espaco = Espaco.builder()
                .locador(locador)
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .valorDiaria(dto.getValorDiaria())
                .valorMeioPeriodo(dto.getValorMeioPeriodo())
                .valorHora(dto.getValorHora())
                .capacidadePessoas(dto.getCapacidadePessoas())
                .restricoesHorario(dto.getRestricoesHorario())
                .horarioAbertura(dto.getHorarioAbertura())
                .horarioFechamento(dto.getHorarioFechamento())
                .permiteMeioPeriodo(
                    dto.getPermiteMeioPeriodo() != null ? dto.getPermiteMeioPeriodo() : true
                )
                .permitePeriodoIntegral(
                    dto.getPermitePeriodoIntegral() != null ? dto.getPermitePeriodoIntegral() : true
                )
                .permiteHorarioPersonalizado(
                    dto.getPermiteHorarioPersonalizado() != null ? dto.getPermiteHorarioPersonalizado() : false
                )
                .aprovacaoInstantanea(Boolean.TRUE.equals(dto.getAprovacaoInstantanea()))
                .duracaoMaxHoras(dto.getDuracaoMaxHoras())
                .intervaloLimpezaMin(
                    dto.getIntervaloLimpezaMin() != null ? dto.getIntervaloLimpezaMin() : 0
                )
                .antecedenciaMinimaDias(
                    dto.getAntecedenciaMinimaDias() != null ? dto.getAntecedenciaMinimaDias() : 0
                )
                .prazoCancelamentoDias(
                    dto.getPrazoCancelamentoDias() != null ? dto.getPrazoCancelamentoDias() : 2
                )
                .endereco(endereco)
                .fotoCapaUrl(limparUrlCapa(dto.getFotoCapaUrl()))
                .statusAprovacao("PENDENTE")
                .build();

        // 1. Vincula as Características
        if (dto.getCaracteristicas() != null && !dto.getCaracteristicas().isEmpty()) {
            espaco.setCaracteristicas(resolverCaracteristicas(dto.getCaracteristicas()));
        }

        // 2. Vincula os Ambientes e as Imagens
        if (dto.getAmbientes() != null && !dto.getAmbientes().isEmpty()) {
            espaco.setAmbientes(montarAmbientes(espaco, dto.getAmbientes()));
        }

        Espaco espacoSalvo = espacoRepository.save(espaco);
        return new EspacoDTO(espacoSalvo);
    }

    private String limparUrlCapa(String url) {
        if (url == null) return null;
        String limpa = url.trim();
        if (limpa.isEmpty()) return null;
        if (limpa.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A URL da capa é inválida.");
        }
        return limpa;
    }

    // UPDATE / REENVIO - Atualiza o espaço.
    // O status só volta para PENDENTE quando:
    //   - o anúncio estava REJEITADO (é um reenvio para análise), ou
    //   - algo sensível mudou: título, descrição, valor, capacidade, endereço, cômodos/fotos.
    // Horários, formas de locação, duração, limpeza, restrições e características
    // são atualizados sem perder a aprovação.
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

        validarHorario(dto);
        validarLimites(dto);
        validarPrecos(dto);
        
        boolean temDiaria = dto.getValorDiaria() != null && dto.getValorDiaria().compareTo(BigDecimal.ZERO) > 0;
        boolean temMeioPeriodo = dto.getValorMeioPeriodo() != null && dto.getValorMeioPeriodo().compareTo(BigDecimal.ZERO) > 0;
        boolean temHora = dto.getValorHora() != null && dto.getValorHora().compareTo(BigDecimal.ZERO) > 0;

        if (!temDiaria && !temMeioPeriodo && !temHora) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe pelo menos um valor de locação (diária, meio período ou por hora).");
        }
        

        // ---- 1. Descobre se houve mudança sensível (ANTES de alterar a entidade) ----
        boolean mudancaSensivel =
               !norm(espaco.getTitulo()).equals(norm(dto.getTitulo()))
            || !norm(espaco.getDescricao()).equals(norm(dto.getDescricao()))
            || valorMudou(espaco.getValorDiaria(), dto.getValorDiaria())
            || !java.util.Objects.equals(espaco.getCapacidadePessoas(), dto.getCapacidadePessoas())
            || enderecoMudou(espaco.getEndereco(), dto.getEndereco())
            || ambientesMudaram(espaco.getAmbientes(), dto.getAmbientes())
	        || valorMudou(espaco.getValorMeioPeriodo(), dto.getValorMeioPeriodo())
	        || valorMudou(espaco.getValorHora(), dto.getValorHora());

        boolean eraRejeitado = "REJEITADO".equalsIgnoreCase(espaco.getStatusAprovacao());

        // ---- 2. Campos cadastrais ----
        espaco.setTitulo(dto.getTitulo());
        espaco.setDescricao(dto.getDescricao());
        espaco.setValorDiaria(dto.getValorDiaria());
        espaco.setValorMeioPeriodo(dto.getValorMeioPeriodo()); 
        espaco.setValorHora(dto.getValorHora());
        espaco.setCapacidadePessoas(dto.getCapacidadePessoas());
        espaco.setRestricoesHorario(dto.getRestricoesHorario());
        espaco.setFotoCapaUrl(limparUrlCapa(dto.getFotoCapaUrl()));

        // ---- 3. Funcionamento ----
        espaco.setHorarioAbertura(dto.getHorarioAbertura());
        espaco.setHorarioFechamento(dto.getHorarioFechamento());

        // ---- 4. Modalidades de locação ----
        if (dto.getPermiteMeioPeriodo() != null) {
            espaco.setPermiteMeioPeriodo(dto.getPermiteMeioPeriodo());
        }

        if (dto.getPermitePeriodoIntegral() != null) {
            espaco.setPermitePeriodoIntegral(dto.getPermitePeriodoIntegral());
        }

        if (dto.getPermiteHorarioPersonalizado() != null) {
            espaco.setPermiteHorarioPersonalizado(dto.getPermiteHorarioPersonalizado());
        }

        if (dto.getAprovacaoInstantanea() != null) {
            espaco.setAprovacaoInstantanea(dto.getAprovacaoInstantanea());
        }

        // Duração máxima é opcional: null significa "sem limite", então precisa poder limpar
        espaco.setDuracaoMaxHoras(dto.getDuracaoMaxHoras());

        if (dto.getIntervaloLimpezaMin() != null) {
            espaco.setIntervaloLimpezaMin(dto.getIntervaloLimpezaMin());
        }

        if (dto.getAntecedenciaMinimaDias() != null) {
            espaco.setAntecedenciaMinimaDias(dto.getAntecedenciaMinimaDias());
        }

        if (dto.getPrazoCancelamentoDias() != null) {
            espaco.setPrazoCancelamentoDias(dto.getPrazoCancelamentoDias());
        }

        // ---- 5. Mensagem de ajuste/réplica ao admin ----
        if (dto.getRespostaLocador() != null) {
            espaco.setRespostaLocador(dto.getRespostaLocador());
        }

        // ---- 6. Endereço (só geocodifica quando mudou, para não perder lat/long) ----
        if (dto.getEndereco() != null && enderecoMudou(espaco.getEndereco(), dto.getEndereco())) {
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

        // ---- 7. Características ----
        if (dto.getCaracteristicas() != null) {
            espaco.setCaracteristicas(resolverCaracteristicas(dto.getCaracteristicas()));
        }

        // ---- 8. Ambientes e imagens ----
        if (dto.getAmbientes() != null && ambientesMudaram(espaco.getAmbientes(), dto.getAmbientes())) {
            // Remove os antigos e insere os novos (orphanRemoval=true no Espaco.java)
            espaco.getAmbientes().clear();
            espaco.getAmbientes().addAll(montarAmbientes(espaco, dto.getAmbientes()));
        }

        // ---- 9. Status de aprovação ----
        if (eraRejeitado || mudancaSensivel) {
            espaco.setStatusAprovacao("PENDENTE");
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
        if (espacoSalvo.getLocador() != null && espacoSalvo.getLocador().getUsuario() != null) {
            notificacaoService.avisar(
                    espacoSalvo.getLocador().getUsuario().getId(),
                    null,
                    "Espaço aprovado",
                    "O anúncio " + espacoSalvo.getTitulo() + " foi aprovado e já pode receber reservas."
            );
        }
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

    // ambientes é lazy: precisa de transação aberta para montar o DTO
    @Transactional(readOnly = true)
    public EspacoDTO buscarPorId(Long espacoId) {
        Espaco espaco = espacoRepository.findById(espacoId)
            .orElseThrow(() -> new RuntimeException("Espaço não encontrado!"));

        return converterParaDTO(espaco);
    }

    @Transactional
    public EspacoDTO alternarStatusAtivo(Long usuarioId, Long espacoId) {
        // 1. Busca o espaço no banco de dados
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado"));

        // 2. Busca o perfil do locador através do usuarioId
        PerfilLocador locador = locadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RuntimeException("Perfil de locador não encontrado para este usuário."));

        // 3. Validação de segurança
        if (!espaco.getLocador().getId().equals(locador.getId())) {
            throw new RuntimeException("Acesso negado: Você não tem permissão para alterar este espaço.");
        }

        // 4. Inverte o status atual.
        boolean statusAtual = espaco.getAtivo() != null ? espaco.getAtivo() : true;
        espaco.setAtivo(!statusAtual);

        // 5. Salva a alteração no banco de dados
        Espaco espacoSalvo = espacoRepository.save(espaco);

        // 6. Retorna convertido para DTO
        return converterParaDTO(espacoSalvo);
    }

    private EspacoDTO converterParaDTO(Espaco espaco) {
        return new EspacoDTO(espaco);
    }

    @Transactional(readOnly = true)
    public List<EspacoDTO> buscarEspacosPorTermo(String termo) {

        List<Espaco> espacos;

        if (termo == null || termo.trim().isEmpty()) {
            espacos = espacoRepository
                .findByAtivoTrueAndStatusAprovacao("APROVADO");
        } else {
            espacos = espacoRepository
                .buscarPorTermoMultiplo(termo.trim());
        }

        return espacos.stream()
            .map(EspacoDTO::new)
            .collect(Collectors.toList());
    }
    
    private void validarPrecos(EspacoDTO dto) {
        if (Boolean.TRUE.equals(dto.getPermitePeriodoIntegral())) {
            if (dto.getValorDiaria() == null || dto.getValorDiaria().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Informe um valor válido para o período integral (diária).");
            }
        }

        if (Boolean.TRUE.equals(dto.getPermiteMeioPeriodo())) {
            if (dto.getValorMeioPeriodo() == null || dto.getValorMeioPeriodo().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Informe um valor válido para o meio período.");
            }
        }

        if (Boolean.TRUE.equals(dto.getPermiteHorarioPersonalizado())) {
            if (dto.getValorHora() == null || dto.getValorHora().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Informe um valor válido por hora.");
            }
        }
    }
}
