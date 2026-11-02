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
import com.eva.locafesta.reserva.PoliticaReembolso;
import com.eva.locafesta.reserva.Reserva;
import com.eva.locafesta.reserva.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class LocadorFinanceiroService {

    private static final DateTimeFormatter MES_ROTULO =
            DateTimeFormatter.ofPattern("MMM/yy", Locale.forLanguageTag("pt-BR"));

    private final PerfilLocadorRepository perfilLocadorRepository;
    private final EspacoRepository espacoRepository;
    private final ReservaRepository reservaRepository;

    public LocadorFinanceiroService(
            PerfilLocadorRepository perfilLocadorRepository,
            EspacoRepository espacoRepository,
            ReservaRepository reservaRepository
    ) {
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.espacoRepository = espacoRepository;
        this.reservaRepository = reservaRepository;
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

        List<Reserva> todas = reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(usuarioId);

        List<Reserva> noPeriodo = new ArrayList<>();
        BigDecimal bruto = BigDecimal.ZERO;
        BigDecimal aReceber = BigDecimal.ZERO;
        Map<YearMonth, BigDecimal> fatPorMes = new HashMap<>();
        Map<YearMonth, Long> procuraMes = new HashMap<>();
        Map<Long, Acumulo> ranking = new HashMap<>();

        for (Reserva r : todas) {
            if (r.getDataEvento() == null || r.getEspaco() == null) continue;
            if (espacoId != null && !Objects.equals(r.getEspaco().getId(), espacoId)) continue;

            String status = r.getStatus() != null ? r.getStatus().toUpperCase(Locale.ROOT) : "";
            boolean aprovada = "APROVADA".equals(status);
            boolean pendente = "PENDENTE".equals(status);
            boolean noIntervalo = !r.getDataEvento().isBefore(inicio) && !r.getDataEvento().isAfter(fim);

            if ((aprovada || pendente) && noIntervalo) {
                YearMonth ym = YearMonth.from(r.getDataEvento());
                procuraMes.merge(ym, 1L, Long::sum);
            }

            if (!aprovada || !noIntervalo) continue;

            noPeriodo.add(r);
            BigDecimal valor = valorDe(r);
            bruto = bruto.add(valor);
            if (!r.isPagamentoLiberado()) {
                aReceber = aReceber.add(valor);
            }
            YearMonth ym = YearMonth.from(r.getDataEvento());
            fatPorMes.merge(ym, valor, BigDecimal::add);
            ranking.computeIfAbsent(r.getEspaco().getId(), id -> new Acumulo(
                    id,
                    r.getEspaco().getTitulo()
            )).somar(valor);
        }

        BigDecimal comissao = ComissaoPlataforma.taxa(bruto);
        BigDecimal liquido = ComissaoPlataforma.liquido(bruto);

        YearMonth mesInicio = YearMonth.from(inicio);
        YearMonth mesFim = YearMonth.from(fim);
        List<PontoMensalDTO> serie = new ArrayList<>();
        for (YearMonth ym = mesInicio; !ym.isAfter(mesFim); ym = ym.plusMonths(1)) {
            BigDecimal v = fatPorMes.getOrDefault(ym, BigDecimal.ZERO);
            serie.add(new PontoMensalDTO(
                    ym.toString(),
                    ym.format(MES_ROTULO),
                    v,
                    ComissaoPlataforma.liquido(v)
            ));
        }

        List<EspacoRankingDTO> rankingDto = ranking.values().stream()
                .sorted(Comparator.comparingLong(Acumulo::reservas).reversed())
                .limit(8)
                .map(a -> new EspacoRankingDTO(a.id, a.titulo, a.reservas, a.faturamento))
                .toList();

        List<PeriodoProcuraDTO> mesesProcura = new ArrayList<>();
        for (YearMonth ym = mesInicio; !ym.isAfter(mesFim); ym = ym.plusMonths(1)) {
            mesesProcura.add(new PeriodoProcuraDTO(
                    ym.format(MES_ROTULO),
                    procuraMes.getOrDefault(ym, 0L)
            ));
        }

        noPeriodo.sort(Comparator
                .comparing(Reserva::getDataEvento)
                .reversed()
                .thenComparing(Reserva::getId, Comparator.reverseOrder()));

        long total = noPeriodo.size();
        int totalPaginas = total == 0 ? 0 : (int) Math.ceil(total / (double) size);
        int from = Math.min(page * size, (int) total);
        int to = Math.min(from + size, (int) total);
        List<LinhaReservaDTO> linhas = noPeriodo.subList(from, to).stream()
                .map(this::mapLinha)
                .toList();

        KpisDTO kpis = new KpisDTO(bruto, comissao, liquido, aReceber, total);

        return new LocadorFinanceiroDTO(
                inicio,
                fim,
                espacoId,
                ComissaoPlataforma.PERCENTUAL,
                kpis,
                serie,
                rankingDto,
                mesesProcura,
                linhas,
                page,
                size,
                total,
                totalPaginas,
                opcoes
        );
    }

    private LinhaReservaDTO mapLinha(Reserva r) {
        BigDecimal bruto = valorDe(r);
        return new LinhaReservaDTO(
                r.getId(),
                r.getDataEvento(),
                r.getEspaco() != null ? r.getEspaco().getId() : null,
                r.getEspaco() != null ? r.getEspaco().getTitulo() : "Espaço",
                r.getLocatario() != null ? primeiroNome(r.getLocatario().getNome()) : "Locatário",
                bruto,
                ComissaoPlataforma.taxa(bruto),
                ComissaoPlataforma.liquido(bruto),
                r.isPagamentoLiberado()
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
