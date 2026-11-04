package com.eva.locafesta.locador.financeiro;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.ComissaoPlataforma;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.EspacoOpcaoDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.EspacoRankingDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.KpisDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.LinhaReservaDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.PeriodoProcuraDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.PontoMensalDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.VariacaoItemDTO;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.VariacaoKpisDTO;
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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class LocadorFinanceiroService {

    private static final Locale PT = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter MES_ROTULO =
            DateTimeFormatter.ofPattern("MMM/yy", PT);

    private final PerfilLocadorRepository perfilLocadorRepository;
    private final EspacoRepository espacoRepository;
    private final ReservaRepository reservaRepository;
    private final ComissaoPlataforma comissaoPlataforma;

    public LocadorFinanceiroService(
            PerfilLocadorRepository perfilLocadorRepository,
            EspacoRepository espacoRepository,
            ReservaRepository reservaRepository,
            ComissaoPlataforma comissaoPlataforma
    ) {
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.espacoRepository = espacoRepository;
        this.reservaRepository = reservaRepository;
        this.comissaoPlataforma = comissaoPlataforma;
    }

    @Transactional(readOnly = true)
    public LocadorFinanceiroDTO resumo(
            Long usuarioId,
            LocalDate de,
            LocalDate ate,
            Long espacoId,
            int pagina,
            int tamanhoPagina
    ) {
        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o usuário.");
        }

        PerfilLocador locador = perfilLocadorRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Perfil de locador não encontrado."
                ));

        List<Espaco> espacos = espacoRepository.findByLocadorId(locador.getId());
        List<EspacoOpcaoDTO> opcoes = espacos.stream()
                .map(e -> new EspacoOpcaoDTO(e.getId(), e.getTitulo() != null ? e.getTitulo() : "Espaço"))
                .toList();

        if (espacoId != null) {
            boolean dono = espacos.stream().anyMatch(e -> Objects.equals(e.getId(), espacoId));
            if (!dono) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Espaço não pertence a este locador.");
            }
        }

        LocalDate hoje = PoliticaReembolso.hojeNoBrasil();
        LocalDate inicio = de != null ? de : hoje.withDayOfMonth(1);
        LocalDate fim = ate != null ? ate : hoje;
        if (fim.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data final deve ser após a inicial.");
        }

        int page = Math.max(0, pagina);
        int size = Math.min(50, Math.max(1, tamanhoPagina));

        // Filtra no banco por locador + período (+ espaço). Agregação ainda em memória.
        // TODO: se o volume crescer, mover somas/rankings/série mensal para consultas de agregação no banco
        // (GROUP BY mês/espaço/status) em vez de carregar as entidades e calcular aqui.
        List<Reserva> noIntervalo = reservaRepository.findByLocadorPeriodoEEspaco(
                usuarioId, inicio, fim, espacoId
        );

        long diasPeriodo = ChronoUnit.DAYS.between(inicio, fim) + 1;
        LocalDate prevFim = inicio.minusDays(1);
        LocalDate prevInicio = prevFim.minusDays(diasPeriodo - 1);
        List<Reserva> periodoAnterior = reservaRepository.findByLocadorPeriodoEEspaco(
                usuarioId, prevInicio, prevFim, espacoId
        );

        Totais totais = agregar(noIntervalo);
        Totais totaisAnt = agregar(periodoAnterior);

        // A receber: estoque aberto (APROVADA + !pagamentoLiberado), inclui eventos futuros.
        // Não usa a data final do filtro de faturamento — mesma regra do Painel.
        BigDecimal aReceber = somarAReceber(
                reservaRepository.findAReceberPorLocadorEEspaco(usuarioId, espacoId)
        );

        BigDecimal comissao = comissaoPlataforma.taxa(totais.bruto);
        BigDecimal liquido = comissaoPlataforma.liquido(totais.bruto);
        long quantidade = totais.aprovadas.size();

        BigDecimal comissaoAnt = comissaoPlataforma.taxa(totaisAnt.bruto);
        BigDecimal liquidoAnt = comissaoPlataforma.liquido(totaisAnt.bruto);

        VariacaoKpisDTO variacao = new VariacaoKpisDTO(
                variacaoDe(totais.bruto, totaisAnt.bruto),
                variacaoDe(comissao, comissaoAnt),
                variacaoDe(liquido, liquidoAnt),
                // Estoque aberto (inclui futuros) — sem variação por período
                VariacaoItemDTO.semBase(),
                variacaoDeQuantidade(quantidade, totaisAnt.aprovadas.size())
        );

        YearMonth mesInicio = YearMonth.from(inicio);
        YearMonth mesFim = YearMonth.from(fim);
        List<PontoMensalDTO> serie = new ArrayList<>();
        for (YearMonth ym = mesInicio; !ym.isAfter(mesFim); ym = ym.plusMonths(1)) {
            BigDecimal v = totais.fatPorMes.getOrDefault(ym, BigDecimal.ZERO);
            serie.add(new PontoMensalDTO(
                    ym.toString(),
                    ym.format(MES_ROTULO),
                    v,
                    comissaoPlataforma.liquido(v)
            ));
        }

        List<EspacoRankingDTO> rankingDto = totais.ranking.values().stream()
                .sorted(Comparator.comparingLong(Acumulo::reservas).reversed())
                .limit(8)
                .map(a -> new EspacoRankingDTO(a.id, a.titulo, a.reservas, a.faturamento))
                .toList();

        List<PeriodoProcuraDTO> mesesProcura = new ArrayList<>();
        for (YearMonth ym = mesInicio; !ym.isAfter(mesFim); ym = ym.plusMonths(1)) {
            mesesProcura.add(new PeriodoProcuraDTO(
                    ym.format(MES_ROTULO),
                    totais.procuraMes.getOrDefault(ym, 0L)
            ));
        }

        List<PeriodoProcuraDTO> diasProcura = new ArrayList<>();
        for (DayOfWeek d : DayOfWeek.values()) {
            diasProcura.add(new PeriodoProcuraDTO(
                    d.getDisplayName(TextStyle.SHORT, PT),
                    totais.procuraDia.getOrDefault(d, 0L)
            ));
        }

        List<Reserva> aprovadasOrdenadas = new ArrayList<>(totais.aprovadas);
        aprovadasOrdenadas.sort(Comparator
                .comparing(Reserva::getDataEvento)
                .reversed()
                .thenComparing(Reserva::getId, Comparator.reverseOrder()));

        long total = aprovadasOrdenadas.size();
        int totalPaginas = total == 0 ? 0 : (int) Math.ceil(total / (double) size);
        int from = Math.min(page * size, (int) total);
        int to = Math.min(from + size, (int) total);
        List<LinhaReservaDTO> linhas = aprovadasOrdenadas.subList(from, to).stream()
                .map(this::mapLinha)
                .toList();

        KpisDTO kpis = new KpisDTO(totais.bruto, comissao, liquido, aReceber, total);

        return new LocadorFinanceiroDTO(
                inicio,
                fim,
                espacoId,
                comissaoPlataforma.percentual(),
                kpis,
                variacao,
                serie,
                rankingDto,
                mesesProcura,
                diasProcura,
                linhas,
                page,
                size,
                total,
                totalPaginas,
                opcoes
        );
    }

    private Totais agregar(List<Reserva> reservas) {
        Totais t = new Totais();
        for (DayOfWeek d : DayOfWeek.values()) {
            t.procuraDia.put(d, 0L);
        }

        for (Reserva r : reservas) {
            if (r.getDataEvento() == null || r.getEspaco() == null) continue;

            String status = r.getStatus() != null ? r.getStatus().toUpperCase(Locale.ROOT) : "";
            boolean aprovada = "APROVADA".equals(status);
            boolean pendente = "PENDENTE".equals(status);

            if (aprovada || pendente) {
                YearMonth ym = YearMonth.from(r.getDataEvento());
                t.procuraMes.merge(ym, 1L, Long::sum);
                t.procuraDia.merge(r.getDataEvento().getDayOfWeek(), 1L, Long::sum);
            }

            // CANCELADA e REJEITADA não entram no faturamento
            if (!aprovada) continue;

            t.aprovadas.add(r);
            BigDecimal valor = valorDe(r);
            t.bruto = t.bruto.add(valor);
            YearMonth ym = YearMonth.from(r.getDataEvento());
            t.fatPorMes.merge(ym, valor, BigDecimal::add);
            t.ranking.computeIfAbsent(r.getEspaco().getId(), id -> new Acumulo(
                    id,
                    r.getEspaco().getTitulo()
            )).somar(valor);
        }
        return t;
    }

    private VariacaoItemDTO variacaoDe(BigDecimal atual, BigDecimal anterior) {
        BigDecimal base = anterior != null ? anterior : BigDecimal.ZERO;
        if (base.compareTo(BigDecimal.ZERO) == 0) {
            return VariacaoItemDTO.semBase();
        }
        BigDecimal atualSafe = atual != null ? atual : BigDecimal.ZERO;
        BigDecimal pct = atualSafe.subtract(base)
                .multiply(new BigDecimal("100"))
                .divide(base, 1, RoundingMode.HALF_UP);
        return VariacaoItemDTO.de(pct);
    }

    private VariacaoItemDTO variacaoDeQuantidade(long atual, long anterior) {
        if (anterior == 0L) {
            return VariacaoItemDTO.semBase();
        }
        BigDecimal pct = BigDecimal.valueOf(atual - anterior)
                .multiply(new BigDecimal("100"))
                .divide(BigDecimal.valueOf(anterior), 1, RoundingMode.HALF_UP);
        return VariacaoItemDTO.de(pct);
    }

    private LinhaReservaDTO mapLinha(Reserva r) {
        BigDecimal bruto = valorDe(r);
        boolean liberado = r.isPagamentoLiberado();
        return new LinhaReservaDTO(
                r.getId(),
                r.getDataEvento(),
                r.getEspaco() != null ? r.getEspaco().getId() : null,
                r.getEspaco() != null ? r.getEspaco().getTitulo() : "Espaço",
                r.getLocatario() != null ? primeiroNome(r.getLocatario().getNome()) : "Locatário",
                bruto,
                comissaoPlataforma.taxa(bruto),
                comissaoPlataforma.liquido(bruto),
                liberado,
                liberado ? "Pagamento liberado" : "A receber"
        );
    }

    private BigDecimal somarAReceber(List<Reserva> abertas) {
        BigDecimal total = BigDecimal.ZERO;
        for (Reserva r : abertas) {
            total = total.add(comissaoPlataforma.liquido(valorDe(r)));
        }
        return total;
    }

    private BigDecimal valorDe(Reserva r) {
        return r.getValorTotal() != null ? r.getValorTotal() : BigDecimal.ZERO;
    }

    private static String primeiroNome(String nome) {
        if (nome == null || nome.isBlank()) return "Locatário";
        return nome.trim().split("\\s+")[0];
    }

    private static final class Totais {
        private BigDecimal bruto = BigDecimal.ZERO;
        private final List<Reserva> aprovadas = new ArrayList<>();
        private final Map<YearMonth, BigDecimal> fatPorMes = new HashMap<>();
        private final Map<YearMonth, Long> procuraMes = new HashMap<>();
        private final Map<DayOfWeek, Long> procuraDia = new EnumMap<>(DayOfWeek.class);
        private final Map<Long, Acumulo> ranking = new HashMap<>();
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
