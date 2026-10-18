package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
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
import java.util.List;

@Service
public class ReservaService {

    // Status que seguram o horário no calendário. REJEITADA e CANCELADA liberam.
    private static final List<String> STATUS_BLOQUEANTES = List.of("PENDENTE", "APROVADA");

    private final ReservaRepository reservaRepository;
    private final EspacoRepository espacoRepository;
    private final UsuarioRepository usuarioRepository;

    public ReservaService(ReservaRepository reservaRepository, EspacoRepository espacoRepository, UsuarioRepository usuarioRepository) {
        this.reservaRepository = reservaRepository;
        this.espacoRepository = espacoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // ---------------------------------------------------------------
    // Criação da reserva (com controle de horário)
    // ---------------------------------------------------------------
    @Transactional
    public Reserva criarReserva(ReservaDTO dto, Long usuarioId) {
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
        if (dto.dataEvento().isBefore(LocalDate.now())) {
            throw erro(HttpStatus.BAD_REQUEST, "A data do evento já passou.");
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
                .status("PENDENTE") // Status padrão
                .build();

        return reservaRepository.save(novaReserva);
    }

    // ---------------------------------------------------------------
    // Disponibilidade de um espaço numa data (tela de escolha de horário)
    // ---------------------------------------------------------------
    @Transactional(readOnly = true)
    public DisponibilidadeDTO consultarDisponibilidade(Long espacoId, LocalDate data) {
        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Espaço não encontrado"));

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
        List<Reserva> reservas = reservaRepository.findByEspacoLocadorUsuarioId(usuarioId);
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
                reserva.getComentarioAvaliacao()
        );
    }

    // Aprovar Reserva
    public Reserva aprovarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        // Proteção: Garante que quem está aprovando é o dono do espaço
        if (!reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: Você não é o dono deste espaço.");
        }

        reserva.setStatus("APROVADA");
        return reservaRepository.save(reserva);
    }

    // Rejeitar Reserva
    public Reserva rejeitarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        if (!reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: Você não é o dono deste espaço.");
        }

        reserva.setStatus("REJEITADA");
        return reservaRepository.save(reserva);
    }

    // Avaliar uma reserva já concluída (feito pelo locatário)
    public Reserva avaliarReserva(Long reservaId, Long usuarioId, AvaliacaoDTO dto) {
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

        return reservaSalva;
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
