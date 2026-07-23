package com.eva.locafesta.usuario;

import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoDTO;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatarioRepository;
import com.eva.locafesta.usuario.dto.UsuarioCreateDTO;
import com.eva.locafesta.usuario.dto.UsuarioDTO;

import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PerfilLocadorRepository perfilLocadorRepository;

    @Autowired
    private PerfilLocatarioRepository perfilLocatarioRepository;

    @Transactional
	public UsuarioDTO cadastrarUsuario(UsuarioCreateDTO dto) {
	    Usuario usuario = new Usuario();
	    usuario.setFirebaseUid(dto.getFirebaseUid());
	    usuario.setNome(dto.getNome());
	    usuario.setEmail(dto.getEmail());
	    usuario.setTelefone(dto.getTelefone());
	
	    // Mapeamento e vinculação do endereço, caso venha no payload
	    if (dto.getEndereco() != null) {
	        Endereco end = new Endereco();
	        end.setCep(dto.getEndereco().getCep());
	        end.setLogradouro(dto.getEndereco().getLogradouro());
	        end.setNumero(dto.getEndereco().getNumero());
	        end.setComplemento(dto.getEndereco().getComplemento());
	        end.setBairro(dto.getEndereco().getBairro());
	        end.setCidade(dto.getEndereco().getCidade());
	        end.setEstado(dto.getEndereco().getEstado());
	        end.setLatitude(dto.getEndereco().getLatitude());
	        end.setLongitude(dto.getEndereco().getLongitude());
	        
	        // Associa na entidade (o método setEndereco ajusta a relação bidirecional)
	        usuario.setEndereco(end);
	    }

	    // Salva o usuário no banco, gerando também o registro em "enderecos"
	    Usuario usuarioSalvo = usuarioRepository.save(usuario);
	
	    boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());
	    boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());
	
	    return new UsuarioDTO(usuarioSalvo, isLocatario, isLocador);
}
    
    // Dica extra: Você vai precisar de um método de busca para quando o usuário logar de novo
    @Transactional(readOnly = true)
    public UsuarioDTO buscarPorFirebaseUid(String firebaseUid) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuario.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuario.getId());

        return new UsuarioDTO(usuario, isLocatario, isLocador);
    }
    
    @Transactional
    public UsuarioDTO atualizarEndereco(Long usuarioId, EnderecoDTO dto) {
        // 1. Busca o usuário pelo ID do MySQL
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        // 2. Verifica se o usuário já possui um endereço cadastrado
        Endereco endereco = usuario.getEndereco();
        
        if (endereco == null) {
            // Se for a primeira vez, instancia um novo endereço
            endereco = new Endereco();
        }

        // 3. Atualiza os dados vinhos do React
        endereco.setCep(dto.getCep());
        endereco.setLogradouro(dto.getLogradouro());
        endereco.setNumero(dto.getNumero());
        endereco.setComplemento(dto.getComplemento());
        endereco.setBairro(dto.getBairro());
        endereco.setCidade(dto.getCidade());
        endereco.setEstado(dto.getEstado());
        
        
        // As coordenadas de geolocalização para busca futura
        endereco.setLatitude(dto.getLatitude());
        endereco.setLongitude(dto.getLongitude());

        // 4. Associa o endereço ao usuário (Graças ao CascadeType.ALL que colocamos na entidade Usuario, 
        // salvar o usuário salvará/atualizará o endereço automaticamente na tabela 'enderecos')
        usuario.setEndereco(endereco);
        
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        // 5. Retorna o DTO atualizado (para o React recarregar a tela na hora)
        boolean isLocador = perfilLocadorRepository.existsByUsuarioId(usuarioSalvo.getId());
        boolean isLocatario = perfilLocatarioRepository.existsByUsuarioId(usuarioSalvo.getId());

        return new UsuarioDTO(usuarioSalvo, isLocatario, isLocador);
    }
    
    // Importe o LocalDateTime se ainda não estiver importado no topo do arquivo
    // import java.time.LocalDateTime;

    @Transactional
    public void atualizarDataAtivo(Long usuarioId) {
        // 1. Busca o usuário pelo ID
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado para atualizar atividade."));
        
        // 2. Atualiza o campo com a data e hora atuais do servidor
        usuario.setDataAtivo(LocalDateTime.now());
        
        // 3. Salva no banco
        usuarioRepository.save(usuario);
    }
    
   
}