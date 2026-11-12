package com.eva.locafesta.core;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.locador.PerfilLocador;
import com.eva.locafesta.locador.PerfilLocadorRepository;
import com.eva.locafesta.reserva.Reserva;
import com.eva.locafesta.reserva.ReservaRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Seed de demonstração do painel do locador (gráficos preenchidos).
 * Ative apenas em desenvolvimento: locafesta.demo-seed=true
 * Nunca deixe ligado em produção.
 *
 * Como usar:
 * 1) Em application.properties (ou application-dev.properties): locafesta.demo-seed=true
 * 2) Reinicie o backend (com ddl-auto=create ou base já com Locador A + Local A)
 * 3) Para remover: desligue a flag e apague as reservas com observação começando com "[DEMO]"
 *    ou rode: DELETE FROM reservas WHERE observacao LIKE '[DEMO]%';
 */
@Component
@Order(50)
@ConditionalOnProperty(name = "locafesta.demo-seed", havingValue = "true")
public class DemoPainelInicializador implements ApplicationRunner {

    private static final String LOCADOR_A_UID = "dZ1lkQfXTZXfiio36x1Vg2s8nGi1";
    private static final String LOCATARIO_A_UID = "V9nMU2UGaNMt0zte0jzvSngS53k2";
    private static final String MARCA = "[DEMO]";

    private final UsuarioRepository usuarioRepository;
    private final PerfilLocadorRepository perfilLocadorRepository;
    private final EspacoRepository espacoRepository;
    private final ReservaRepository reservaRepository;

    public DemoPainelInicializador(
            UsuarioRepository usuarioRepository,
            PerfilLocadorRepository perfilLocadorRepository,
            EspacoRepository espacoRepository,
            ReservaRepository reservaRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.perfilLocadorRepository = perfilLocadorRepository;
        this.espacoRepository = espacoRepository;
        this.reservaRepository = reservaRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Usuario locadorUser = usuarioRepository.findByFirebaseUid(LOCADOR_A_UID).orElse(null);
        Usuario locatario = usuarioRepository.findByFirebaseUid(LOCATARIO_A_UID).orElse(null);
        if (locadorUser == null || locatario == null) {
            System.out.println("[demo-seed] Usuários de teste não encontrados; seed ignorado.");
            return;
        }

        PerfilLocador perfil = perfilLocadorRepository.findByUsuarioId(locadorUser.getId()).orElse(null);
        if (perfil == null) {
            System.out.println("[demo-seed] Perfil de locador A não encontrado; seed ignorado.");
            return;
        }

        List<Espaco> espacos = espacoRepository.findByLocadorId(perfil.getId());
        if (espacos.isEmpty()) {
            System.out.println("[demo-seed] Nenhum espaço do Locador A; seed ignorado.");
            return;
        }

        List<Reserva> doLocador = reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(locadorUser.getId());
        boolean jaNoFormatoNovo = doLocador.stream()
                .anyMatch(r -> r.getObservacao() != null && r.getObservacao().contains("historico-6m"));
        if (jaNoFormatoNovo) {
            System.out.println("[demo-seed] Histórico de 6 meses já está no banco; nada foi apagado.");
            return;
        }
        if (!doLocador.isEmpty()) {
            reservaRepository.deleteAll(doLocador);
            reservaRepository.flush();
        }

        Espaco espaco = espacos.get(0);
        LocalDate hoje = LocalDate.now();
        int seq = 0;

        // 16 aprovadas em 6 meses, variação mensal moderada (sem salto de centenas de %).
        int[][] aprovadas = {
                {5, 6, 1100}, {5, 14, 1300}, {5, 22, 1000},
                {4, 8, 1200}, {4, 20, 1000},
                {3, 5, 1400}, {3, 15, 1100}, {3, 24, 900},
                {2, 7, 1500}, {2, 16, 1200}, {2, 25, 1000},
                {1, 4, 1300}, {1, 12, 1100}, {1, 21, 1600},
                {0, 4, 1250}, {0, 20, 1100}
        };
        for (int[] item : aprovadas) {
            LocalDate mes = hoje.minusMonths(item[0]);
            int dia = Math.min(item[1], mes.lengthOfMonth());
            LocalDate data = mes.withDayOfMonth(dia);
            boolean passado = data.isBefore(hoje);
            salvar(espaco, locatario, data, "APROVADA", passado, new BigDecimal(item[2]), ++seq);
        }

        salvar(espaco, locatario, hoje.plusDays(6), "PENDENTE", false, new BigDecimal("1200"), ++seq);
        salvar(espaco, locatario, hoje.minusDays(6), "REJEITADA", false, new BigDecimal("800"), ++seq);
        salvar(espaco, locatario, hoje.minusDays(12), "CANCELADA", false, new BigDecimal("700"), ++seq);

        System.out.println("[demo-seed] Histórico do Locador A recriado (" + seq + " reservas, 16 aprovadas).");
    }

    private void salvar(
            Espaco espaco,
            Usuario locatario,
            LocalDate data,
            String status,
            boolean pagamentoLiberado,
            BigDecimal valor,
            int seq
    ) {
        Reserva r = Reserva.builder()
                .espaco(espaco)
                .locatario(locatario)
                .dataEvento(data)
                .horaInicio(LocalTime.of(10, 0))
                .horaFim(LocalTime.of(18, 0))
                .valorTotal(valor)
                .status(status)
                .pagamentoLiberado(pagamentoLiberado)
                .observacao(MARCA + " historico-6m #" + seq)
                .build();
        reservaRepository.save(r);
    }
}
