package com.eva.locafesta.favorito;

import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ListaFavoritoService {

    private final ListaFavoritoRepository listaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EspacoRepository espacoRepository;

    public ListaFavoritoService(
            ListaFavoritoRepository listaRepository,
            UsuarioRepository usuarioRepository,
            EspacoRepository espacoRepository) {
        this.listaRepository = listaRepository;
        this.usuarioRepository = usuarioRepository;
        this.espacoRepository = espacoRepository;
    }

    @Transactional(readOnly = true)
    public List<ListaFavoritoDTO> listar(Long usuarioId) {
        exigirUsuario(usuarioId);
        return listaRepository.findByUsuarioIdOrderByCriadaEmAsc(usuarioId).stream()
                .map(ListaFavoritoDTO::new)
                .toList();
    }

    @Transactional
    public ListaFavoritoDTO criar(Long usuarioId, String nome, Long espacoId) {
        Usuario usuario = exigirUsuario(usuarioId);
        String limpo = nomeLimpo(nome);
        if (listaRepository.existsByUsuarioIdAndNomeIgnoreCase(usuarioId, limpo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já tem uma lista com esse nome.");
        }
        if (espacoId != null) {
            exigirEspaco(espacoId);
        }

        ListaFavorito lista = new ListaFavorito();
        lista.setUsuario(usuario);
        lista.setNome(limpo);
        lista.setCriadaEm(LocalDateTime.now());
        lista.setEspacoIds(new ArrayList<>());
        if (espacoId != null) {
            lista.getEspacoIds().add(espacoId);
        }
        return new ListaFavoritoDTO(salvar(lista));
    }

    @Transactional
    public ListaFavoritoDTO renomear(Long usuarioId, Long listaId, String nome) {
        ListaFavorito lista = exigirLista(usuarioId, listaId);
        String limpo = nomeLimpo(nome);
        if (listaRepository.existsByUsuarioIdAndNomeIgnoreCaseAndIdNot(usuarioId, limpo, listaId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já tem uma lista com esse nome.");
        }
        lista.setNome(limpo);
        return new ListaFavoritoDTO(salvar(lista));
    }

    @Transactional
    public void excluir(Long usuarioId, Long listaId) {
        ListaFavorito lista = exigirLista(usuarioId, listaId);
        listaRepository.delete(lista);
    }

    @Transactional
    public ListaFavoritoDTO adicionarEspaco(Long usuarioId, Long listaId, Long espacoId) {
        ListaFavorito lista = exigirLista(usuarioId, listaId);
        exigirEspaco(espacoId);
        List<Long> ids = idsDe(lista);
        if (!ids.contains(espacoId)) {
            ids.add(0, espacoId);
        }
        return new ListaFavoritoDTO(salvar(lista));
    }

    @Transactional
    public ListaFavoritoDTO removerEspaco(Long usuarioId, Long listaId, Long espacoId) {
        ListaFavorito lista = exigirLista(usuarioId, listaId);
        idsDe(lista).remove(espacoId);
        return new ListaFavoritoDTO(salvar(lista));
    }

    private ListaFavorito salvar(ListaFavorito lista) {
        try {
            return listaRepository.saveAndFlush(lista);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já tem uma lista com esse nome.");
        }
    }

    private Usuario exigirUsuario(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private void exigirEspaco(Long espacoId) {
        if (espacoId == null || !espacoRepository.existsById(espacoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Espaço não encontrado.");
        }
    }

    private ListaFavorito exigirLista(Long usuarioId, Long listaId) {
        ListaFavorito lista = listaRepository.findById(listaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lista não encontrada."));
        if (lista.getUsuario() == null || !lista.getUsuario().getId().equals(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta lista não é sua.");
        }
        return lista;
    }

    private List<Long> idsDe(ListaFavorito lista) {
        if (lista.getEspacoIds() == null) {
            lista.setEspacoIds(new ArrayList<>());
        }
        return lista.getEspacoIds();
    }

    private String nomeLimpo(String nome) {
        String limpo = nome == null ? "" : nome.trim();
        if (limpo.isEmpty() || limpo.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dê um nome de até 80 caracteres para a lista.");
        }
        return limpo;
    }
}
