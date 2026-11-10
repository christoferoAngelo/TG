package com.eva.locafesta.core;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.reserva.Reserva;
import com.eva.locafesta.reserva.ReservaRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seed de reservas já avaliadas para popular as notas dos espaços.
 * Idempotente: marca com [DEMO-AVAL] na observação.
 *
 * - Locatário C/D/E avaliam todos os espaços (1ª visita, nota 3–5).
 * - Locatário A/B reforçam alguns anúncios (mais avaliações).
 * - 2ª visita do mesmo usuário: sempre 5 estrelas, comentário de retorno.
 */
@Component
@Order(55)
public class AvaliacoesDemoInicializador implements ApplicationRunner {

    private static final String MARCA = "[DEMO-AVAL]";

    private record AvalSeed(
            String emailLocatario,
            String tituloEspaco,
            int nota,
            String comentario,
            int diasAtras,
            boolean retorno
    ) {}

    private final UsuarioRepository usuarioRepository;
    private final EspacoRepository espacoRepository;
    private final ReservaRepository reservaRepository;

    public AvaliacoesDemoInicializador(
            UsuarioRepository usuarioRepository,
            EspacoRepository espacoRepository,
            ReservaRepository reservaRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.espacoRepository = espacoRepository;
        this.reservaRepository = reservaRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (reservaRepository.existsByObservacaoStartingWith(MARCA)) {
            System.out.println("[demo-aval] Avaliações demo já existem; seed ignorado.");
            return;
        }

        Map<String, Usuario> porEmail = new HashMap<>();
        for (String email : List.of(
                "jeehbeatrizaraujo@gmail.com",
                "xongx26@gmail.com",
                "presencify@gmail.com",
                "christoferoangelo@gmail.com",
                "telaskoavara903@gmail.com"
        )) {
            usuarioRepository.findByEmail(email).ifPresent(u -> porEmail.put(email, u));
        }
        if (porEmail.size() < 3) {
            System.out.println("[demo-aval] Locatários C/D/E não encontrados; seed ignorado.");
            return;
        }

        Map<String, Espaco> porTitulo = new HashMap<>();
        for (Espaco e : espacoRepository.findAll()) {
            porTitulo.put(e.getTitulo(), e);
        }
        if (porTitulo.isEmpty()) {
            System.out.println("[demo-aval] Nenhum espaço; seed ignorado.");
            return;
        }

        List<AvalSeed> seeds = montarSeeds(porTitulo.keySet().stream().sorted().toList());
        int criadas = 0;
        for (AvalSeed seed : seeds) {
            Usuario locatario = porEmail.get(seed.emailLocatario());
            Espaco espaco = porTitulo.get(seed.tituloEspaco());
            if (locatario == null || espaco == null) {
                continue;
            }
            // Locador não avalia o próprio anúncio
            if (espaco.getLocador() != null
                    && espaco.getLocador().getUsuario() != null
                    && espaco.getLocador().getUsuario().getId().equals(locatario.getId())) {
                continue;
            }
            salvarAvaliacao(espaco, locatario, seed, ++criadas);
        }

        for (Espaco espaco : espacoRepository.findAll()) {
            Double media = reservaRepository.calcularMediaNotaPorEspaco(espaco.getId());
            long qtd = reservaRepository.countByEspacoIdAndNotaIsNotNull(espaco.getId());
            espaco.setNotaMedia(media);
            espaco.setQuantidadeAvaliacoes((int) qtd);
            espacoRepository.save(espaco);
        }

        System.out.println("[demo-aval] " + criadas + " avaliações de demonstração criadas.");
    }

    private List<AvalSeed> montarSeeds(List<String> titulos) {
        final String C = "jeehbeatrizaraujo@gmail.com";
        final String D = "xongx26@gmail.com";
        final String E = "presencify@gmail.com";
        final String A = "christoferoangelo@gmail.com";
        final String B = "telaskoavara903@gmail.com";

        // 1ª visita — textos por índice do espaço (roda 3–5)
        String[] comentariosC = {
                "Espaço limpo e organizado. Atendeu bem o que precisávamos para a confraternização.",
                "Gostei bastante da área externa. Só achei o estacionamento um pouco apertado.",
                "Boa estrutura e locador atencioso. Voltaria a alugar sem dúvida.",
                "O salão ficou ótimo para o evento da empresa. Som e iluminação ok.",
                "Lugar agradável, mas a cozinha poderia ter mais utensílios.",
                "Festa da família rolou tranquila. Espaço bem cuidado e seguro.",
                "Muito bonito e arejado. Recomendo para grupos médios.",
                "Cumpriu o anunciado. Comunicação rápida com o locador.",
                "Ambiente aconchegante. Nota boa no geral.",
                "Excelente custo-benefício para o tamanho do terreno.",
                "Tudo certo no dia. Chegamos e o espaço já estava pronto."
        };
        String[] comentariosD = {
                "Usamos para aniversário e deu tudo certo. Piscina limpa e área coberta útil.",
                "Espaço bacana, mas o banheiro externo precisa de manutenção.",
                "Adorei o gramado e a churrasqueira. Convidados elogiaram bastante.",
                "Bom para eventos corporativos pequenos. Wi-Fi estável.",
                "Ficamos satisfeitos. Só faltou um pouco mais de sombra à tarde.",
                "Local de fácil acesso e bem sinalizado. Recomendo.",
                "Estrutura sólida. Cozinha funcional e mesas suficientes.",
                "Gostei, porém o som do vizinho atrapalhou um pouco à noite.",
                "Perfeito para a nossa turma. Voltaremos com certeza.",
                "Limpeza impecável na entrega. Locador pontual.",
                "Espaço versátil, deu para montar mesa e pista sem aperto."
        };
        String[] comentariosE = {
                "Primeira vez alugando aqui: experiência positiva do começo ao fim.",
                "Bonito, mas a capacidade real parece um pouco menor que a anunciada.",
                "Ótimo para festa infantil — área segura e banheiro próximo.",
                "Salão amplo e bem iluminado. Facilitou a decoração.",
                "Chácara charmosa. Só levei um ventilador a mais por causa do calor.",
                "Sítio tranquilo, longe do barulho da cidade. Amei.",
                "Tudo dentro do esperado. Documentação e regras claras.",
                "Boa opção na região. Preço justo pelo que oferece.",
                "Ambientes bem separados (salão e área externa). Prático.",
                "Recebemos bem. Houve um pequeno atraso na chave, mas resolveu.",
                "Espaço fotogênico e limpo. Indico para casamentos íntimos."
        };
        int[] notasC = {5, 4, 5, 5, 3, 5, 4, 4, 4, 5, 5};
        int[] notasD = {5, 3, 5, 4, 4, 5, 4, 3, 5, 5, 4};
        int[] notasE = {5, 3, 5, 5, 4, 5, 4, 4, 5, 3, 5};

        List<AvalSeed> lista = new ArrayList<>();
        int i = 0;
        for (String titulo : titulos) {
            int idx = i % comentariosC.length;
            lista.add(new AvalSeed(C, titulo, notasC[idx], comentariosC[idx], 40 + i * 3, false));
            lista.add(new AvalSeed(D, titulo, notasD[idx], comentariosD[idx], 35 + i * 3, false));
            lista.add(new AvalSeed(E, titulo, notasE[idx], comentariosE[idx], 30 + i * 3, false));
            i++;
        }

        // Mais avaliações em anúncios “populares”
        List<String> popularesA = titulos.stream()
                .filter(t -> t.equalsIgnoreCase("Local A")
                        || t.contains("Horizonte")
                        || t.contains("Bela Vista")
                        || t.contains("Kids")
                        || t.contains("Sol Nascente")
                        || t.contains("Serra Dourada"))
                .toList();
        List<String> popularesB = titulos.stream()
                .filter(t -> t.equalsIgnoreCase("Local B")
                        || t.contains("Encanto")
                        || t.contains("Águas Claras")
                        || t.contains("Recanto do Cedro")
                        || t.contains("Vale Florido")
                        || t.contains("Horizonte"))
                .toList();

        String[] comentariosA = {
                "Aluguei para a festa da empresa e correu tudo bem. Espaço fiel ao anúncio.",
                "Gostei da organização e do atendimento. Voltaria.",
                "Área externa excelente para as crianças. Recomendo.",
                "Bom custo-benefício. Só levei gelo a mais.",
                "Estrutura completa para o nosso evento de 80 pessoas.",
                "Locador prestativo e espaço limpo na chegada."
        };
        String[] comentariosB = {
                "Fiz o aniversário da minha mãe aqui. Ambiente acolhedor.",
                "Piscina e churrasqueira salvaram o domingo. Nota alta.",
                "Espaço amplo e fácil de decorar. Curti bastante.",
                "Tudo certo, só o acesso de carro que é um pouco estreito.",
                "Ótima opção perto de Campina. Voltarei.",
                "Silencioso e bem cuidado. Ideal para confraternização."
        };
        int[] notasA = {5, 4, 5, 4, 5, 5};
        int[] notasB = {5, 5, 4, 3, 5, 4};

        for (int p = 0; p < popularesA.size(); p++) {
            lista.add(new AvalSeed(A, popularesA.get(p), notasA[p % notasA.length],
                    comentariosA[p % comentariosA.length], 55 + p * 4, false));
        }
        for (int p = 0; p < popularesB.size(); p++) {
            lista.add(new AvalSeed(B, popularesB.get(p), notasB[p % notasB.length],
                    comentariosB[p % comentariosB.length], 60 + p * 4, false));
        }

        // 2ª visita (mesmo usuário) → sempre 5★
        List<String> retornosC = titulos.stream()
                .filter(t -> t.equalsIgnoreCase("Local A")
                        || t.contains("Horizonte")
                        || t.contains("Bela Vista")
                        || t.contains("Serra Dourada"))
                .toList();
        List<String> retornosD = titulos.stream()
                .filter(t -> t.contains("Kids")
                        || t.contains("Sol Nascente")
                        || t.contains("Águas Claras")
                        || t.equalsIgnoreCase("Local B"))
                .toList();
        List<String> retornosE = titulos.stream()
                .filter(t -> t.contains("Encanto")
                        || t.contains("Recanto do Cedro")
                        || t.contains("Vale Florido"))
                .toList();

        String[] textosRetorno = {
                "Aluguei pela segunda vez para a festa de aniversário da minha sobrinha — foi ótimo de novo!",
                "Segunda vez no espaço, agora para o churrasco da firma. Impecável como da outra vez.",
                "Voltei a alugar para a confraternização da família. Cinco estrelas de novo, sem hesitar.",
                "Aluguei pela segunda vez para o batizado do meu afilhado. Tudo perfeito outra vez.",
                "Segunda reserva aqui (festa de 15 anos). O espaço continua impecável.",
                "Aluguei de novo para o encontro da igreja. Mesma qualidade, atendimento excelente.",
                "Pela segunda vez, usei para a festa surpresa do meu pai. Super recomendo."
        };

        int r = 0;
        for (String titulo : retornosC) {
            lista.add(new AvalSeed(C, titulo, 5, textosRetorno[r++ % textosRetorno.length], 12 + r, true));
        }
        for (String titulo : retornosD) {
            lista.add(new AvalSeed(D, titulo, 5, textosRetorno[r++ % textosRetorno.length], 14 + r, true));
        }
        for (String titulo : retornosE) {
            lista.add(new AvalSeed(E, titulo, 5, textosRetorno[r++ % textosRetorno.length], 16 + r, true));
        }

        return lista;
    }

    private void salvarAvaliacao(Espaco espaco, Usuario locatario, AvalSeed seed, int seq) {
        LocalDate dataEvento = LocalDate.now().minusDays(Math.max(3, seed.diasAtras()));
        LocalDateTime dataAvaliacao = dataEvento.plusDays(1).atTime(20, 15).plusMinutes(seq);

        BigDecimal valor = espaco.getValorDiaria() != null
                ? espaco.getValorDiaria()
                : new BigDecimal("1000.00");

        String obs = MARCA + (seed.retorno() ? " retorno" : " primeira")
                + " #" + seq + " · " + locatario.getNome();

        Reserva reserva = Reserva.builder()
                .espaco(espaco)
                .locatario(locatario)
                .dataEvento(dataEvento)
                .horaInicio(LocalTime.of(10, 0))
                .horaFim(LocalTime.of(18, 0))
                .valorTotal(valor)
                .status("APROVADA")
                .pagamentoLiberado(true)
                .observacao(obs)
                .nota(seed.nota())
                .comentarioAvaliacao(seed.comentario())
                .dataAvaliacao(dataAvaliacao)
                .build();
        reservaRepository.save(reserva);
    }
}
