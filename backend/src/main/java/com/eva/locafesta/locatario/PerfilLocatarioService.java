package com.eva.locafesta.locatario;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerfilLocatarioService {

    @Autowired
    private PerfilLocatarioRepository locatarioRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public PerfilLocatario criarPerfil(Long usuarioId, String cpf) {
        if (locatarioRepository.existsByCpf(cpf)) {
            throw new RuntimeException("Este CPF já está cadastrado em outro perfil.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (locatarioRepository.findByUsuarioId(usuarioId).isPresent()) {
            throw new RuntimeException("Este usuário já possui um perfil de locatário.");
        }

        PerfilLocatario perfil = new PerfilLocatario(cpf, usuario);
        return locatarioRepository.save(perfil);
    }
}