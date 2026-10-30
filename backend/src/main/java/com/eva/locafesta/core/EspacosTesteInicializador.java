package com.eva.locafesta.core;

import com.eva.locafesta.documento.DocumentoEntity;
import com.eva.locafesta.documento.DocumentoRepository;
import com.eva.locafesta.endereco.Endereco;
import com.eva.locafesta.endereco.EnderecoRepository;
import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoAmbiente;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Garante os espaços de teste vinculados aos locadores A e B.
 */
@Component
@Order(3)
public class EspacosTesteInicializador implements ApplicationRunner {

    private static final String LOCADOR_A_UID = "dZ1lkQfXTZXfiio36x1Vg2s8nGi1";
    private static final String LOCADOR_B_UID = "mC3bJFMCbhgr0DmkrnsExgUQaFi2";

    private static final String DOC_IMOVEL =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1793311045/DOC_IMOVEL_e13k3o.png";

    private record AmbienteSeed(String titulo, String descricao, String imagem) {}

    private record EspacoSeed(
            String locadorUid,
            String titulo,
            String descricao,
            BigDecimal valorDiaria,
            BigDecimal valorMeioPeriodo,
            int capacidade,
            String fotoCapa,
            Endereco endereco,
            List<AmbienteSeed> ambientes
    ) {}

    private final UsuarioRepository usuarioRepository;
    private final PerfilLocadorRepository perfilLocadorRepository;
    private final EspacoRepository espacoRepository;
    private final EnderecoRepository enderecoRepository;
    private final DocumentoRepository documentoRepository;

    public EspacosTesteInicializador(
            UsuarioRepository usuarioRepository,
            PerfilLocadorRepository perfilLocadorRepository,
            EspacoRepository espacoRepository,
            EnderecoRepository enderecoRepository,
            DocumentoRepository documentoRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.espacoRepository = espacoRepository;
        this.enderecoRepository = enderecoRepository;
        this.documentoRepository = documentoRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (EspacoSeed seed : espacos()) {
            garantirEspaco(seed);
        }
    }

    private List<EspacoSeed> espacos() {
        return List.of(
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Local A",
                        "Espaço de teste para eventos. Área ampla com churrasqueira, "
                                + "ideal para confraternizações e celebrações.",
                        new BigDecimal("1200.00"),
                        new BigDecimal("700.00"),
                        120,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793311042/Sitio1_fli3yc.jpg",
                        Endereco.builder()
                                .cep("58407-318")
                                .logradouro("Rua Princesa Isabel")
                                .numero("610")
                                .bairro("José Pinheiro")
                                .cidade("Campina Grande")
                                .estado("PB")
                                .latitude(-7.23056)
                                .longitude(-35.88111)
                                .build(),
                        List.of(
                                new AmbienteSeed(
                                        "Cômodo A",
                                        "Área principal do sítio, ampla e ventilada.",
                                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793311042/Sitio1_fli3yc.jpg"
                                ),
                                new AmbienteSeed(
                                        "Cômodo B",
                                        "Espaço gourmet com churrasqueira.",
                                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793232206/churrasqueira_tgnrfc.jpg"
                                ),
                                new AmbienteSeed(
                                        "Cômodo C",
                                        "Área externa complementar para churrasco e convivência.",
                                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1792719755/churrasqueira_ggvk0y.webp"
                                )
                        )
                ),
                new EspacoSeed(
                        LOCADOR_B_UID,
                        "Local B",
                        "Espaço de teste aconchegante para eventos menores, "
                                + "com ambientes bem iluminados e área de banheiro.",
                        new BigDecimal("950.00"),
                        new BigDecimal("550.00"),
                        80,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793234024/teste_qy2pak.png",
                        Endereco.builder()
                                .cep("69316-610")
                                .logradouro("Rua S-34")
                                .numero("200")
                                .bairro("Senador Hélio Campos")
                                .cidade("Boa Vista")
                                .estado("RR")
                                .latitude(2.81972)
                                .longitude(-60.67333)
                                .build(),
                        List.of(
                                new AmbienteSeed(
                                        "Cômodo 1",
                                        "Ambiente principal do espaço.",
                                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793234024/teste_qy2pak.png"
                                ),
                                new AmbienteSeed(
                                        "Cômodo 2",
                                        "Banheiro completo do espaço.",
                                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793311043/Banheiro1_u4rwfb.jpg"
                                )
                        )
                )
        );
    }

    private void garantirEspaco(EspacoSeed seed) {
        Usuario usuario = usuarioRepository.findByFirebaseUid(seed.locadorUid()).orElse(null);
        if (usuario == null) {
            return;
        }

        PerfilLocador locador = perfilLocadorRepository.findByUsuarioId(usuario.getId()).orElse(null);
        if (locador == null) {
            return;
        }

        boolean jaExiste = espacoRepository.findByLocadorId(locador.getId()).stream()
                .anyMatch(espaco -> seed.titulo().equalsIgnoreCase(espaco.getTitulo()));
        if (jaExiste) {
            return;
        }

        Endereco endereco = enderecoRepository.save(seed.endereco());

        Espaco espaco = Espaco.builder()
                .locador(locador)
                .endereco(endereco)
                .titulo(seed.titulo())
                .descricao(seed.descricao())
                .valorDiaria(seed.valorDiaria())
                .valorMeioPeriodo(seed.valorMeioPeriodo())
                .capacidadePessoas(seed.capacidade())
                .horarioAbertura(LocalTime.of(8, 0))
                .horarioFechamento(LocalTime.of(23, 0))
                .permiteMeioPeriodo(true)
                .permitePeriodoIntegral(true)
                .permiteHorarioPersonalizado(false)
                .aprovacaoInstantanea(false)
                .intervaloLimpezaMin(60)
                .antecedenciaMinimaDias(1)
                .prazoCancelamentoDias(2)
                .fotoCapaUrl(seed.fotoCapa())
                .statusAprovacao("APROVADO")
                .ativo(true)
                .notaMedia(4.7)
                .quantidadeAvaliacoes(8)
                .build();

        List<EspacoAmbiente> ambientes = new ArrayList<>();
        for (AmbienteSeed ambiente : seed.ambientes()) {
            ambientes.add(EspacoAmbiente.builder()
                    .espaco(espaco)
                    .titulo(ambiente.titulo())
                    .descricao(ambiente.descricao())
                    .imagensUrls(new ArrayList<>(List.of(ambiente.imagem())))
                    .build());
        }
        espaco.setAmbientes(ambientes);

        Espaco salvo = espacoRepository.save(espaco);
        garantirDocumentoImovel(salvo);
    }

    private void garantirDocumentoImovel(Espaco espaco) {
        if (documentoRepository.existsByEspacoIdAndTipoDocumento(espaco.getId(), "IPTU")) {
            return;
        }

        documentoRepository.save(DocumentoEntity.builder()
                .tipoDocumento("IPTU")
                .categoria("ESPACO")
                .espaco(espaco)
                .nomeArquivo("DOC_IMOVEL.png")
                .arquivoUrl(DOC_IMOVEL)
                .status("APROVADO")
                .dataAnalise(LocalDateTime.now())
                .observacao("Documento de teste do imóvel gerado automaticamente")
                .build());
    }
}
