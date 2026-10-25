package com.eva.locafesta.core;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Garante o administrador inicial no Firebase e no MySQL.
 * Login: admin@admin.com / senha123
 */
@Component
public class AdminInicializador implements ApplicationRunner {

    private static final String EMAIL = "admin@admin.com";
    private static final String SENHA = "senha123";
    private static final String NOME = "Admin";

    private final UsuarioRepository usuarioRepository;

    public AdminInicializador(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        String uid = garantirUsuarioFirebase();
        garantirUsuarioLocal(uid);
    }

    private String garantirUsuarioFirebase() throws FirebaseAuthException {
        FirebaseAuth auth = FirebaseAuth.getInstance();
        try {
            UserRecord existente = auth.getUserByEmail(EMAIL);
            auth.updateUser(new UserRecord.UpdateRequest(existente.getUid())
                    .setPassword(SENHA)
                    .setEmailVerified(true)
                    .setDisplayName(NOME));
            return existente.getUid();
        } catch (FirebaseAuthException erro) {
            if (erro.getAuthErrorCode() != AuthErrorCode.USER_NOT_FOUND) {
                throw erro;
            }
        }

        UserRecord criado = auth.createUser(new UserRecord.CreateRequest()
                .setEmail(EMAIL)
                .setPassword(SENHA)
                .setDisplayName(NOME)
                .setEmailVerified(true));
        return criado.getUid();
    }

    private void garantirUsuarioLocal(String uid) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(uid)
                .or(() -> usuarioRepository.findByEmail(EMAIL))
                .orElseGet(Usuario::new);

        usuario.setFirebaseUid(uid);
        usuario.setNome(NOME);
        usuario.setEmail(EMAIL);
        usuario.setAdmin(true);
        if (usuario.getStatusConta() == null || usuario.getStatusConta().isBlank()) {
            usuario.setStatusConta("ATIVO");
        }
        usuarioRepository.save(usuario);
    }
}
