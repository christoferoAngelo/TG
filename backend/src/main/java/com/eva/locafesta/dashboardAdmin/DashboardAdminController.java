package com.eva.locafesta.dashboardAdmin;

import com.eva.locafesta.espaco.EspacoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") 
public class DashboardAdminController {

    private final DashboardAdminService dashboardAdminService;

    // GET /api/admin/dashboard - Retorna estatísticas gerais
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardAdminDTO> obterDashboard() {
        return ResponseEntity.ok(dashboardAdminService.obterResumoDashboard());
    }

    // GET /api/admin/espacos/pendentes - Mantido para compatibilidade com a rota antiga
    @GetMapping("/espacos/pendentes")
    public ResponseEntity<List<EspacoDTO>> listarPendentes() {
        return ResponseEntity.ok(dashboardAdminService.listarEspacosPorStatus("PENDENTE"));
    }

    // GET /api/admin/espacos?status=APROVADO - Filtro dinâmico por status (PENDENTE, APROVADO, REJEITADO)
    @GetMapping("/espacos")
    public ResponseEntity<List<EspacoDTO>> listarPorStatus(@RequestParam(defaultValue = "PENDENTE") String status) {
        return ResponseEntity.ok(dashboardAdminService.listarEspacosPorStatus(status));
    }

    // PATCH /api/admin/espacos/{id}/aprovar - Aprova o espaço especificado
    @PatchMapping("/espacos/{id}/aprovar")
    public ResponseEntity<EspacoDTO> aprovarEspaco(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardAdminService.aprovarEspaco(id));
    }

    // PATCH /api/admin/espacos/{id}/rejeitar - Rejeita o espaço recebendo a justificativa no body
    @PatchMapping("/espacos/{id}/rejeitar")
    public ResponseEntity<EspacoDTO> rejeitarEspaco(
            @PathVariable Long id, 
            @RequestBody RejeicaoDTO dto) {
        return ResponseEntity.ok(dashboardAdminService.rejeitarEspaco(id, dto.getMotivo()));
    }
}