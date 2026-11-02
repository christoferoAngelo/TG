package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.notificacao.NotificacaoService;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservaServiceAutoReservaTest {

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
    void donoNaoPodeReservarProprioEspaco() {
        Usuario dono = usuario(10L, "Locador A");
        Espaco espaco = espacoDoDono(dono, 1L);

        when(espacoRepository.buscarParaReserva(1L)).thenReturn(Optional.of(espaco));
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(dono));

        ReservaDTO dto = new ReservaDTO(
                1L,
                LocalDate.now().plusDays(7),
                AgendaEspaco.Modalidade.INTEGRAL,
                null,
                null,
                null,
                null,
                new BigDecimal("100.00")
        );

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> reservaService.criarReserva(dto, 10L)
        );

        assertEquals(HttpStatus.FORBIDDEN, erro.getStatusCode());
        assertTrue(erro.getReason() != null && erro.getReason().contains("próprio espaço"));
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void outroUsuarioPodeReservarEspacoAlheio() {
        Usuario dono = usuario(10L, "Locador A");
        Usuario locatario = usuario(20L, "Locatario A");
        Espaco espaco = espacoDoDono(dono, 1L);

        when(espacoRepository.buscarParaReserva(1L)).thenReturn(Optional.of(espaco));
        when(usuarioRepository.findById(20L)).thenReturn(Optional.of(locatario));
        when(reservaRepository.findByEspacoIdAndDataEventoAndStatusIn(any(), any(), any()))
                .thenReturn(java.util.List.of());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> {
            Reserva reserva = inv.getArgument(0);
            reserva.setId(99L);
            return reserva;
        });

        ReservaDTO dto = new ReservaDTO(
                1L,
                LocalDate.now().plusDays(7),
                AgendaEspaco.Modalidade.INTEGRAL,
                null,
                null,
                null,
                null,
                new BigDecimal("100.00")
        );

        ReservaResponseDTO resposta = reservaService.criarReserva(dto, 20L);

        assertEquals(99L, resposta.id());
        verify(reservaRepository).save(any(Reserva.class));
    }

    @Test
    void locadorDeOutroEspacoPodeReservarEspacoAlheio() {
        Usuario dono = usuario(10L, "Locador A");
        Usuario outroLocador = usuario(30L, "Locador B");
        Espaco espaco = espacoDoDono(dono, 2L);

        when(espacoRepository.buscarParaReserva(2L)).thenReturn(Optional.of(espaco));
        when(usuarioRepository.findById(30L)).thenReturn(Optional.of(outroLocador));
        when(reservaRepository.findByEspacoIdAndDataEventoAndStatusIn(any(), any(), any()))
                .thenReturn(java.util.List.of());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> {
            Reserva reserva = inv.getArgument(0);
            reserva.setId(77L);
            return reserva;
        });

        ReservaDTO dto = new ReservaDTO(
                2L,
                LocalDate.now().plusDays(10),
                AgendaEspaco.Modalidade.INTEGRAL,
                null,
                null,
                null,
                null,
                new BigDecimal("200.00")
        );

        ReservaResponseDTO resposta = reservaService.criarReserva(dto, 30L);
        assertEquals(77L, resposta.id());
        verify(reservaRepository).save(any(Reserva.class));
    }

    private static Usuario usuario(Long id, String nome) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome(nome);
        usuario.setEmail(nome.toLowerCase().replace(" ", "") + "@teste.com");
        usuario.setFirebaseUid("uid-" + id);
        return usuario;
    }

    private static Espaco espacoDoDono(Usuario dono, Long espacoId) {
        PerfilLocador perfil = PerfilLocador.builder()
                .id(100L + espacoId)
                .documento("12345678000199")
                .nomeFantasia("Local")
                .usuario(dono)
                .build();

        return Espaco.builder()
                .id(espacoId)
                .locador(perfil)
                .titulo("Espaço " + espacoId)
                .descricao("Descrição")
                .valorDiaria(new BigDecimal("100.00"))
                .capacidadePessoas(50)
                .horarioAbertura(LocalTime.of(8, 0))
                .horarioFechamento(LocalTime.of(22, 0))
                .permitePeriodoIntegral(true)
                .permiteMeioPeriodo(false)
                .permiteHorarioPersonalizado(false)
                .aprovacaoInstantanea(false)
                .antecedenciaMinimaDias(0)
                .intervaloLimpezaMin(0)
                .statusAprovacao("APROVADO")
                .ativo(true)
                .build();
    }
}
