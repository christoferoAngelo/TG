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

    // Banheiros e piscinas reutilizáveis entre os espaços de exemplo
    private static final String BANHEIRO_1 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266253/WhatsApp_Image_2026-11-09_at_8.12.00_PM_msqx2s.jpg";
    private static final String BANHEIRO_2 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266252/WhatsApp_Image_2026-11-09_at_8.12.00_PM_1_atwrcd.jpg";
    private static final String BANHEIRO_3 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266252/WhatsApp_Image_2026-11-09_at_8.12.00_PM_2_dyrr7n.jpg";
    private static final String BANHEIRO_4 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1793311043/Banheiro1_u4rwfb.jpg";
    private static final String BANHEIRO_5 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267090/WhatsApp_Image_2026-11-09_at_8.22.30_PM_2_slfdyx.jpg";

    private static final String PISCINA_1 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266747/WhatsApp_Image_2026-11-09_at_8.22.24_PM_pbjow7.jpg";
    private static final String PISCINA_2 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266747/WhatsApp_Image_2026-11-09_at_8.22.21_PM_3_gyt75w.jpg";
    private static final String PISCINA_3 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266748/WhatsApp_Image_2026-11-09_at_8.22.21_PM_1_olddmd.jpg";
    private static final String PISCINA_4 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266748/WhatsApp_Image_2026-11-09_at_8.22.21_PM_2_tqnuxc.jpg";
    private static final String PISCINA_5 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267093/WhatsApp_Image_2026-11-09_at_8.22.29_PM_1_u4ekze.jpg";
    private static final String PISCINA_6 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267092/WhatsApp_Image_2026-11-09_at_8.22.29_PM_2_ceqvxw.jpg";
    private static final String PISCINA_7 =
            "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267092/WhatsApp_Image_2026-11-09_at_8.22.30_PM_cfzdsm.jpg";

    private record AmbienteSeed(String titulo, String descricao, List<String> imagens) {}

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
                // --- espaços originais de teste ---
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Local A",
                        "Espaço de teste para eventos. Área ampla com churrasqueira, "
                                + "ideal para confraternizações e celebrações.",
                        new BigDecimal("1200.00"),
                        new BigDecimal("700.00"),
                        120,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1793311042/Sitio1_fli3yc.jpg",
                        endereco("58407-318", "Rua Princesa Isabel", "610", "José Pinheiro",
                                "Campina Grande", "PB", -7.23056, -35.88111),
                        List.of(
                                ambiente("Cômodo A", "Área principal do sítio, ampla e ventilada.",
                                        List.of("https://res.cloudinary.com/dk7bgyams/image/upload/v1793311042/Sitio1_fli3yc.jpg")),
                                ambiente("Cômodo B", "Espaço gourmet com churrasqueira.",
                                        List.of("https://res.cloudinary.com/dk7bgyams/image/upload/v1793232206/churrasqueira_tgnrfc.jpg")),
                                ambiente("Cômodo C", "Área externa complementar para churrasco e convivência.",
                                        List.of("https://res.cloudinary.com/dk7bgyams/image/upload/v1792719755/churrasqueira_ggvk0y.webp"))
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
                        endereco("69316-610", "Rua S-34", "200", "Senador Hélio Campos",
                                "Boa Vista", "RR", 2.81972, -60.67333),
                        List.of(
                                ambiente("Cômodo 1", "Ambiente principal do espaço.",
                                        List.of("https://res.cloudinary.com/dk7bgyams/image/upload/v1793234024/teste_qy2pak.png")),
                                ambiente("Cômodo 2", "Banheiro completo do espaço.",
                                        List.of(BANHEIRO_4))
                        )
                ),

                // --- espaço 1: eventos corporativos ---
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Salão Horizonte Corporativo",
                        "Espaço amplo para eventos corporativos, treinamentos e confraternizações "
                                + "empresariais, com iluminação profissional e áreas de apoio.",
                        new BigDecimal("1800.00"),
                        new BigDecimal("1100.00"),
                        150,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266080/WhatsApp_Image_2026-10-27_at_9.13.25_PM_1_i3hvph.jpg",
                        endereco("58400-140", "Av. Canal", "1200", "Centro",
                                "Campina Grande", "PB", -7.2308, -35.8815),
                        List.of(
                                ambiente("Cômodo A", "Salão principal para palestras e networking.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266080/WhatsApp_Image_2026-10-27_at_9.13.25_PM_1_i3hvph.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266096/WhatsApp_Image_2026-10-27_at_9.13.25_PM_pllidi.jpg"
                                        )),
                                ambiente("Cômodo B", "Área de apoio e sanitários para convidados.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266096/WhatsApp_Image_2026-10-27_at_9.13.26_PM_1_oponij.jpg",
                                                BANHEIRO_1
                                        ))
                        )
                ),

                // --- espaço 2: festa infantil ---
                new EspacoSeed(
                        LOCADOR_B_UID,
                        "Recanto Kids Alegria",
                        "Espaço pensado para festas infantis, com área colorida, "
                                + "espaço para brincadeiras e apoio aos pais.",
                        new BigDecimal("900.00"),
                        new BigDecimal("520.00"),
                        60,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794265899/WhatsApp_Image_2026-10-27_at_9.04.48_PM_tjty6w.jpg",
                        endereco("58410-225", "Rua das Acácias", "88", "Bodocongó",
                                "Campina Grande", "PB", -7.2150, -35.9100),
                        List.of(
                                ambiente("Cômodo A", "Salão principal da festa infantil.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794265899/WhatsApp_Image_2026-10-27_at_9.04.48_PM_tjty6w.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794265899/WhatsApp_Image_2026-10-27_at_9.04.48_PM_1_q03kir.jpg"
                                        )),
                                ambiente("Cômodo B", "Área de apoio e banheiro infantil.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794265899/WhatsApp_Image_2026-10-27_at_9.04.47_PM_c3x8vs.jpg",
                                                BANHEIRO_2
                                        ))
                        )
                ),

                // --- espaço 3: sítio ---
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Sítio Bela Vista",
                        "Sítio amplo com área verde, churrasqueira e piscina, "
                                + "ideal para confraternizações em família.",
                        new BigDecimal("1400.00"),
                        new BigDecimal("850.00"),
                        100,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266247/WhatsApp_Image_2026-11-09_at_8.12.06_PM_1_uxtzkm.jpg",
                        endereco("58417-000", "Rodovia PB-110", "Km 4", "Zona Rural",
                                "Campina Grande", "PB", -7.1800, -35.9200),
                        List.of(
                                ambiente("Cômodo A", "Área coberta e salão principal do sítio.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266247/WhatsApp_Image_2026-11-09_at_8.12.06_PM_1_uxtzkm.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266248/WhatsApp_Image_2026-11-09_at_8.12.05_PM_4_sebtre.jpg"
                                        )),
                                ambiente("Cômodo B", "Área externa com piscina e banheiro.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266249/WhatsApp_Image_2026-11-09_at_8.12.05_PM_2_bebcuo.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266251/WhatsApp_Image_2026-11-09_at_8.12.04_PM_fgwajx.jpg",
                                                PISCINA_1,
                                                BANHEIRO_3
                                        ))
                        )
                ),

                // --- espaço 4: sítio ---
                new EspacoSeed(
                        LOCADOR_B_UID,
                        "Sítio Encanto Verde",
                        "Sítio arborizado com gramado amplo e áreas para lazer, "
                                + "perfeito para eventos ao ar livre.",
                        new BigDecimal("1300.00"),
                        new BigDecimal("780.00"),
                        90,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266249/WhatsApp_Image_2026-11-09_at_8.12.05_PM_3_tnhzkr.jpg",
                        endereco("58418-200", "Estrada do Açude", "s/n", "Zona Rural",
                                "Campina Grande", "PB", -7.1950, -35.8700),
                        List.of(
                                ambiente("Cômodo A", "Casa principal e área de convivência.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266249/WhatsApp_Image_2026-11-09_at_8.12.05_PM_3_tnhzkr.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266249/WhatsApp_Image_2026-11-09_at_8.12.05_PM_1_gd1fzs.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266250/WhatsApp_Image_2026-11-09_at_8.12.05_PM_a3vfsw.jpg"
                                        )),
                                ambiente("Cômodo B", "Área externa, piscina e sanitários.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266250/WhatsApp_Image_2026-11-09_at_8.12.04_PM_1_kbgg14.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266250/WhatsApp_Image_2026-11-09_at_8.12.04_PM_3_fx1yo9.jpg",
                                                PISCINA_2,
                                                BANHEIRO_4
                                        ))
                        )
                ),

                // --- espaço 5: chácara ---
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Chácara Sol Nascente",
                        "Chácara com quintal amplo, área gourmet e piscina, "
                                + "ótima para aniversários e churrascos.",
                        new BigDecimal("1100.00"),
                        new BigDecimal("650.00"),
                        70,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266250/WhatsApp_Image_2026-11-09_at_8.12.04_PM_2_y21mrr.jpg",
                        endereco("58419-050", "Rua do Sol", "45", "Malvinas",
                                "Campina Grande", "PB", -7.2450, -35.9300),
                        List.of(
                                ambiente("Cômodo A", "Área principal e varanda da chácara.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266250/WhatsApp_Image_2026-11-09_at_8.12.04_PM_2_y21mrr.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266251/WhatsApp_Image_2026-11-09_at_8.12.00_PM_4_cl64wi.jpg"
                                        )),
                                ambiente("Cômodo B", "Piscina, área de lazer e banheiro.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266252/WhatsApp_Image_2026-11-09_at_8.12.00_PM_3_q2znw5.jpg",
                                                PISCINA_3,
                                                BANHEIRO_5
                                        ))
                        )
                ),

                // --- espaço 6: sítio ---
                new EspacoSeed(
                        LOCADOR_B_UID,
                        "Sítio Águas Claras",
                        "Sítio com lago, área verde e estrutura completa para "
                                + "festas de dia inteiro.",
                        new BigDecimal("1600.00"),
                        new BigDecimal("950.00"),
                        120,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266878/WhatsApp_Image_2026-11-09_at_8.22.27_PM_1_uq7wyi.jpg",
                        endereco("58100-000", "PB-079", "Km 8", "Zona Rural",
                                "Queimadas", "PB", -7.3600, -35.9000),
                        List.of(
                                ambiente("Cômodo A", "Salão e área coberta do sítio.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266878/WhatsApp_Image_2026-11-09_at_8.22.27_PM_1_uq7wyi.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266879/WhatsApp_Image_2026-11-09_at_8.22.27_PM_wtep3b.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266879/WhatsApp_Image_2026-11-09_at_8.22.26_PM_4_dypquu.jpg"
                                        )),
                                ambiente("Cômodo B", "Área externa com piscina e banheiro.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266879/WhatsApp_Image_2026-11-09_at_8.22.26_PM_3_fhuuac.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266880/WhatsApp_Image_2026-11-09_at_8.22.26_PM_2_fggae2.jpg",
                                                PISCINA_4,
                                                BANHEIRO_1
                                        ))
                        )
                ),

                // --- espaço 7: sítio ---
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Sítio Recanto do Cedro",
                        "Sítio arborizado com diversos ambientes para convivência, "
                                + "churrasco e piscina.",
                        new BigDecimal("1500.00"),
                        new BigDecimal("900.00"),
                        110,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266880/WhatsApp_Image_2026-11-09_at_8.22.26_PM_1_akqjyt.jpg",
                        endereco("58420-100", "Estrada das Palmeiras", "320", "Zona Rural",
                                "Campina Grande", "PB", -7.1700, -35.8500),
                        List.of(
                                ambiente("Cômodo A", "Casa sede e salão principal.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266880/WhatsApp_Image_2026-11-09_at_8.22.26_PM_1_akqjyt.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266881/WhatsApp_Image_2026-11-09_at_8.22.26_PM_wmcc78.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266881/WhatsApp_Image_2026-11-09_at_8.22.25_PM_2_nngbcs.jpg"
                                        )),
                                ambiente("Cômodo B", "Área de lazer, piscina e banheiros.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266882/WhatsApp_Image_2026-11-09_at_8.22.25_PM_1_mudqvd.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266882/WhatsApp_Image_2026-11-09_at_8.22.25_PM_swed4w.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794266883/WhatsApp_Image_2026-11-09_at_8.22.24_PM_1_el5t4g.jpg",
                                                PISCINA_5,
                                                BANHEIRO_2
                                        ))
                        )
                ),

                // --- espaço 8: sítio ---
                new EspacoSeed(
                        LOCADOR_B_UID,
                        "Sítio Serra Dourada",
                        "Sítio com vista ampla, gramado e estrutura completa para "
                                + "festas e retiros em grupo.",
                        new BigDecimal("1700.00"),
                        new BigDecimal("1000.00"),
                        130,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267094/WhatsApp_Image_2026-11-09_at_8.22.25_PM_3_ozoy0o.jpg",
                        endereco("58110-000", "PB-104", "Km 12", "Zona Rural",
                                "Lagoa Seca", "PB", -7.1705, -35.8505),
                        List.of(
                                ambiente("Cômodo A", "Salão e área interna principal.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267094/WhatsApp_Image_2026-11-09_at_8.22.25_PM_3_ozoy0o.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267093/WhatsApp_Image_2026-11-09_at_8.22.29_PM_tpi50p.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267091/WhatsApp_Image_2026-11-09_at_8.22.30_PM_1_gkrsrw.jpg"
                                        )),
                                ambiente("Cômodo B", "Área externa com piscina e banheiro.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267090/WhatsApp_Image_2026-11-09_at_8.22.30_PM_3_ypl6j0.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267089/WhatsApp_Image_2026-11-09_at_8.22.31_PM_aewpvt.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267087/WhatsApp_Image_2026-11-09_at_8.22.32_PM_gusgs1.jpg",
                                                PISCINA_6,
                                                BANHEIRO_3
                                        ))
                        )
                ),

                // --- espaço 9: sítio ---
                new EspacoSeed(
                        LOCADOR_A_UID,
                        "Sítio Vale Florido",
                        "Sítio acolhedor com jardins, área de convivência e piscina, "
                                + "ideal para celebrações intimistas.",
                        new BigDecimal("1250.00"),
                        new BigDecimal("720.00"),
                        85,
                        "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267089/WhatsApp_Image_2026-11-09_at_8.22.31_PM_1_ovzzqx.jpg",
                        endereco("58422-300", "Rua dos Ipês", "150", "Catolé",
                                "Campina Grande", "PB", -7.2500, -35.9000),
                        List.of(
                                ambiente("Cômodo A", "Área principal e jardim do sítio.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267089/WhatsApp_Image_2026-11-09_at_8.22.31_PM_1_ovzzqx.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267088/WhatsApp_Image_2026-11-09_at_8.22.31_PM_2_lgvgaj.jpg"
                                        )),
                                ambiente("Cômodo B", "Área de lazer com piscina e banheiro.",
                                        List.of(
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267087/WhatsApp_Image_2026-11-09_at_8.22.31_PM_3_xul9ex.jpg",
                                                "https://res.cloudinary.com/dk7bgyams/image/upload/v1794267085/WhatsApp_Image_2026-11-09_at_8.22.32_PM_2_rnjntv.jpg",
                                                PISCINA_7,
                                                BANHEIRO_5
                                        ))
                        )
                )
        );
    }

    private static AmbienteSeed ambiente(String titulo, String descricao, List<String> imagens) {
        return new AmbienteSeed(titulo, descricao, imagens);
    }

    private static Endereco endereco(
            String cep, String logradouro, String numero, String bairro,
            String cidade, String estado, double lat, double lng
    ) {
        return Endereco.builder()
                .cep(cep)
                .logradouro(logradouro)
                .numero(numero)
                .bairro(bairro)
                .cidade(cidade)
                .estado(estado)
                .latitude(lat)
                .longitude(lng)
                .build();
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
                .notaMedia(null)
                .quantidadeAvaliacoes(0)
                .build();

        List<EspacoAmbiente> ambientes = new ArrayList<>();
        for (AmbienteSeed ambiente : seed.ambientes()) {
            ambientes.add(EspacoAmbiente.builder()
                    .espaco(espaco)
                    .titulo(ambiente.titulo())
                    .descricao(ambiente.descricao())
                    .imagensUrls(new ArrayList<>(ambiente.imagens()))
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
