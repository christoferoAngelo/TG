package com.eva.locafesta.relatorioLocador;

import com.eva.locafesta.reserva.Reserva;
import com.eva.locafesta.reserva.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class RelatorioService {

    private static final DateTimeFormatter MES =
            DateTimeFormatter.ofPattern("MMMM yyyy", Locale.forLanguageTag("pt-BR"));

    private final ReservaRepository reservaRepository;

    public RelatorioService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    @Transactional(readOnly = true)
    public RelatorioDTO gerar(Long usuarioId) {
        List<Reserva> reservas = reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(usuarioId);

        BigDecimal faturamento = BigDecimal.ZERO;
        long confirmadas = 0;
        Map<Long, AcumuloEspaco> porEspaco = new LinkedHashMap<>();
        Map<YearMonth, Long> porMes = new LinkedHashMap<>();

        for (Reserva reserva : reservas) {
            if (reserva.getEspaco() == null || reserva.getDataEvento() == null) continue;
            boolean confirmada = "APROVADA".equals(reserva.getStatus());
            boolean procura = confirmada || "PENDENTE".equals(reserva.getStatus());
            if (!procura && !confirmada) continue;

            if (procura) {
                YearMonth mes = YearMonth.from(reserva.getDataEvento());
                porMes.merge(mes, 1L, Long::sum);
            }
            if (!confirmada) continue;

            confirmadas++;
            BigDecimal valor = reserva.getValorTotal() != null ? reserva.getValorTotal() : BigDecimal.ZERO;
            faturamento = faturamento.add(valor);

            porEspaco.computeIfAbsent(reserva.getEspaco().getId(), id -> new AcumuloEspaco(
                    id,
                    reserva.getEspaco().getTitulo()
            )).somar(valor);
        }

        List<RelatorioDTO.EspacoRelatorio> espacos = new ArrayList<>();
        porEspaco.values().stream()
                .sorted(Comparator.comparingLong(AcumuloEspaco::reservas).reversed())
                .forEach(item -> espacos.add(item.paraDto()));

        List<RelatorioDTO.PeriodoRelatorio> periodos = porMes.entrySet().stream()
                .sorted(Map.Entry.<YearMonth, Long>comparingByValue().reversed())
                .map(entrada -> new RelatorioDTO.PeriodoRelatorio(
                        entrada.getKey().format(MES),
                        entrada.getValue()
                ))
                .toList();

        return new RelatorioDTO(faturamento, confirmadas, espacos, periodos);
    }

    private static final class AcumuloEspaco {
        private final Long id;
        private final String titulo;
        private long reservas;
        private BigDecimal faturamento = BigDecimal.ZERO;

        private AcumuloEspaco(Long id, String titulo) {
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

        private RelatorioDTO.EspacoRelatorio paraDto() {
            return new RelatorioDTO.EspacoRelatorio(id, titulo, reservas, faturamento);
        }
    }
}
