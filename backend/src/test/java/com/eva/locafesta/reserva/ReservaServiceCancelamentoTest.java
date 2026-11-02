package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.notificacao.NotificacaoService;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservaServiceCancelamentoTest {

    @Mock
    private ReservaRepository reservaRepository;
    @Mock
    private EspacoRepository espacoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private NotificacaoService notificacaoService;

    private ReservaService reservaService;

    @BeforeEach
    void setUp() {
        reservaService = new ReservaService(
                reservaRepository,
                espacoRepository,
                usuarioRepository,
                notificacaoService
        );
    }

    @Test
    void bloqueiaCancelamentoAposInicioDoEvento() {
        Usuario locatario = usuario(20L);
        Reserva reserva = reservaAprovada(1L, locatario, LocalDate.now(PoliticaReembolso.FUSO_BRASIL).minusDays(1));

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(reserva));

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> reservaService.cancelarReserva(1L, 20L)
        );
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        assertTrue(erro.getReason().contains("já começou"));
    }

    @Test
    void cancelaPendenteComoSemCobranca() {
        Usuario locatario = usuario(20L);
        Reserva reserva = reservaPendente(2L, locatario, LocalDate.now(PoliticaReembolso.FUSO_BRASIL).plusDays(20));

        when(reservaRepository.findById(2L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponseDTO resposta = reservaService.cancelarReserva(2L, 20L);
        assertEquals("CANCELADA", resposta.status());
        assertEquals(PoliticaReembolso.SEM_COBRANCA, resposta.condicaoReembolso());
    }

    @Test
    void cancelaAprovadaComRegraDeDias() {
        Usuario locatario = usuario(20L);
        LocalDate evento = LocalDate.now(PoliticaReembolso.FUSO_BRASIL).plusDays(10);
        Reserva reserva = reservaAprovada(3L, locatario, evento);

        when(reservaRepository.findById(3L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaResponseDTO resposta = reservaService.cancelarReserva(3L, 20L);
        assertEquals(PoliticaReembolso.PARCIAL, resposta.condicaoReembolso());

        ArgumentCaptor<String> mensagem = ArgumentCaptor.forClass(String.class);
        verify(notificacaoService).avisar(anyLong(), anyLong(), anyString(), mensagem.capture());
        assertTrue(mensagem.getValue().contains("reembolso parcial de 50%"));
    }

    private static Usuario usuario(Long id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNome("User " + id);
        u.setEmail("user" + id + "@teste.com");
        u.setFirebaseUid("uid-" + id);
        return u;
    }

    private static Reserva reservaAprovada(Long id, Usuario locatario, LocalDate dataEvento) {
        return reservaBase(id, locatario, dataEvento, "APROVADA");
    }

    private static Reserva reservaPendente(Long id, Usuario locatario, LocalDate dataEvento) {
        return reservaBase(id, locatario, dataEvento, "PENDENTE");
    }

    private static Reserva reservaBase(Long id, Usuario locatario, LocalDate dataEvento, String status) {
        Espaco espaco = Espaco.builder()
                .id(50L)
                .titulo("Espaço teste")
                .descricao("desc")
                .valorDiaria(new BigDecimal("100"))
                .capacidadePessoas(10)
                .horarioAbertura(LocalTime.of(8, 0))
                .horarioFechamento(LocalTime.of(22, 0))
                .statusAprovacao("APROVADO")
                .ativo(true)
                .build();

        return Reserva.builder()
                .id(id)
                .espaco(espaco)
                .locatario(locatario)
                .dataEvento(dataEvento)
                .horaInicio(LocalTime.of(10, 0))
                .horaFim(LocalTime.of(18, 0))
                .valorTotal(new BigDecimal("100"))
                .status(status)
                .pagamentoLiberado(false)
                .build();
    }
}
