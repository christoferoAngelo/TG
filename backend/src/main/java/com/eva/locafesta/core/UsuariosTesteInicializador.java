package com.eva.locafesta.core;

import com.eva.locafesta.documento.DocumentoEntity;
import com.eva.locafesta.documento.DocumentoRepository;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoRepository;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.locatario.PerfilLocatario;
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
 * Garante os usuários de teste no MySQL com endereço, perfil de locatário,
 * documentos e, quando informado, perfil de locador.
 */
@Component
@Order(2)
public class UsuariosTesteInicializador implements ApplicationRunner {

    private record LocadorSeed(String cnpj, String nomeFantasia) {}

    private record EnderecoSeed(
            String cep,
            String logradouro,
            String numero,
            String bairro,
            String cidade,
            String estado,
            Double latitude,
            Double longitude
    ) {}

    private record UsuarioSeed(
            String firebaseUid,
            String nome,
            String email,
            String cpf,
            String telefone,
            EnderecoSeed endereco,
            LocadorSeed locador
    ) {}

    private record DocumentoSeed(String tipo, String nomeArquivo, String url) {}

    private static final List<UsuarioSeed> USUARIOS = List.of(
            new UsuarioSeed(
                    "dZ1lkQfXTZXfiio36x1Vg2s8nGi1",
                    "Locador A",
                    "andreamoraes12@gmail.com",
                    "30325404020",
                    "(11) 98765-4321",
                    new EnderecoSeed(
                            "58407-318",
                            "Rua Princesa Isabel",
                            "610",
                            "José Pinheiro",
                            "Campina Grande",
                            "PB",
                            -7.23056,
                            -35.88111
                    ),
                    new LocadorSeed("98472984000108", "Local A")
            ),
            new UsuarioSeed(
                    "mC3bJFMCbhgr0DmkrnsExgUQaFi2",
                    "Locador B",
                    "angelu.angelo@gmail.com",
                    "75665971081",
                    "(11) 97654-3210",
                    new EnderecoSeed(
                            "69316-610",
                            "Rua S-34",
                            "200",
                            "Senador Hélio Campos",
                            "Boa Vista",
                            "RR",
                            2.81972,
                            -60.67333
                    ),
                    new LocadorSeed("88769252000120", "Local B")
            ),
            new UsuarioSeed(
                    "V9nMU2UGaNMt0zte0jzvSngS53k2",
                    "Locatario A",
                    "christoferoangelo@gmail.com",
                    "12547878011",
                    "(11) 96543-2109",
                    new EnderecoSeed(
                            "55012-005",
                            "Rua Gerson Gomes Sobrinho",
                            "21",
                            "Maurício de Nassau",
                            "Caruaru",
                            "PE",
                            -8.28333,
                            -35.97611
                    ),
                    null
            ),
            new UsuarioSeed(
                    "ytC3DfaUmgTeDLARF9FiyD55ZEY2",
                    "Locatario B",
                    "telaskoavara903@gmail.com",
                    "04329205017",
                    "(11) 95432-1098",
                    new EnderecoSeed(
                            "45203-650",
                            "Rua Jerônimo Sodré",
                            "95",
                            "Centro",
                            "Jequié",
                            "BA",
                            -13.85875,
                            -40.08512
                    ),
                    null
            )
    );

    private static final List<DocumentoSeed> DOCUMENTOS = List.of(
            new DocumentoSeed(
                    "RG_FRENTE",
                    "RG_FRENTE.png",
                    "https://res.cloudinary.com/dk7bgyams/image/upload/v1793310109/RG_FRENTE_kzoay9.png"
            ),
            new DocumentoSeed(
                    "RG_VERSO",
                    "RG_VERSO.png",
                    "https://res.cloudinary.com/dk7bgyams/image/upload/v1793310110/RG_VERSO_g6eata.png"
            ),
            new DocumentoSeed(
                    "COMPROVANTE_RESIDENCIA",
                    "COMPROVANTE_ENDERECO.png",
                    "https://res.cloudinary.com/dk7bgyams/image/upload/v1793310111/COMPROVANTE_DE_ENDERE%C3%87O_f5ssaw.png"
            )
    );

    private final UsuarioRepository usuarioRepository;
    private final EnderecoRepository enderecoRepository;
    private final PerfilLocatarioRepository perfilLocatarioRepository;
    private final PerfilLocadorRepository perfilLocadorRepository;
    private final DocumentoRepository documentoRepository;

    public UsuariosTesteInicializador(
            UsuarioRepository usuarioRepository,
            EnderecoRepository enderecoRepository,
            PerfilLocatarioRepository perfilLocatarioRepository,
            PerfilLocadorRepository perfilLocadorRepository,
            DocumentoRepository documentoRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.enderecoRepository = enderecoRepository;
        this.perfilLocatarioRepository = perfilLocatarioRepository;
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.documentoRepository = documentoRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (UsuarioSeed seed : USUARIOS) {
            Usuario usuario = garantirUsuario(seed);
            garantirPerfilLocatario(usuario, seed.cpf());
            garantirDocumentos(usuario);
            if (seed.locador() != null) {
                garantirPerfilLocador(usuario, seed.locador());
            }
        }
    }

    private Usuario garantirUsuario(UsuarioSeed seed) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(seed.firebaseUid())
                .or(() -> usuarioRepository.findByEmail(seed.email()))
                .orElseGet(Usuario::new);

        usuario.setFirebaseUid(seed.firebaseUid());
        usuario.setNome(seed.nome());
        usuario.setEmail(seed.email());
        usuario.setTelefone(seed.telefone());
        usuario.setAdmin(false);
        if (usuario.getStatusConta() == null || usuario.getStatusConta().isBlank()) {
            usuario.setStatusConta("ATIVO");
        }
        if (usuario.getDataAtivo() == null) {
            usuario.setDataAtivo(LocalDateTime.now());
        }
        usuario.setEndereco(garantirEndereco(usuario.getEndereco(), seed.endereco()));
        return usuarioRepository.save(usuario);
    }

    private Endereco garantirEndereco(Endereco atual, EnderecoSeed seed) {
        Endereco endereco = atual != null ? atual : new Endereco();
        endereco.setCep(seed.cep());
        endereco.setLogradouro(seed.logradouro());
        endereco.setNumero(seed.numero());
        endereco.setBairro(seed.bairro());
        endereco.setCidade(seed.cidade());
        endereco.setEstado(seed.estado());
        endereco.setLatitude(seed.latitude());
        endereco.setLongitude(seed.longitude());
        return enderecoRepository.save(endereco);
    }

    private void garantirPerfilLocatario(Usuario usuario, String cpf) {
        if (perfilLocatarioRepository.existsByUsuarioId(usuario.getId())) {
            return;
        }
        if (perfilLocatarioRepository.existsByCpf(cpf)) {
            return;
        }

        PerfilLocatario perfil = PerfilLocatario.builder()
                .cpf(cpf)
                .usuario(usuario)
                .dataAtivo(LocalDateTime.now())
                .build();
        perfilLocatarioRepository.save(perfil);
    }

    private void garantirPerfilLocador(Usuario usuario, LocadorSeed locador) {
        if (perfilLocadorRepository.existsByUsuarioId(usuario.getId())) {
            return;
        }
        if (perfilLocadorRepository.existsByDocumento(locador.cnpj())) {
            return;
        }

        PerfilLocador perfil = PerfilLocador.builder()
                .documento(locador.cnpj())
                .nomeFantasia(locador.nomeFantasia())
                .usuario(usuario)
                .dataAtivo(LocalDateTime.now())
                .build();
        perfilLocadorRepository.save(perfil);
    }

    private void garantirDocumentos(Usuario usuario) {
        LocalDateTime agora = LocalDateTime.now();
        for (DocumentoSeed doc : DOCUMENTOS) {
            if (documentoRepository.existsByUsuarioIdAndTipoDocumento(usuario.getId(), doc.tipo())) {
                continue;
            }

            DocumentoEntity entidade = DocumentoEntity.builder()
                    .tipoDocumento(doc.tipo())
                    .categoria("PESSOA")
                    .usuario(usuario)
                    .nomeArquivo(doc.nomeArquivo())
                    .arquivoUrl(doc.url())
                    .status("APROVADO")
                    .dataAnalise(agora)
                    .observacao("Documento de teste gerado automaticamente")
                    .build();
            documentoRepository.save(entidade);
        }
    }
}
