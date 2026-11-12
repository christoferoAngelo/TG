package com.eva.locafesta.locador.painel;

import com.eva.locafesta.documento.DocumentoEntity;
import com.eva.locafesta.documento.DocumentoRepository;
import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.ComissaoPlataforma;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.AlertaDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.ContadoresAnuncioDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.EspacoRankingDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.EventoProximoDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.KpisDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.PedidoResumoDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.PeriodoProcuraDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.PontoMensalDTO;
import com.eva.locafesta.locador.painel.LocadorPainelDTO.StatusCountDTO;
import com.eva.locafesta.reserva.PoliticaReembolso;
import com.eva.locafesta.reserva.Reserva;
import com.eva.locafesta.reserva.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class LocadorPainelService {

    private static final DateTimeFormatter MES_ROTULO =
            DateTimeFormatter.ofPattern("MMM/yy", Locale.forLanguageTag("pt-BR"));
    private static final Locale PT = Locale.forLanguageTag("pt-BR");

    private final PerfilLocadorRepository perfilLocadorRepository;
    private final EspacoRepository espacoRepository;
    private final ReservaRepository reservaRepository;
    private final DocumentoRepository documentoRepository;
    private final ComissaoPlataforma comissaoPlataforma;

    public LocadorPainelService(
            PerfilLocadorRepository perfilLocadorRepository,
            EspacoRepository espacoRepository,
            ReservaRepository reservaRepository,
            DocumentoRepository documentoRepository,
            ComissaoPlataforma comissaoPlataforma
    ) {
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.espacoRepository = espacoRepository;
        this.reservaRepository = reservaRepository;
        this.documentoRepository = documentoRepository;
        this.comissaoPlataforma = comissaoPlataforma;
    }

    @Transactional(readOnly = true)
    public LocadorPainelDTO resumo(Long usuarioId) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o usuário.");
        }

        PerfilLocador locador = perfilLocadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Perfil de locador não encontrado."
                ));

        List<Espaco> espacos = espacoRepository.findByLocadorId(locador.getId());
        List<Reserva> reservas = reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(usuarioId);

        LocalDate hoje = PoliticaReembolso.hojeNoBrasil();
        YearMonth mesAtual = YearMonth.from(hoje);
        YearMonth mesAnterior = mesAtual.minusMonths(1);

        Map<String, Long> porStatus = new LinkedHashMap<>();
        porStatus.put("PENDENTE", 0L);
        porStatus.put("APROVADA", 0L);
        porStatus.put("REJEITADA", 0L);
        porStatus.put("CANCELADA", 0L);

        BigDecimal fatMes = BigDecimal.ZERO;
        BigDecimal fatMesAnt = BigDecimal.ZERO;
        BigDecimal aReceber = BigDecimal.ZERO;
        Map<YearMonth, BigDecimal> fatPorMes = new HashMap<>();
        Map<YearMonth, Long> procuraMes = new HashMap<>();
        Map<DayOfWeek, Long> procuraDia = new EnumMap<>(DayOfWeek.class);
        Map<Long, Acumulo> ranking = new HashMap<>();

        for (DayOfWeek d : DayOfWeek.values()) {
            procuraDia.put(d, 0L);
        }

        List<Reserva> pendentes = new ArrayList<>();
        List<Reserva> proximos = new ArrayList<>();

        for (Reserva r : reservas) {
            String status = r.getStatus() != null ? r.getStatus().toUpperCase(Locale.ROOT) : "";
            porStatus.merge(status, 1L, Long::sum);

            if (r.getDataEvento() == null || r.getEspaco() == null) continue;

            boolean aprovada = "APROVADA".equals(status);
            boolean pendente = "PENDENTE".equals(status);
            boolean procura = aprovada || pendente;

            YearMonth ym = YearMonth.from(r.getDataEvento());
            if (procura) {
                procuraMes.merge(ym, 1L, Long::sum);
                procuraDia.merge(r.getDataEvento().getDayOfWeek(), 1L, Long::sum);
            }

            if (aprovada) {
                BigDecimal valor = valorDe(r);
                fatPorMes.merge(ym, valor, BigDecimal::add);
                if (ym.equals(mesAtual)) fatMes = fatMes.add(valor);
                if (ym.equals(mesAnterior)) fatMesAnt = fatMesAnt.add(valor);
                // Mesma regra do Financeiro em "Este mês": só APROVADA do mês calendário.
                if (ym.equals(mesAtual) && !r.isPagamentoLiberado()) {
                    aReceber = aReceber.add(comissaoPlataforma.liquido(valor));
                }
                ranking.computeIfAbsent(r.getEspaco().getId(), id -> new Acumulo(
                        id,
                        r.getEspaco().getTitulo()
                )).somar(valor);

                if (!r.getDataEvento().isBefore(hoje)) {
                    proximos.add(r);
                }
            }

            if (pendente) {
                pendentes.add(r);
            }
        }

        Double variacao = null;
        if (fatMesAnt.compareTo(BigDecimal.ZERO) > 0) {
            variacao = fatMes.subtract(fatMesAnt)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(fatMesAnt, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        } else if (fatMes.compareTo(BigDecimal.ZERO) > 0) {
            variacao = 100.0;
        }

        List<PontoMensalDTO> serie = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = mesAtual.minusMonths(i);
            BigDecimal v = fatPorMes.getOrDefault(ym, BigDecimal.ZERO);
            long q = reservas.stream()
                    .filter(r -> "APROVADA".equalsIgnoreCase(r.getStatus())
                            && r.getDataEvento() != null
                            && YearMonth.from(r.getDataEvento()).equals(ym))
                    .count();
            serie.add(new PontoMensalDTO(
                    ym.toString(),
                    ym.format(MES_ROTULO),
                    v,
                    q
            ));
        }

        List<BigDecimal> sparkFat = serie.stream()
                .skip(Math.max(0, serie.size() - 6))
                .map(PontoMensalDTO::valor)
                .toList();

        List<BigDecimal> sparkPedidos = new ArrayList<>();
        List<BigDecimal> sparkReceber = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = mesAtual.minusMonths(i);
            long ped = reservas.stream()
                    .filter(r -> "PENDENTE".equalsIgnoreCase(r.getStatus())
                            && r.getDataEvento() != null
                            && YearMonth.from(r.getDataEvento()).equals(ym))
                    .count();
            sparkPedidos.add(BigDecimal.valueOf(ped));
            BigDecimal ar = reservas.stream()
                    .filter(r -> "APROVADA".equalsIgnoreCase(r.getStatus())
                            && !r.isPagamentoLiberado()
                            && r.getDataEvento() != null
                            && YearMonth.from(r.getDataEvento()).equals(ym))
                    .map(this::valorDe)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            sparkReceber.add(ar);
        }

        pendentes.sort(Comparator.comparing(Reserva::getId));
        List<PedidoResumoDTO> pedidosAgora = pendentes.stream()
                .limit(5)
                .map(this::mapPedido)
                .toList();

        proximos.sort(Comparator
                .comparing(Reserva::getDataEvento)
                .thenComparing(r -> r.getHoraInicio() != null ? r.getHoraInicio() : java.time.LocalTime.MIN));
        List<EventoProximoDTO> proximosDto = proximos.stream()
                .limit(8)
                .map(this::mapEvento)
                .toList();
        EventoProximoDTO proximo = proximosDto.isEmpty() ? null : proximosDto.get(0);

        List<StatusCountDTO> statusDto = List.of(
                new StatusCountDTO("PENDENTE", "Pendentes", porStatus.getOrDefault("PENDENTE", 0L)),
                new StatusCountDTO("APROVADA", "Aprovadas", porStatus.getOrDefault("APROVADA", 0L)),
                new StatusCountDTO("REJEITADA", "Rejeitadas", porStatus.getOrDefault("REJEITADA", 0L)),
                new StatusCountDTO("CANCELADA", "Canceladas", porStatus.getOrDefault("CANCELADA", 0L))
        );

        List<EspacoRankingDTO> rankingDto = ranking.values().stream()
                .sorted(Comparator.comparingLong(Acumulo::reservas).reversed())
                .limit(6)
                .map(a -> new EspacoRankingDTO(a.id, a.titulo, a.reservas, a.faturamento))
                .toList();

        // Últimos 6 meses em ordem cronológica (não por quantidade)
        List<PeriodoProcuraDTO> mesesProcura = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = mesAtual.minusMonths(i);
            mesesProcura.add(new PeriodoProcuraDTO(
                    ym.format(MES_ROTULO),
                    procuraMes.getOrDefault(ym, 0L)
            ));
        }

        // Segunda → domingo (ordem natural de DayOfWeek)
        List<PeriodoProcuraDTO> diasProcura = new ArrayList<>();
        for (DayOfWeek d : DayOfWeek.values()) {
            diasProcura.add(new PeriodoProcuraDTO(
                    d.getDisplayName(TextStyle.SHORT, PT),
                    procuraDia.getOrDefault(d, 0L)
            ));
        }

        ContadoresAnuncioDTO contadores = new ContadoresAnuncioDTO(
                espacos.size(),
                espacos.stream().filter(e -> "APROVADO".equalsIgnoreCase(e.getStatusAprovacao())).count(),
                espacos.stream().filter(e -> "PENDENTE".equalsIgnoreCase(e.getStatusAprovacao())).count(),
                espacos.stream().filter(e -> "REJEITADO".equalsIgnoreCase(e.getStatusAprovacao())).count(),
                espacos.stream().filter(e -> !Boolean.FALSE.equals(e.getAtivo())).count()
        );

        List<AlertaDTO> alertas = montarAlertas(espacos, pendentes.size(), usuarioId);

        KpisDTO kpis = new KpisDTO(
                pendentes.size(),
                fatMes,
                fatMesAnt,
                variacao,
                aReceber,
                proximo,
                sparkPedidos,
                sparkFat,
                sparkReceber
        );

        return new LocadorPainelDTO(
                alertas,
                kpis,
                serie,
                statusDto,
                rankingDto,
                mesesProcura,
                diasProcura,
                pedidosAgora,
                proximosDto,
                contadores
        );
    }

    private List<AlertaDTO> montarAlertas(List<Espaco> espacos, long pendentes, Long usuarioId) {
        List<AlertaDTO> alertas = new ArrayList<>();
        if (pendentes > 0) {
            alertas.add(new AlertaDTO(
                    "PEDIDOS",
                    "Pedidos aguardando resposta",
                    pendentes == 1
                            ? "Há 1 pedido precisando da sua decisão."
                            : "Há " + pendentes + " pedidos precisando da sua decisão.",
                    "/locador/reservas?status=PENDENTE"
            ));
        }

        for (Espaco e : espacos) {
            if ("REJEITADO".equalsIgnoreCase(e.getStatusAprovacao())) {
                String motivo = e.getMotivoRejeicao() != null && !e.getMotivoRejeicao().isBlank()
                        ? e.getMotivoRejeicao()
                        : "Sem motivo informado.";
                alertas.add(new AlertaDTO(
                        "ANUNCIO_REJEITADO",
                        "Anúncio rejeitado: " + (e.getTitulo() != null ? e.getTitulo() : "espaço"),
                        motivo,
                        "/locador/espacos"
                ));
            }
        }

        List<Long> espacoIds = espacos.stream().map(Espaco::getId).filter(Objects::nonNull).toList();
        List<DocumentoEntity> docs = new ArrayList<>(documentoRepository.findByUsuarioId(usuarioId));
        if (!espacoIds.isEmpty()) {
            docs.addAll(documentoRepository.findByEspacoIdIn(espacoIds));
        }
        long docsProblema = docs.stream()
                .filter(d -> {
                    String s = d.getStatus() != null ? d.getStatus().toUpperCase(Locale.ROOT) : "";
                    return "PENDENTE".equals(s) || "REJEITADO".equals(s) || "CORRECAO".equals(s)
                            || "CORREÇÃO".equals(s) || "AGUARDANDO_CORRECAO".equals(s);
                })
                .count();
        if (docsProblema > 0) {
            alertas.add(new AlertaDTO(
                    "DOCUMENTO",
                    "Documentos pendentes ou rejeitados",
                    docsProblema == 1
                            ? "Há 1 documento que precisa da sua atenção."
                            : "Há " + docsProblema + " documentos que precisam da sua atenção.",
                    "/perfil"
            ));
        }
        return alertas;
    }

    private PedidoResumoDTO mapPedido(Reserva r) {
        return new PedidoResumoDTO(
                r.getId(),
                r.getEspaco() != null ? r.getEspaco().getId() : null,
                r.getEspaco() != null ? r.getEspaco().getTitulo() : "Espaço",
                r.getLocatario() != null ? primeiroNome(r.getLocatario().getNome()) : "Locatário",
                r.getDataEvento(),
                r.getHoraInicio(),
                r.getHoraFim(),
                valorDe(r),
                r.getStatus()
        );
    }

    private EventoProximoDTO mapEvento(Reserva r) {
        return new EventoProximoDTO(
                r.getId(),
                r.getEspaco() != null ? r.getEspaco().getId() : null,
                r.getEspaco() != null ? r.getEspaco().getTitulo() : "Espaço",
                r.getLocatario() != null ? primeiroNome(r.getLocatario().getNome()) : "Locatário",
                r.getDataEvento(),
                r.getHoraInicio(),
                r.getHoraFim(),
                valorDe(r)
        );
    }

    private BigDecimal valorDe(Reserva r) {
        return r.getValorTotal() != null ? r.getValorTotal() : BigDecimal.ZERO;
    }

    private static String primeiroNome(String nome) {
        if (nome == null || nome.isBlank()) return "Locatário";
        return nome.trim().split("\\s+")[0];
    }

    private static final class Acumulo {
        private final Long id;
        private final String titulo;
        private long reservas;
        private BigDecimal faturamento = BigDecimal.ZERO;

        private Acumulo(Long id, String titulo) {
            this.id = id;
            this.titulo = titulo != null ? titulo : "Espaço";
        }

        private void somar(BigDecimal valor) {
            reservas++;
            faturamento = faturamento.add(valor);
        }

        private long reservas() {
            return reservas;
        }
    }
}
