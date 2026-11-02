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

        boolean jaTemDemo = reservaRepository.findByEspacoLocadorUsuarioIdOrderByIdAsc(locadorUser.getId())
                .stream()
                .anyMatch(r -> r.getObservacao() != null && r.getObservacao().startsWith(MARCA));
        if (jaTemDemo) {
            System.out.println("[demo-seed] Reservas demo já existem; nada a fazer.");
            return;
        }

        Espaco espaco = espacos.get(0);
        LocalDate hoje = LocalDate.now();
        int seq = 0;

        // Histórico mensal (APROVADA) para o gráfico de área
        for (int m = 8; m >= 1; m--) {
            LocalDate base = hoje.minusMonths(m).withDayOfMonth(Math.min(12, hoje.minusMonths(m).lengthOfMonth()));
            salvar(espaco, locatario, base, "APROVADA", true, new BigDecimal("900").add(BigDecimal.valueOf(m * 40L)), ++seq);
            salvar(espaco, locatario, base.plusDays(5), "APROVADA", m % 2 == 0, new BigDecimal("1100"), ++seq);
        }

        // Mês atual + próximos
        salvar(espaco, locatario, hoje.plusDays(3), "PENDENTE", false, new BigDecimal("1200"), ++seq);
        salvar(espaco, locatario, hoje.plusDays(8), "PENDENTE", false, new BigDecimal("950"), ++seq);
        salvar(espaco, locatario, hoje.plusDays(12), "APROVADA", false, new BigDecimal("1300"), ++seq);
        salvar(espaco, locatario, hoje.plusDays(20), "APROVADA", true, new BigDecimal("1400"), ++seq);
        salvar(espaco, locatario, hoje.minusDays(10), "REJEITADA", false, new BigDecimal("800"), ++seq);
        salvar(espaco, locatario, hoje.minusDays(20), "CANCELADA", false, new BigDecimal("700"), ++seq);
        salvar(espaco, locatario, hoje.minusDays(4), "APROVADA", true, new BigDecimal("1250"), ++seq);

        System.out.println("[demo-seed] Reservas de demonstração criadas para o Local A (" + seq + ").");
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
                .observacao(MARCA + " reserva demo #" + seq)
                .build();
        reservaRepository.save(r);
    }
}
