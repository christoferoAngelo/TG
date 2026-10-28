package com.eva.locafesta.core;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Garante o administrador master no MySQL.
 * Conta Firebase já existente: locafesta.suporte@gmail.com
 */
@Component
public class AdminInicializador implements ApplicationRunner {

    public static final String MASTER_EMAIL = "locafesta.suporte@gmail.com";
    private static final String MASTER_UID = "Vcn5kwl0vCZVI2Fcu2itwo73eOv2";
    private static final String MASTER_NOME = "Suporte Locafesta";

    private final UsuarioRepository usuarioRepository;

    public AdminInicializador(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(MASTER_UID)
                .or(() -> usuarioRepository.findByEmail(MASTER_EMAIL))
                .orElseGet(Usuario::new);

        usuario.setFirebaseUid(MASTER_UID);
        usuario.setNome(MASTER_NOME);
        usuario.setEmail(MASTER_EMAIL);
        usuario.setAdmin(true);
        if (usuario.getStatusConta() == null || usuario.getStatusConta().isBlank()) {
            usuario.setStatusConta("ATIVO");
        }
        if (usuario.getDataAtivo() == null) {
            usuario.setDataAtivo(LocalDateTime.now());
        }
        usuarioRepository.save(usuario);
    }
}
