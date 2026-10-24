package com.eva.locafesta.reserva;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    // Devolve a mensagem de erro (400/404/409...) no corpo da resposta, como o EspacoController faz
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> tratarErroDeNegocio(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }

    @PostMapping
    public ResponseEntity<ReservaResponseDTO> solicitarReserva(
            @RequestBody ReservaDTO dto, 
            @RequestHeader("Usuario-Id") Long usuarioId) {
        
        return ResponseEntity.ok(reservaService.criarReserva(dto, usuarioId));
    }

    // Rota pública: períodos e horários livres/ocupados de um espaço numa data
    // GET /api/reservas/espaco/{espacoId}/disponibilidade?data=2026-11-20
    @GetMapping("/espaco/{espacoId}/disponibilidade")
    public ResponseEntity<DisponibilidadeDTO> disponibilidade(
            @PathVariable Long espacoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(reservaService.consultarDisponibilidade(espacoId, data));
    }

    // Rota para listar todas as solicitações recebidas pelo locador
    @GetMapping("/minhas-solicitacoes")
    public ResponseEntity<List<ReservaResponseDTO>> listarMinhasSolicitacoes(@RequestHeader("Usuario-Id") Long usuarioId) {
        List<ReservaResponseDTO> solicitacoes = reservaService.listarSolicitacoesDoLocador(usuarioId);
        return ResponseEntity.ok(solicitacoes);
    }

    // Rota para o locatário ver as próprias reservas
    @GetMapping("/minhas-reservas")
    public ResponseEntity<List<ReservaResponseDTO>> listarMinhasReservas(@RequestHeader("Usuario-Id") Long usuarioId) {
        List<ReservaResponseDTO> reservas = reservaService.listarMinhasReservas(usuarioId);
        return ResponseEntity.ok(reservas);
    }

    // Rota pública: avaliações de um espaço, pra exibir na página de detalhes
    @GetMapping("/espaco/{espacoId}/avaliacoes")
    public ResponseEntity<List<AvaliacaoResponseDTO>> listarAvaliacoesDoEspaco(@PathVariable Long espacoId) {
        List<AvaliacaoResponseDTO> avaliacoes = reservaService.listarAvaliacoesDoEspaco(espacoId);
        return ResponseEntity.ok(avaliacoes);
    }

    // Rota para APROVAR
    @PatchMapping("/{reservaId}/aprovar")
    public ResponseEntity<ReservaResponseDTO> aprovar(@PathVariable Long reservaId, @RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(reservaService.aprovarReserva(reservaId, usuarioId));
    }

    // Rota para REJEITAR
    @PatchMapping("/{reservaId}/rejeitar")
    public ResponseEntity<ReservaResponseDTO> rejeitar(@PathVariable Long reservaId, @RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(reservaService.rejeitarReserva(reservaId, usuarioId));
    }

    // Rota para o locatário CANCELAR um pedido que ainda não começou
    @PatchMapping("/{reservaId}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelar(@PathVariable Long reservaId, @RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(reservaService.cancelarReserva(reservaId, usuarioId));
    }

    @PatchMapping("/{reservaId}/cancelar-locador")
    public ResponseEntity<ReservaResponseDTO> cancelarPeloLocador(
            @PathVariable Long reservaId,
            @RequestHeader("Usuario-Id") Long usuarioId) {
        return ResponseEntity.ok(reservaService.cancelarPeloLocador(reservaId, usuarioId));
    }

    @GetMapping("/indisponiveis")
    public ResponseEntity<List<Long>> indisponiveis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return ResponseEntity.ok(reservaService.espacosSemVaga(data));
    }

    // Rota para o locatário AVALIAR uma reserva já concluída
    @PatchMapping("/{reservaId}/avaliar")
    public ResponseEntity<ReservaResponseDTO> avaliar(
            @PathVariable Long reservaId,
            @RequestBody AvaliacaoDTO dto,
            @RequestHeader("Usuario-Id") Long usuarioId) {

        return ResponseEntity.ok(reservaService.avaliarReserva(reservaId, usuarioId, dto));
    }
}
