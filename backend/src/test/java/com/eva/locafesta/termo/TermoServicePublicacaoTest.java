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
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Garante a regra "um PUBLICADO por tipo" em publicações sequenciais
 * (MariaDB sem índice parcial — regra no serviço/transação).
 */
@ExtendWith(MockitoExtension.class)
class TermoServicePublicacaoTest {

    @Mock TermoUsoRepository termoUsoRepository;
    @Mock AceiteTermoRepository aceiteTermoRepository;
    @Mock UsuarioService usuarioService;
    @Mock UsuarioRepository usuarioRepository;
    @Mock PerfilLocadorRepository perfilLocadorRepository;
    @Mock PerfilLocatarioRepository perfilLocatarioRepository;

    TermoService service;
    Usuario admin;

    final AtomicReference<TermoUso> publicado = new AtomicReference<>();
    final AtomicLong nextId = new AtomicLong(10);

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
        admin = new Usuario();
        admin.setId(1L);
        admin.setAdmin(true);
        admin.setNome("Admin");
        lenient().when(usuarioService.obterAdminLogado()).thenReturn(admin);

        lenient().when(termoUsoRepository.save(any(TermoUso.class))).thenAnswer(inv -> {
            TermoUso t = inv.getArgument(0);
            if (t.getId() == null) {
                t.setId(nextId.getAndIncrement());
            }
            if (t.getStatus() == StatusTermo.PUBLICADO) {
                publicado.set(t);
            }
            return t;
        });

        lenient().when(termoUsoRepository.findByTipoAndStatusForUpdate(eq(TipoTermo.LOCATARIO), eq(StatusTermo.PUBLICADO)))
                .thenAnswer(inv -> Optional.ofNullable(publicado.get())
                        .filter(t -> t.getStatus() == StatusTermo.PUBLICADO));

        lenient().when(termoUsoRepository.countByTipoAndStatus(eq(TipoTermo.LOCATARIO), eq(StatusTermo.PUBLICADO)))
                .thenAnswer(inv -> {
                    TermoUso p = publicado.get();
                    return (p != null && p.getStatus() == StatusTermo.PUBLICADO) ? 1L : 0L;
                });
    }

    @Test
    void duasPublicacoesEmSequenciaMantemUmPublicado() {
        TermoUso v1 = rascunho(2L, 2, "Versão 2 longa o bastante para passar na validação de conteúdo mínimo.");
        TermoUso v2 = rascunho(3L, 3, "Versão 3 também com texto suficientemente longo para publicação válida.");

        when(termoUsoRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(v1));
        TermoDTO pub1 = service.publicar(2L);
        assertEquals(StatusTermo.PUBLICADO.name(), pub1.status());
        assertEquals(2, pub1.versao());
        assertEquals(StatusTermo.PUBLICADO, v1.getStatus());
        assertNotNull(v1.getPublicadoEm());

        when(termoUsoRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(v2));
        TermoDTO pub2 = service.publicar(3L);
        assertEquals(StatusTermo.PUBLICADO.name(), pub2.status());
        assertEquals(3, pub2.versao());
        assertEquals(StatusTermo.ARQUIVADO, v1.getStatus());
        assertEquals(StatusTermo.PUBLICADO, v2.getStatus());

        ArgumentCaptor<TermoUso> captor = ArgumentCaptor.forClass(TermoUso.class);
        verify(termoUsoRepository, atLeast(2)).save(captor.capture());
        long publicadosSalvos = captor.getAllValues().stream()
                .filter(t -> t.getStatus() == StatusTermo.PUBLICADO)
                .map(TermoUso::getId)
                .distinct()
                .count();
        // Após a 2ª publicação, só o id 3 permanece PUBLICADO no estado final
        assertEquals(StatusTermo.PUBLICADO, publicado.get().getStatus());
        assertEquals(3L, publicado.get().getId());
        assertTrue(publicadosSalvos >= 1);
    }

    @Test
    void naoPublicaConteudoCurto() {
        TermoUso curto = rascunho(5L, 5, "curto");
        when(termoUsoRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(curto));
        assertThrows(ResponseStatusException.class, () -> service.publicar(5L));
        assertEquals(StatusTermo.RASCUNHO, curto.getStatus());
    }

    @Test
    void naoEditaPublicado() {
        TermoUso pub = TermoUso.builder()
                .id(7L)
                .tipo(TipoTermo.LOCATARIO)
                .versao(1)
                .titulo("T")
                .conteudo(TermosTextoSeed.CONTEUDO)
                .status(StatusTermo.PUBLICADO)
                .criadoEm(LocalDateTime.now())
                .publicadoEm(LocalDateTime.now())
                .build();
        when(termoUsoRepository.findById(7L)).thenReturn(Optional.of(pub));
        assertThrows(ResponseStatusException.class,
                () -> service.atualizarRascunho(7L, new TermoUpdateDTO("x", "y")));
    }

    private static TermoUso rascunho(Long id, int versao, String conteudo) {
        return TermoUso.builder()
                .id(id)
                .tipo(TipoTermo.LOCATARIO)
                .versao(versao)
                .titulo("Termos v" + versao)
                .conteudo(conteudo)
                .status(StatusTermo.RASCUNHO)
                .criadoEm(LocalDateTime.now())
                .build();
    }
}
