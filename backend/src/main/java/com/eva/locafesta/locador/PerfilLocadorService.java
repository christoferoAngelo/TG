package com.eva.locafesta.locador;

import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerfilLocadorService {

    @Autowired
    private PerfilLocadorRepository locadorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public PerfilLocador criarPerfil(Long usuarioId, String documento, String nomeFantasia) {
        if (locadorRepository.existsByDocumento(documento)) {
            throw new RuntimeException("Este CPF/CNPJ já está cadastrado como locador.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        if (locadorRepository.findByUsuarioId(usuarioId).isPresent()) {
            throw new RuntimeException("Este usuário já possui um perfil de locador.");
        }

        PerfilLocador perfil = new PerfilLocador(documento, nomeFantasia, usuario);
        return locadorRepository.save(perfil);
    }
}