package com.eva.locafesta.dashboardAdmin;

import com.eva.locafesta.espaco.EspacoDTO;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.espaco.EspacoService;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

//Concentra a regra de negócio do painel do Admin, agregando métricas e intermediando a aprovação dos espaços.

@Service
public class DashboardAdminService {

    //Locador cadastra o espaço: O espaço é salvo com statusAprovacao = "PENDENTE". 
    // Admin acessa o Dashboard: O React faz uma requisição para /api/admin/dashboard para carregar o resumo e para /api/admin/espacos/pendentes para listar os locais que precisam de análise.
    // Ação do Admin: O Admin clica no botão "Aprovar" no frontend, que aciona PATCH /api/admin/espacos/{id}/aprovar. O status é alterado no banco para "APROVADO" e o espaço passa a poder ser exibido no feed do locatário!

    @Autowired
    private EspacoRepository espacoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EspacoService espacoService;

    // Retorna os números gerais para os cards do Dashboard
    public DashboardAdminDTO obterResumoDashboard() {
        long totalEspacos = espacoRepository.count();
        long espacosPendentes = espacoRepository.countByStatusAprovacao("PENDENTE");
        long espacosAprovados = espacoRepository.countByStatusAprovacao("APROVADO");
        long totalUsuarios = usuarioRepository.count();

        return DashboardAdminDTO.builder()
                .totalEspacos(totalEspacos)
                .espacosPendentes(espacosPendentes)
                .espacosAprovados(espacosAprovados)
                .totalUsuarios(totalUsuarios)
                .build();
    }

    // Retorna apenas a lista de espaços pendentes de validação
    public List<EspacoDTO> listarEspacosPendentes() {
        return espacoService.listarPorStatus("PENDENTE");
    }

    // Aprova o espaço cadastrado pelo locador
    public EspacoDTO aprovarEspaco(Long id) {
        return espacoService.alterarStatusAprovacao(id, "APROVADO");
    }

    // Rejeita o espaço cadastrado pelo locador
    public EspacoDTO rejeitarEspaco(Long id) {
        return espacoService.alterarStatusAprovacao(id, "REJEITADO");
    }
}