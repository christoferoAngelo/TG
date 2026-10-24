package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.notificacao.NotificacaoService;
import com.eva.locafesta.reserva.AgendaEspaco.Intervalo;
import com.eva.locafesta.reserva.AgendaEspaco.Modalidade;
import com.eva.locafesta.reserva.AgendaEspaco.Periodo;
import com.eva.locafesta.reserva.AgendaEspaco.Regras;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReservaService {

    // Status que seguram o horário no calendário. REJEITADA e CANCELADA liberam.
    private static final List<String> STATUS_BLOQUEANTES = List.of("PENDENTE", "APROVADA");

    private static final DateTimeFormatter DATA_AVISO = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ReservaRepository reservaRepository;
    private final EspacoRepository espacoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoService notificacaoService;

    public ReservaService(
            ReservaRepository reservaRepository,
            EspacoRepository espacoRepository,
            UsuarioRepository usuarioRepository,
            NotificacaoService notificacaoService) {
        this.reservaRepository = reservaRepository;
        this.espacoRepository = espacoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacaoService = notificacaoService;
    }

    // ---------------------------------------------------------------
    // Criação da reserva (com controle de horário)
    // ---------------------------------------------------------------
    @Transactional
    public ReservaResponseDTO criarReserva(ReservaDTO dto, Long usuarioId) {
        if (dto.espacoId() == null || dto.dataEvento() == null) {
            throw erro(HttpStatus.BAD_REQUEST, "Informe o espaço e a data do evento.");
        }

        // Trava a linha do espaço até o fim da transação: duas solicitações para o
        // mesmo espaço passam uma de cada vez pela checagem de conflito abaixo.
        Espaco espaco = espacoRepository.buscarParaReserva(dto.espacoId())
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Espaço não encontrado"));

        Usuario locatario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (Boolean.FALSE.equals(espaco.getAtivo()) || !"APROVADO".equals(espaco.getStatusAprovacao())) {
            throw erro(HttpStatus.BAD_REQUEST, "Este espaço não está disponível para reservas.");
        }
        int antecedencia = espaco.getAntecedenciaMinimaDias() != null ? espaco.getAntecedenciaMinimaDias() : 0;
        if (dto.dataEvento().isBefore(LocalDate.now().plusDays(antecedencia))) {
            throw erro(HttpStatus.BAD_REQUEST, antecedencia <= 0
                    ? "A data do evento já passou."
                    : "Este espaço só aceita reservas com pelo menos " + antecedencia + " dia(s) de antecedência.");
        }

        Regras regras = regrasDe(espaco);
        Intervalo intervalo = resolverIntervalo(dto, regras);

        if (dto.dataEvento().equals(LocalDate.now()) && intervalo.inicio().isBefore(LocalTime.now())) {
            throw erro(HttpStatus.BAD_REQUEST, "Este horário já passou.");
        }

        boolean conflito = intervalosOcupados(espaco.getId(), dto.dataEvento(), regras).stream()
                .anyMatch(ocupado -> AgendaEspaco.conflita(intervalo, ocupado, regras.limpezaMin()));
        if (conflito) {
            throw erro(HttpStatus.CONFLICT, "Este horário não está mais disponível. Escolha outro período.");
        }

        Reserva novaReserva = Reserva.builder()
                .espaco(espaco)
                .locatario(locatario)
                .dataEvento(dto.dataEvento())
                .horaInicio(intervalo.inicio())
                .horaFim(intervalo.fim())
                .valorTotal(dto.valorTotal() != null ? dto.valorTotal() : espaco.getValorDiaria())
                .observacao(dto.observacao())
                .status(Boolean.TRUE.equals(espaco.getAprovacaoInstantanea()) ? "APROVADA" : "PENDENTE")
                .build();

        return mapearParaResponseDTO(reservaRepository.save(novaReserva));
    }

    // ---------------------------------------------------------------
    // Disponibilidade de um espaço numa data (tela de escolha de horário)
    // ---------------------------------------------------------------
    @Transactional(readOnly = true)
    public DisponibilidadeDTO consultarDisponibilidade(Long espacoId, LocalDate data) {
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Espaço não encontrado"));

        int antecedencia = espaco.getAntecedenciaMinimaDias() != null ? espaco.getAntecedenciaMinimaDias() : 0;
        if (data.isBefore(LocalDate.now().plusDays(antecedencia))) {
            throw erro(HttpStatus.BAD_REQUEST, antecedencia <= 0
                    ? "A data do evento já passou."
                    : "Este espaço só aceita reservas com pelo menos " + antecedencia + " dia(s) de antecedência.");
        }

        Regras regras = regrasDe(espaco);
        List<Intervalo> ocupados = intervalosOcupados(espacoId, data, regras);
        LocalDateTime agora = LocalDateTime.now();

        List<DisponibilidadeDTO.PeriodoDTO> periodos = AgendaEspaco.periodosOferecidos(regras).stream()
                .map(p -> {
                    boolean livre = ocupados.stream()
                            .noneMatch(o -> AgendaEspaco.conflita(p.intervalo(), o, regras.limpezaMin()));
                    boolean noFuturo = !LocalDateTime.of(data, p.intervalo().inicio()).isBefore(agora);
                    return new DisponibilidadeDTO.PeriodoDTO(
                            p.modalidade(), p.numero(),
                            p.intervalo().inicio(), p.intervalo().fim(),
                            livre && noFuturo);
                })
                .toList();

        return new DisponibilidadeDTO(
                espacoId, data,
                regras.abertura(), regras.fechamento(),
                regras.limpezaMin(), regras.personalizado(),
                periodos,
                ocupados.stream()
                        .map(o -> new DisponibilidadeDTO.IntervaloDTO(o.inicio(), o.fim()))
                        .toList());
    }

    // ---------------------------------------------------------------
    // Apoio: regras do espaço, intervalo pedido e horários ocupados
    // ---------------------------------------------------------------
    private Regras regrasDe(Espaco espaco) {
        if (espaco.getHorarioAbertura() == null || espaco.getHorarioFechamento() == null) {
            throw erro(HttpStatus.BAD_REQUEST, "Este espaço ainda não informou o horário de funcionamento.");
        }
        return new Regras(
                espaco.getHorarioAbertura(),
                espaco.getHorarioFechamento(),
                !Boolean.FALSE.equals(espaco.getPermiteMeioPeriodo()),      // nulo (dado antigo) = padrão true
                !Boolean.FALSE.equals(espaco.getPermitePeriodoIntegral()),  // nulo (dado antigo) = padrão true
                Boolean.TRUE.equals(espaco.getPermiteHorarioPersonalizado()),
                espaco.getDuracaoMaxHoras(),
                espaco.getIntervaloLimpezaMin() != null ? espaco.getIntervaloLimpezaMin() : 0);
    }

    private Intervalo resolverIntervalo(ReservaDTO dto, Regras regras) {
        // Sem modalidade = comportamento antigo (dia inteiro)
        Modalidade modalidade = dto.modalidade() != null ? dto.modalidade() : Modalidade.INTEGRAL;
        List<Periodo> oferecidos = AgendaEspaco.periodosOferecidos(regras);

        switch (modalidade) {
            case INTEGRAL:
                return oferecidos.stream()
                        .filter(p -> p.modalidade() == Modalidade.INTEGRAL)
                        .findFirst()
                        .orElseThrow(() -> erro(HttpStatus.BAD_REQUEST, "Este espaço não aceita locação em período integral."))
                        .intervalo();

            case MEIO_PERIODO:
                int numero = dto.periodo() != null ? dto.periodo() : 1;
                return oferecidos.stream()
                        .filter(p -> p.modalidade() == Modalidade.MEIO_PERIODO && p.numero() == numero)
                        .findFirst()
                        .orElseThrow(() -> erro(HttpStatus.BAD_REQUEST, "Este espaço não oferece o período " + numero + "."))
                        .intervalo();

            default: // PERSONALIZADO
                Intervalo pedido = new Intervalo(dto.horaInicio(), dto.horaFim());
                if (dto.horaInicio() == null || dto.horaFim() == null) {
                    throw erro(HttpStatus.BAD_REQUEST, "Informe o horário de início e de fim.");
                }
                String problema = AgendaEspaco.validarPersonalizado(regras, pedido);
                if (problema != null) {
                    throw erro(HttpStatus.BAD_REQUEST, problema);
                }
                return pedido;
        }
    }

    // Horários já tomados na data. Reserva antiga (sem horário) vale como dia inteiro.
    private List<Intervalo> intervalosOcupados(Long espacoId, LocalDate data, Regras regras) {
        return reservaRepository.findByEspacoIdAndDataEventoAndStatusIn(espacoId, data, STATUS_BLOQUEANTES).stream()
                .map(r -> (r.getHoraInicio() != null && r.getHoraFim() != null)
                        ? new Intervalo(r.getHoraInicio(), r.getHoraFim())
                        : new Intervalo(regras.abertura(), regras.fechamento()))
                .toList();
    }

    private static ResponseStatusException erro(HttpStatus status, String mensagem) {
        return new ResponseStatusException(status, mensagem);
    }

   // Listar para o Dashboard do Locador
    public List<ReservaResponseDTO> listarSolicitacoesDoLocador(Long usuarioId) {
        List<Reserva> reservas = reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(usuarioId);
        return reservas.stream().map(this::mapearParaResponseDTO).toList();
    }

    // Listar as próprias reservas do locatário
    public List<ReservaResponseDTO> listarMinhasReservas(Long usuarioId) {
        List<Reserva> reservas = reservaRepository.findByLocatarioIdOrderByDataEventoDesc(usuarioId);
        return reservas.stream().map(this::mapearParaResponseDTO).toList();
    }

    // Listar as avaliações públicas de um espaço (para a página de detalhes)
    public List<AvaliacaoResponseDTO> listarAvaliacoesDoEspaco(Long espacoId) {
        List<Reserva> reservas = reservaRepository.findByEspacoIdAndNotaIsNotNullOrderByDataAvaliacaoDesc(espacoId);

        return reservas.stream().map(reserva -> new AvaliacaoResponseDTO(
                primeiroNome(reserva.getLocatario().getNome()),
                reserva.getNota(),
                reserva.getComentarioAvaliacao(),
                reserva.getDataAvaliacao()
        )).toList();
    }

    // Evita expor o nome completo do locatário na página pública do espaço
    private String primeiroNome(String nomeCompleto) {
        if (nomeCompleto == null || nomeCompleto.isBlank()) return "Cliente";
        return nomeCompleto.trim().split("\\s+")[0];
    }

    private ReservaResponseDTO mapearParaResponseDTO(Reserva reserva) {
        return new ReservaResponseDTO(
                reserva.getId(),
                new ReservaResponseDTO.EspacoResumoDTO(
                        reserva.getEspaco().getId(),
                        reserva.getEspaco().getTitulo()
                ),
                reserva.getDataEvento(),
                reserva.getHoraInicio(),
                reserva.getHoraFim(),
                reserva.getValorTotal(),
                reserva.getStatus(),
                reserva.getNota(),
                reserva.getComentarioAvaliacao(),
                reserva.getCanceladoPor(),
                reserva.getCondicaoReembolso(),
                reserva.getCanceladoEm(),
                reserva.getEspaco() != null && reserva.getEspaco().getPrazoCancelamentoDias() != null
                        ? reserva.getEspaco().getPrazoCancelamentoDias()
                        : 2,
                reserva.isPagamentoLiberado()
        );
    }

    @Transactional
    public ReservaResponseDTO aprovarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        if (!reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: Você não é o dono deste espaço.");
        }
        if (!"PENDENTE".equals(reserva.getStatus())) {
            throw new RuntimeException("Só é possível aprovar um pedido que ainda está aguardando.");
        }

        reserva.setStatus("APROVADA");
        reserva.setPagamentoLiberado(true);
        Reserva salva = reservaRepository.save(reserva);
        avisarDecisao(salva, true);
        return mapearParaResponseDTO(salva);
    }

    @Transactional
    public ReservaResponseDTO rejeitarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        if (!reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: Você não é o dono deste espaço.");
        }
        if (!"PENDENTE".equals(reserva.getStatus())) {
            throw new RuntimeException("Só é possível recusar um pedido que ainda está aguardando.");
        }

        reserva.setStatus("REJEITADA");
        reserva.setPagamentoLiberado(false);
        Reserva salva = reservaRepository.save(reserva);
        avisarDecisao(salva, false);
        return mapearParaResponseDTO(salva);
    }

    private void avisarDecisao(Reserva reserva, boolean aprovada) {
        if (reserva.getLocatario() == null) return;
        String espaco = reserva.getEspaco() != null ? reserva.getEspaco().getTitulo() : "o espaço";
        String data = reserva.getDataEvento() != null ? reserva.getDataEvento().format(DATA_AVISO) : "a data marcada";
        if (aprovada) {
            notificacaoService.avisar(
                    reserva.getLocatario().getId(),
                    reserva.getId(),
                    "Reserva confirmada",
                    "O locador confirmou a reserva de " + espaco + " em " + data + ". O pagamento está liberado."
            );
        } else {
            notificacaoService.avisar(
                    reserva.getLocatario().getId(),
                    reserva.getId(),
                    "Reserva recusada",
                    "O locador recusou a reserva de " + espaco + " em " + data
                            + ". A data foi liberada e não há cobrança."
            );
        }
    }

    @Transactional
    public ReservaResponseDTO cancelarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaAberta(reservaId);
        if (reserva.getLocatario() == null || !reserva.getLocatario().getId().equals(usuarioId)) {
            throw erro(HttpStatus.FORBIDDEN, "Você não pode cancelar esta reserva.");
        }
        if (!"PENDENTE".equals(reserva.getStatus()) && !"APROVADA".equals(reserva.getStatus())) {
            throw erro(HttpStatus.BAD_REQUEST, "Esta reserva não pode mais ser cancelada.");
        }
        if (!inicioDoEvento(reserva).isAfter(LocalDateTime.now())) {
            throw erro(HttpStatus.BAD_REQUEST, "Não é possível cancelar um evento que já começou.");
        }

        String condicao = "APROVADA".equals(reserva.getStatus()) ? "SEM_REEMBOLSO" : "SEM_COBRANCA";
        return efetivarCancelamento(reserva, "LOCATARIO", condicao);
    }

    @Transactional
    public ReservaResponseDTO cancelarPeloLocador(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaAberta(reservaId);
        if (reserva.getEspaco() == null
                || reserva.getEspaco().getLocador() == null
                || reserva.getEspaco().getLocador().getUsuario() == null
                || !reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw erro(HttpStatus.FORBIDDEN, "Você não pode cancelar esta reserva.");
        }
        if (!"APROVADA".equals(reserva.getStatus())) {
            throw erro(HttpStatus.BAD_REQUEST, "O locador só cancela reservas confirmadas.");
        }

        int prazo = reserva.getEspaco().getPrazoCancelamentoDias() != null
                ? reserva.getEspaco().getPrazoCancelamentoDias()
                : 2;
        LocalDateTime limite = inicioDoEvento(reserva).minusDays(prazo);
        if (!LocalDateTime.now().isBefore(limite)) {
            throw erro(HttpStatus.BAD_REQUEST,
                    "O prazo para cancelar esta reserva já passou. O limite é de " + prazo + " dia(s) antes do evento.");
        }

        return efetivarCancelamento(reserva, "LOCADOR", "TOTAL");
    }

    @Transactional(readOnly = true)
    public List<Long> espacosSemVaga(LocalDate data) {
        Map<Long, List<Reserva>> porEspaco = new LinkedHashMap<>();
        for (Reserva reserva : reservaRepository.findByDataEventoAndStatusIn(data, STATUS_BLOQUEANTES)) {
            if (reserva.getEspaco() == null || reserva.getEspaco().getId() == null) continue;
            porEspaco.computeIfAbsent(reserva.getEspaco().getId(), id -> new ArrayList<>()).add(reserva);
        }

        List<Long> semVaga = new ArrayList<>();
        for (Map.Entry<Long, List<Reserva>> entrada : porEspaco.entrySet()) {
            if (semNenhumPeriodoLivre(entrada.getValue().get(0).getEspaco(), entrada.getValue())) {
                semVaga.add(entrada.getKey());
            }
        }
        return semVaga;
    }

    private Reserva reservaAberta(Long reservaId) {
        return reservaRepository.findById(reservaId)
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private LocalDateTime inicioDoEvento(Reserva reserva) {
        LocalTime inicio = reserva.getHoraInicio() != null ? reserva.getHoraInicio() : LocalTime.MIN;
        return LocalDateTime.of(reserva.getDataEvento(), inicio);
    }

    private ReservaResponseDTO efetivarCancelamento(Reserva reserva, String autor, String condicao) {
        reserva.setStatus("CANCELADA");
        reserva.setCanceladoPor(autor);
        reserva.setCondicaoReembolso(condicao);
        reserva.setCanceladoEm(LocalDateTime.now());
        Reserva salva = reservaRepository.save(reserva);
        avisarCancelamento(salva, autor, condicao);
        return mapearParaResponseDTO(salva);
    }

    private void avisarCancelamento(Reserva reserva, String autor, String condicao) {
        String quem = "LOCADOR".equals(autor) ? "O locador" : "O locatário";
        String reembolso = switch (condicao) {
            case "TOTAL" -> "Reembolso total.";
            case "SEM_REEMBOLSO" -> "Sem reembolso automático.";
            default -> "Pedido ainda não confirmado, sem cobrança.";
        };
        String espaco = reserva.getEspaco() != null ? reserva.getEspaco().getTitulo() : "o espaço";
        String data = reserva.getDataEvento() != null ? reserva.getDataEvento().format(DATA_AVISO) : "a data marcada";
        String mensagem = quem + " cancelou a reserva de " + espaco + " em " + data
                + ". " + reembolso + " A data voltou a ficar disponível para novas reservas.";

        Long locatarioId = reserva.getLocatario() != null ? reserva.getLocatario().getId() : null;
        Long locadorId = reserva.getEspaco() != null
                && reserva.getEspaco().getLocador() != null
                && reserva.getEspaco().getLocador().getUsuario() != null
                ? reserva.getEspaco().getLocador().getUsuario().getId()
                : null;

        notificacaoService.avisar(locatarioId, reserva.getId(), "Reserva cancelada", mensagem);
        if (locadorId != null && !locadorId.equals(locatarioId)) {
            notificacaoService.avisar(locadorId, reserva.getId(), "Reserva cancelada", mensagem);
        }
    }

    private boolean semNenhumPeriodoLivre(Espaco espaco, List<Reserva> ocupadas) {
        if (espaco.getHorarioAbertura() == null || espaco.getHorarioFechamento() == null) {
            return !ocupadas.isEmpty();
        }
        Regras regras = regrasDe(espaco);
        List<Periodo> periodos = AgendaEspaco.periodosOferecidos(regras);
        List<Intervalo> tomados = ocupadas.stream()
                .map(r -> (r.getHoraInicio() != null && r.getHoraFim() != null)
                        ? new Intervalo(r.getHoraInicio(), r.getHoraFim())
                        : new Intervalo(regras.abertura(), regras.fechamento()))
                .toList();
        if (periodos.isEmpty()) {
            return !tomados.isEmpty();
        }
        return periodos.stream().allMatch(periodo ->
                tomados.stream().anyMatch(ocupado -> AgendaEspaco.conflita(periodo.intervalo(), ocupado, regras.limpezaMin())));
    }

    // Avaliar uma reserva já concluída (feito pelo locatário)
    public ReservaResponseDTO avaliarReserva(Long reservaId, Long usuarioId, AvaliacaoDTO dto) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        if (!reserva.getLocatario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: você não é o locatário desta reserva.");
        }

        if (!"APROVADA".equals(reserva.getStatus())) {
            throw new RuntimeException("Só é possível avaliar reservas aprovadas.");
        }

        // O evento só "aconteceu" depois do horário de fim (reservas antigas, sem horário, valem pela data)
        LocalTime fimEvento = reserva.getHoraFim() != null ? reserva.getHoraFim() : LocalTime.MIN;
        if (LocalDateTime.of(reserva.getDataEvento(), fimEvento).isAfter(LocalDateTime.now())) {
            throw new RuntimeException("O evento ainda não aconteceu.");
        }

        if (reserva.getNota() != null) {
            throw new RuntimeException("Esta reserva já foi avaliada.");
        }

        if (dto.nota() == null || dto.nota() < 1 || dto.nota() > 5) {
            throw new RuntimeException("A nota deve ser um número entre 1 e 5.");
        }

        reserva.setNota(dto.nota());
        reserva.setComentarioAvaliacao(dto.comentario());
        reserva.setDataAvaliacao(LocalDateTime.now());
        Reserva reservaSalva = reservaRepository.save(reserva);

        atualizarNotaDoEspaco(reserva.getEspaco().getId());
        atualizarNotaGeralDoLocador(reserva.getEspaco().getLocador().getUsuario().getId());

        return mapearParaResponseDTO(reservaSalva);
    }

    // Recalcula a média e a quantidade de avaliações do espaço avaliado
    private void atualizarNotaDoEspaco(Long espacoId) {
        Double media = reservaRepository.calcularMediaNotaPorEspaco(espacoId);
        long quantidade = reservaRepository.countByEspacoIdAndNotaIsNotNull(espacoId);

        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado"));

        espaco.setNotaMedia(media);
        espaco.setQuantidadeAvaliacoes((int) quantidade);
        espacoRepository.save(espaco);
    }

    // Recalcula a média de notas do locador e atualiza o campo nota_geral do usuário
    private void atualizarNotaGeralDoLocador(Long locadorUsuarioId) {
        Double media = reservaRepository.calcularMediaNotaPorLocador(locadorUsuarioId);

        Usuario usuario = usuarioRepository.findById(locadorUsuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        usuario.setNota(media != null ? (int) Math.round(media) : 0);
        usuarioRepository.save(usuario);
    }
}
