package com.eva.locafesta.locador.financeiro;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.ComissaoPlataforma;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locador.financeiro.LocadorFinanceiroDTO.VariacaoItemDTO;
import com.eva.locafesta.reserva.Reserva;
import com.eva.locafesta.reserva.ReservaRepository;
import com.eva.locafesta.usuario.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocadorFinanceiroServiceTest {

    @Mock PerfilLocadorRepository perfilLocadorRepository;
    @Mock EspacoRepository espacoRepository;
    @Mock ReservaRepository reservaRepository;

    LocadorFinanceiroService service;
    ComissaoPlataforma comissao;

    Usuario dono;
    PerfilLocador perfil;
    Espaco espaco;

    @BeforeEach
    void setUp() {
        comissao = new ComissaoPlataforma(new BigDecimal("10"));
        service = new LocadorFinanceiroService(
                perfilLocadorRepository,
                espacoRepository,
                reservaRepository,
                comissao
        );
        dono = new Usuario();
        dono.setId(10L);
        perfil = new PerfilLocador();
        perfil.setId(5L);
        perfil.setUsuario(dono);
        espaco = Espaco.builder().id(7L).titulo("Local A").locador(perfil).build();
    }

    @Test
    void filtraPorPeriodoECalculaComissaoEAreceberLiquido() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));

        Reserva dentro = Reserva.builder()
                .id(1L)
                .espaco(espaco)
                .dataEvento(LocalDate.of(2026, 11, 10))
                .valorTotal(new BigDecimal("1000.00"))
                .status("APROVADA")
                .pagamentoLiberado(false)
                .build();

        LocalDate de = LocalDate.of(2026, 11, 1);
        LocalDate ate = LocalDate.of(2026, 11, 30);
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(de), eq(ate), isNull()))
                .thenReturn(List.of(dentro));
        // período anterior (outubro, mesma duração)
        when(reservaRepository.findByLocadorPeriodoEEspaco(
                eq(10L), eq(LocalDate.of(2026, 10, 2)), eq(LocalDate.of(2026, 10, 31)), isNull()
        )).thenReturn(List.of());
        when(reservaRepository.findAReceberPorLocadorEEspaco(eq(10L), isNull()))
                .thenReturn(List.of(dentro));

        LocadorFinanceiroDTO dto = service.resumo(10L, de, ate, null, 0, 10);

        assertEquals(new BigDecimal("1000.00"), dto.kpis().faturamentoBruto());
        assertEquals(new BigDecimal("100.00"), dto.kpis().comissaoPlataforma());
        assertEquals(new BigDecimal("900.00"), dto.kpis().valorLiquidoEstimado());
        assertEquals(new BigDecimal("900.00"), dto.kpis().aReceber());
        assertEquals(1, dto.kpis().quantidadeReservas());
        assertEquals(0, new BigDecimal("10").compareTo(dto.percentualComissao()));
        assertEquals("A receber", dto.reservas().get(0).situacaoPagamento());
        assertFalse(dto.variacao().faturamentoBruto().disponivel());
        assertEquals("sem base de comparação", dto.variacao().faturamentoBruto().mensagem());
    }

    @Test
    void aReceberIncluiFuturoAlemDoFimDoPeriodo() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));

        Reserva noPeriodo = Reserva.builder()
                .id(1L).espaco(espaco).dataEvento(LocalDate.of(2026, 10, 10))
                .valorTotal(new BigDecimal("1000.00")).status("APROVADA").pagamentoLiberado(true).build();
        Reserva futuroAberto = Reserva.builder()
                .id(2L).espaco(espaco).dataEvento(LocalDate.of(2026, 11, 20))
                .valorTotal(new BigDecimal("1300.00")).status("APROVADA").pagamentoLiberado(false).build();

        LocalDate de = LocalDate.of(2026, 6, 1);
        LocalDate ate = LocalDate.of(2026, 10, 31); // futuro fica fora do faturamento
        long dias = java.time.temporal.ChronoUnit.DAYS.between(de, ate) + 1;
        LocalDate prevAte = de.minusDays(1);
        LocalDate prevDe = prevAte.minusDays(dias - 1);
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(de), eq(ate), isNull()))
                .thenReturn(List.of(noPeriodo));
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(prevDe), eq(prevAte), isNull()))
                .thenReturn(List.of());
        when(reservaRepository.findAReceberPorLocadorEEspaco(eq(10L), isNull()))
                .thenReturn(List.of(futuroAberto));

        LocadorFinanceiroDTO dto = service.resumo(10L, de, ate, null, 0, 10);

        assertEquals(new BigDecimal("1000.00"), dto.kpis().faturamentoBruto());
        // 1300 × 10% = 130; líquido = 1170
        assertEquals(new BigDecimal("1170.00"), dto.kpis().aReceber());
    }

    @Test
    void canceladaERejeitadaNaoEntramNoFaturamento() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));

        Reserva aprovada = Reserva.builder()
                .id(1L).espaco(espaco).dataEvento(LocalDate.of(2026, 11, 10))
                .valorTotal(new BigDecimal("500.00")).status("APROVADA").pagamentoLiberado(true).build();
        Reserva cancelada = Reserva.builder()
                .id(2L).espaco(espaco).dataEvento(LocalDate.of(2026, 11, 12))
                .valorTotal(new BigDecimal("800.00")).status("CANCELADA").pagamentoLiberado(false).build();
        Reserva rejeitada = Reserva.builder()
                .id(3L).espaco(espaco).dataEvento(LocalDate.of(2026, 11, 15))
                .valorTotal(new BigDecimal("700.00")).status("REJEITADA").pagamentoLiberado(false).build();

        LocalDate de = LocalDate.of(2026, 11, 1);
        LocalDate ate = LocalDate.of(2026, 11, 30);
        LocalDate prevDe = LocalDate.of(2026, 10, 2);
        LocalDate prevAte = LocalDate.of(2026, 10, 31);
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(de), eq(ate), isNull()))
                .thenReturn(List.of(aprovada, cancelada, rejeitada));
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(prevDe), eq(prevAte), isNull()))
                .thenReturn(List.of());
        when(reservaRepository.findAReceberPorLocadorEEspaco(eq(10L), isNull()))
                .thenReturn(List.of());

        LocadorFinanceiroDTO dto = service.resumo(10L, de, ate, null, 0, 10);

        assertEquals(new BigDecimal("500.00"), dto.kpis().faturamentoBruto());
        assertEquals(1, dto.kpis().quantidadeReservas());
        assertEquals(0, BigDecimal.ZERO.compareTo(dto.kpis().aReceber()));
    }

    @Test
    void filtroPorEspaco() {
        Espaco outro = Espaco.builder().id(8L).titulo("Local B").locador(perfil).build();
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco, outro));

        Reserva doA = Reserva.builder()
                .id(1L).espaco(espaco).dataEvento(LocalDate.of(2026, 11, 10))
                .valorTotal(new BigDecimal("333.33")).status("APROVADA").pagamentoLiberado(false).build();

        LocalDate de = LocalDate.of(2026, 11, 1);
        LocalDate ate = LocalDate.of(2026, 11, 30);
        LocalDate prevDe = LocalDate.of(2026, 10, 2);
        LocalDate prevAte = LocalDate.of(2026, 10, 31);
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(de), eq(ate), eq(7L)))
                .thenReturn(List.of(doA));
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(prevDe), eq(prevAte), eq(7L)))
                .thenReturn(List.of());
        when(reservaRepository.findAReceberPorLocadorEEspaco(eq(10L), eq(7L)))
                .thenReturn(List.of(doA));

        LocadorFinanceiroDTO dto = service.resumo(10L, de, ate, 7L, 0, 10);

        assertEquals(new BigDecimal("333.33"), dto.kpis().faturamentoBruto());
        assertEquals(new BigDecimal("33.33"), dto.kpis().comissaoPlataforma());
        assertEquals(new BigDecimal("300.00"), dto.kpis().valorLiquidoEstimado());
        assertEquals(new BigDecimal("300.00"), dto.kpis().aReceber());
    }

    @Test
    void variacaoComBaseCalculaPercentual() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));

        Reserva atual = Reserva.builder()
                .id(1L).espaco(espaco).dataEvento(LocalDate.of(2026, 11, 10))
                .valorTotal(new BigDecimal("2000.00")).status("APROVADA").pagamentoLiberado(true).build();
        Reserva anterior = Reserva.builder()
                .id(2L).espaco(espaco).dataEvento(LocalDate.of(2026, 10, 10))
                .valorTotal(new BigDecimal("1000.00")).status("APROVADA").pagamentoLiberado(true).build();

        LocalDate de = LocalDate.of(2026, 11, 1);
        LocalDate ate = LocalDate.of(2026, 11, 30);
        LocalDate prevDe = LocalDate.of(2026, 10, 2);
        LocalDate prevAte = LocalDate.of(2026, 10, 31);

        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(de), eq(ate), isNull()))
                .thenReturn(List.of(atual));
        when(reservaRepository.findByLocadorPeriodoEEspaco(eq(10L), eq(prevDe), eq(prevAte), isNull()))
                .thenReturn(List.of(anterior));
        when(reservaRepository.findAReceberPorLocadorEEspaco(eq(10L), isNull()))
                .thenReturn(List.of());

        LocadorFinanceiroDTO dto = service.resumo(10L, de, ate, null, 0, 10);
        VariacaoItemDTO var = dto.variacao().faturamentoBruto();
        assertTrue(var.disponivel());
        assertEquals(new BigDecimal("100.0"), var.percentual());
    }

    @Test
    void estadoVazio() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));
        when(reservaRepository.findByLocadorPeriodoEEspaco(any(), any(), any(), any()))
                .thenReturn(List.of());
        when(reservaRepository.findAReceberPorLocadorEEspaco(any(), any()))
                .thenReturn(List.of());

        LocadorFinanceiroDTO dto = service.resumo(
                10L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), null, 0, 10
        );

        assertEquals(0, dto.kpis().quantidadeReservas());
        assertEquals(0, new BigDecimal("0").compareTo(dto.kpis().faturamentoBruto()));
        assertTrue(dto.reservas().isEmpty());
        assertFalse(dto.variacao().faturamentoBruto().disponivel());
    }

    @Test
    void rejeitaEspacoDeOutroLocador() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.resumo(10L, null, null, 999L, 0, 10)
        );
        assertEquals(403, ex.getStatusCode().value());
    }
}
