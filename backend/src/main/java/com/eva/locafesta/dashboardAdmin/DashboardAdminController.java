package com.eva.locafesta.dashboardAdmin;

import com.eva.locafesta.espaco.EspacoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Libera o acesso para a sua aplicação React
public class DashboardAdminController {

    @Autowired
    private DashboardAdminService dashboardAdminService;

    // GET /api/admin/dashboard - Retorna estatísticas gerais
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardAdminDTO> obterDashboard() {
        return ResponseEntity.ok(dashboardAdminService.obterResumoDashboard());
    }

    // GET /api/admin/espacos/pendentes - Retorna espaços aguardando avaliação
    @GetMapping("/espacos/pendentes")
    public ResponseEntity<List<EspacoDTO>> listarPendentes() {
        return ResponseEntity.ok(dashboardAdminService.listarEspacosPendentes());
    }

    // PATCH /api/admin/espacos/1/aprovar - Aprova o espaço especificado
    @PatchMapping("/espacos/{id}/aprovar")
    public ResponseEntity<EspacoDTO> aprovarEspaco(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardAdminService.aprovarEspaco(id));
    }

    // PATCH /api/admin/espacos/1/rejeitar - Rejeita o espaço especificado
    @PatchMapping("/espacos/{id}/rejeitar")
    public ResponseEntity<EspacoDTO> rejeitarEspaco(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardAdminService.rejeitarEspaco(id));
    }
}