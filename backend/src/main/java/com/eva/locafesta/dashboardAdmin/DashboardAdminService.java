package com.eva.locafesta.dashboardAdmin;

import com.eva.locafesta.espaco.EspacoDTO;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.espaco.EspacoService;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DashboardAdminService {

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

    public List<EspacoDTO> listarEspacosPorStatus(String status) {
        return espacoService.listarPorStatus(status);
    }

    // Aprova o espaço cadastrado pelo locador (Chama o serviço com tratamento de limpeza de campos)
    public EspacoDTO aprovarEspaco(Long id) {
        return espacoService.aprovarEspaco(id);
    }

    // Rejeita o espaço cadastrado pelo locador
    public EspacoDTO rejeitarEspaco(Long id, String motivo) {
        return espacoService.rejeitarEspaco(id, motivo);
    }
}