package com.eva.locafesta.termo;

import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Grava aceite da versão vigente para usuários de teste/demo,
 * para a demonstração não ficar bloqueada pelo gate de Termos.
 * Idempotente: só cria se ainda não existir aceite daquele termo.
 */
@Component
@Order(4)
public class AceitesDemoInicializador implements ApplicationRunner {

    /** UIDs dos usuários de teste (Locador A/B, Locatário A–E). */
    private static final List<String> FIREBASE_UIDS = List.of(
            "dZ1lkQfXTZXfiio36x1Vg2s8nGi1", // Locador A
            "mC3bJFMCbhgr0DmkrnsExgUQaFi2", // Locador B
            "V9nMU2UGaNMt0zte0jzvSngS53k2", // Locatário A
            "ytC3DfaUmgTeDLARF9FiyD55ZEY2", // Locatário B
            "demo-uid-locatario-c",
            "demo-uid-locatario-d",
            "demo-uid-locatario-e"
    );

    private final UsuarioRepository usuarioRepository;
    private final TermoUsoRepository termoUsoRepository;
    private final AceiteTermoRepository aceiteTermoRepository;
    private final PerfilLocadorRepository perfilLocadorRepository;
    private final PerfilLocatarioRepository perfilLocatarioRepository;

    public AceitesDemoInicializador(
            UsuarioRepository usuarioRepository,
            TermoUsoRepository termoUsoRepository,
            AceiteTermoRepository aceiteTermoRepository,
            PerfilLocadorRepository perfilLocadorRepository,
            PerfilLocatarioRepository perfilLocatarioRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.termoUsoRepository = termoUsoRepository;
        this.aceiteTermoRepository = aceiteTermoRepository;
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.perfilLocatarioRepository = perfilLocatarioRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        LocalDateTime agora = LocalDateTime.now();
        for (String uid : FIREBASE_UIDS) {
            usuarioRepository.findByFirebaseUid(uid).ifPresent(usuario -> gravarAceites(usuario, agora));
        }
        // Fallback por e-mail conhecido (caso o UID do Locatário B mude)
        for (String email : List.of(
                "christoferoangelo@gmail.com",
                "andreamoraes12@gmail.com",
                "angelu.angelo@gmail.com",
                "jeehbeatrizaraujo@gmail.com",
                "xongx26@gmail.com",
                "presencify@gmail.com"
        )) {
            usuarioRepository.findByEmail(email).ifPresent(u -> gravarAceites(u, agora));
        }
    }

    private void gravarAceites(Usuario usuario, LocalDateTime agora) {
        boolean locador = perfilLocadorRepository.existsByUsuarioId(usuario.getId());
        boolean locatario = perfilLocatarioRepository.existsByUsuarioId(usuario.getId());
        for (TipoTermo tipo : TermoService.tiposAplicaveis(usuario, locador, locatario)) {
            termoUsoRepository.findByTipoAndStatus(tipo, StatusTermo.PUBLICADO).ifPresent(termo -> {
                if (aceiteTermoRepository.existsByUsuarioIdAndTermoId(usuario.getId(), termo.getId())) {
                    return;
                }
                aceiteTermoRepository.save(AceiteTermo.builder()
                        .usuario(usuario)
                        .termo(termo)
                        .versao(termo.getVersao())
                        .aceitoEm(agora)
                        .build());
            });
        }
    }
}
