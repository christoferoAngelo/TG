package com.eva.locafesta.auditoria;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs-auditoria")
@CrossOrigin(origins = "*")
public class LogAuditoriaController {

    @Autowired
    private LogAuditoriaService logAuditoriaService;

    /**
     * Retorna os logs paginados do mais recente para o mais antigo.
     * Exemplo de chamada: GET http://localhost:8080/api/logs-auditoria?pagina=0&tamanho=15
     */
    @GetMapping
    public ResponseEntity<Page<LogAuditoria>> listarTodos(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho) {
        
        Page<LogAuditoria> logs = logAuditoriaService.listarTodosPaginado(pagina, tamanho);
        return ResponseEntity.ok(logs);
    }

    /**
     * Retorna todo o histórico de ações de um administrador específico.
     * Exemplo de chamada: GET http://localhost:8080/api/logs-auditoria/admin/1
     */
    @GetMapping("/admin/{adminId}")
    public ResponseEntity<List<LogAuditoria>> listarPorAdmin(@PathVariable Long adminId) {
        List<LogAuditoria> logs = logAuditoriaService.listarPorAdmin(adminId);
        return ResponseEntity.ok(logs);
    }
}