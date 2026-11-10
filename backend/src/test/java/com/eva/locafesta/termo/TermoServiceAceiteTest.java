package com.eva.locafesta.termo;

import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import com.eva.locafesta.usuario.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TermoServiceAceiteTest {

    @Mock TermoUsoRepository termoUsoRepository;
    @Mock AceiteTermoRepository aceiteTermoRepository;
    @Mock UsuarioService usuarioService;
    @Mock UsuarioRepository usuarioRepository;
    @Mock PerfilLocadorRepository perfilLocadorRepository;
    @Mock PerfilLocatarioRepository perfilLocatarioRepository;

    TermoService service;
    Usuario usuario;

    @BeforeEach
    void setUp() {
        service = new TermoService(
                termoUsoRepository,
                aceiteTermoRepository,
                usuarioService,
                usuarioRepository,
                perfilLocadorRepository,
                perfilLocatarioRepository
        );
        usuario = new Usuario();
        usuario.setId(10L);
        usuario.setFirebaseUid("uid-10");
        usuario.setAdmin(false);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("uid-10", null, List.of())
        );
        lenient().when(usuarioRepository.findByFirebaseUid("uid-10")).thenReturn(Optional.of(usuario));
    }

    @Test
    void tiposAplicaveisPorPerfil() {
        assertEquals(
                List.of(TipoTermo.LOCATARIO),
                TermoService.tiposAplicaveis(usuario, false, false)
        );
        assertEquals(
                List.of(TipoTermo.LOCATARIO),
                TermoService.tiposAplicaveis(usuario, false, true)
        );
        assertEquals(
                List.of(TipoTermo.LOCADOR),
                TermoService.tiposAplicaveis(usuario, true, false)
        );
        assertEquals(
                List.of(TipoTermo.LOCADOR, TipoTermo.LOCATARIO),
                TermoService.tiposAplicaveis(usuario, true, true)
        );
    }

    @Test
    void semAceiteFicaPendente() {
        when(perfilLocadorRepository.existsByUsuarioId(10L)).thenReturn(false);
        when(perfilLocatarioRepository.existsByUsuarioId(10L)).thenReturn(false);

        TermoUso vigente = TermoUso.builder()
                .id(1L)
                .tipo(TipoTermo.LOCATARIO)
                .versao(1)
                .titulo("T")
                .conteudo("conteudo longo o bastante para validacao")
                .status(StatusTermo.PUBLICADO)
                .publicadoEm(LocalDateTime.now())
                .criadoEm(LocalDateTime.now())
                .build();
        when(termoUsoRepository.findByTipoAndStatus(TipoTermo.LOCATARIO, StatusTermo.PUBLICADO))
                .thenReturn(Optional.of(vigente));
        when(aceiteTermoRepository.existsByUsuarioIdAndTermoId(10L, 1L)).thenReturn(false);

        List<TermoDTO> pendentes = service.listarPendentesPara(usuario);
        assertEquals(1, pendentes.size());
        assertEquals(1, pendentes.get(0).versao());
    }

    @Test
    void versaoAntigaExigeNovoAceite() {
        when(perfilLocadorRepository.existsByUsuarioId(10L)).thenReturn(false);
        when(perfilLocatarioRepository.existsByUsuarioId(10L)).thenReturn(true);

        TermoUso v2 = TermoUso.builder()
                .id(5L)
                .tipo(TipoTermo.LOCATARIO)
                .versao(2)
                .titulo("T2")
                .conteudo("nova versao publicada com texto suficiente")
                .status(StatusTermo.PUBLICADO)
                .publicadoEm(LocalDateTime.now())
                .criadoEm(LocalDateTime.now())
                .build();
        when(termoUsoRepository.findByTipoAndStatus(TipoTermo.LOCATARIO, StatusTermo.PUBLICADO))
                .thenReturn(Optional.of(v2));
        // Aceitou a v1 (id 4), não a v2 (id 5)
        when(aceiteTermoRepository.existsByUsuarioIdAndTermoId(10L, 5L)).thenReturn(false);

        TermoPendenteDTO pendente = service.pendente();
        assertTrue(pendente.precisaAceitar());
        assertEquals(2, pendente.termosPendentes().get(0).versao());
    }

    @Test
    void aceiteGravaUsuarioTermoVersaoEData() {
        TermoUso vigente = TermoUso.builder()
                .id(7L)
                .tipo(TipoTermo.LOCATARIO)
                .versao(1)
                .titulo("T")
                .conteudo("texto longo o bastante para o aceite ser valido aqui")
                .status(StatusTermo.PUBLICADO)
                .publicadoEm(LocalDateTime.now())
                .criadoEm(LocalDateTime.now())
                .build();

        when(termoUsoRepository.findById(7L)).thenReturn(Optional.of(vigente));
        when(aceiteTermoRepository.findByUsuarioIdAndTermoId(10L, 7L)).thenReturn(Optional.empty());
        when(aceiteTermoRepository.save(any(AceiteTermo.class))).thenAnswer(inv -> {
            AceiteTermo a = inv.getArgument(0);
            a.setId(99L);
            return a;
        });

        LocalDateTime antes = LocalDateTime.now().minusSeconds(2);
        List<AceiteDTO> gravados = service.aceitar(new AceiteRequestDTO(List.of(7L)));
        LocalDateTime depois = LocalDateTime.now().plusSeconds(2);

        assertEquals(1, gravados.size());
        AceiteDTO dto = gravados.get(0);
        assertEquals(99L, dto.id());
        assertEquals(10L, dto.usuarioId());
        assertEquals(7L, dto.termoId());
        assertEquals(1, dto.versao());
        assertNotNull(dto.aceitoEm());
        assertFalse(dto.aceitoEm().isBefore(antes));
        assertFalse(dto.aceitoEm().isAfter(depois));

        ArgumentCaptor<AceiteTermo> captor = ArgumentCaptor.forClass(AceiteTermo.class);
        verify(aceiteTermoRepository).save(captor.capture());
        assertEquals(1, captor.getValue().getVersao());
        assertEquals(usuario.getId(), captor.getValue().getUsuario().getId());
        assertEquals(7L, captor.getValue().getTermo().getId());
    }
}
