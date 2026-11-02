package com.eva.locafesta.reserva;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReservaControllerPrevisaoCancelamentoTest {

    @Mock
    private ReservaService reservaService;

    @InjectMocks
    private ReservaController reservaController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reservaController).build();
    }

    @Test
    void donoRecebePrevisao() throws Exception {
        when(reservaService.preverCancelamentoLocatario(5L, 20L))
                .thenReturn(new PrevisaoCancelamentoDTO(
                        PoliticaReembolso.PARCIAL,
                        PoliticaReembolso.mensagem(PoliticaReembolso.PARCIAL),
                        10
                ));

        mockMvc.perform(get("/api/reservas/5/previsao-cancelamento")
                        .header("Usuario-Id", "20")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condicao").value("PARCIAL"))
                .andExpect(jsonPath("$.mensagem").value("Será feito reembolso parcial de 50%."))
                .andExpect(jsonPath("$.diasRestantes").value(10));
    }

    @Test
    void outroUsuarioRecebe403() throws Exception {
        when(reservaService.preverCancelamentoLocatario(5L, 99L))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Você não pode consultar o cancelamento desta reserva."
                ));

        mockMvc.perform(get("/api/reservas/5/previsao-cancelamento")
                        .header("Usuario-Id", "99")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
