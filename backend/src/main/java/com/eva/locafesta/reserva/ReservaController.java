package com.eva.locafesta.reserva;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    // Substitua o comentário // ... (Mantenha o método de solicitarReserva aqui) ... por este código:
    @PostMapping
    public ResponseEntity<Reserva> solicitarReserva(
            @RequestBody ReservaDTO dto, 
            @RequestHeader("Usuario-Id") Long usuarioId) {
        
        Reserva novaReserva = reservaService.criarReserva(dto, usuarioId);
        return ResponseEntity.ok(novaReserva);
    }
    // Rota para listar todas as solicitações recebidas pelo locador

    @GetMapping("/minhas-solicitacoes")
    public ResponseEntity<List<ReservaResponseDTO>> listarMinhasSolicitacoes(@RequestHeader("Usuario-Id") Long usuarioId) {
        List<ReservaResponseDTO> solicitacoes = reservaService.listarSolicitacoesDoLocador(usuarioId);
        return ResponseEntity.ok(solicitacoes);
    }

    // Rota para APROVAR
    @PatchMapping("/{reservaId}/aprovar")
    public ResponseEntity<Reserva> aprovar(@PathVariable Long reservaId, @RequestHeader("Usuario-Id") Long usuarioId) {
        Reserva atualizada = reservaService.aprovarReserva(reservaId, usuarioId);
        return ResponseEntity.ok(atualizada);
    }

    // Rota para REJEITAR
    @PatchMapping("/{reservaId}/rejeitar")
    public ResponseEntity<Reserva> rejeitar(@PathVariable Long reservaId, @RequestHeader("Usuario-Id") Long usuarioId) {
        Reserva atualizada = reservaService.rejeitarReserva(reservaId, usuarioId);
        return ResponseEntity.ok(atualizada);
    }
}