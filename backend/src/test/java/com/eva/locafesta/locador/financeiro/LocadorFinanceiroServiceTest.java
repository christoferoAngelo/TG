package com.eva.locafesta.locador.financeiro;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocadorFinanceiroServiceTest {

    @Mock PerfilLocadorRepository perfilLocadorRepository;
    @Mock EspacoRepository espacoRepository;
    @Mock ReservaRepository reservaRepository;

    LocadorFinanceiroService service;

    Usuario dono;
    PerfilLocador perfil;
    Espaco espaco;

    @BeforeEach
    void setUp() {
        service = new LocadorFinanceiroService(perfilLocadorRepository, espacoRepository, reservaRepository);
        dono = new Usuario();
        dono.setId(10L);
        perfil = new PerfilLocador();
        perfil.setId(5L);
        perfil.setUsuario(dono);
        espaco = Espaco.builder().id(7L).titulo("Local A").locador(perfil).build();
    }

    @Test
    void filtraPorPeriodoECalculaComissao() {
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
        Reserva fora = Reserva.builder()
                .id(2L)
                .espaco(espaco)
                .dataEvento(LocalDate.of(2026, 1, 5))
                .valorTotal(new BigDecimal("500.00"))
                .status("APROVADA")
                .pagamentoLiberado(true)
                .build();
        when(reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(10L))
                .thenReturn(List.of(dentro, fora));

        LocadorFinanceiroDTO dto = service.resumo(
                10L,
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2026, 11, 30),
                null,
                0,
                10
        );

        assertEquals(new BigDecimal("1000.00"), dto.kpis().faturamentoBruto());
        assertEquals(new BigDecimal("100.00"), dto.kpis().comissaoPlataforma());
        assertEquals(new BigDecimal("900.00"), dto.kpis().valorLiquidoEstimado());
        assertEquals(new BigDecimal("1000.00"), dto.kpis().aReceber());
        assertEquals(1, dto.kpis().quantidadeReservas());
        assertEquals(1, dto.reservas().size());
    }

    @Test
    void rejeitaEspacoDeOutroLocador() {
        when(perfilLocadorRepository.findByUsuarioId(10L)).thenReturn(Optional.of(perfil));
        when(espacoRepository.findByLocadorId(5L)).thenReturn(List.of(espaco));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.resumo(10L, null, null, 999L, 0, 10)
        );
        assertTrue(ex.getStatusCode().value() == 403);
    }
}
