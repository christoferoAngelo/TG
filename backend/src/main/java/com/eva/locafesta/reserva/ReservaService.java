package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final EspacoRepository espacoRepository;
    private final UsuarioRepository usuarioRepository;

    public ReservaService(ReservaRepository reservaRepository, EspacoRepository espacoRepository, UsuarioRepository usuarioRepository) {
        this.reservaRepository = reservaRepository;
        this.espacoRepository = espacoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Substitua o comentário // ... (Mantenha o método criarReserva aqui) ... por este código:
    public Reserva criarReserva(ReservaDTO dto, Long usuarioId) {
        var espaco = espacoRepository.findById(dto.espacoId())
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado"));

        var locatario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Reserva novaReserva = Reserva.builder()
                .espaco(espaco)
                .locatario(locatario)
                .dataEvento(dto.dataEvento())
                .valorTotal(dto.valorTotal())
                .observacao(dto.observacao())
                .status("PENDENTE") // Status padrão
                .build();

        return reservaRepository.save(novaReserva);
    }

   // Listar para o Dashboard do Locador
    public List<ReservaResponseDTO> listarSolicitacoesDoLocador(Long usuarioId) {
        List<Reserva> reservas = reservaRepository.findByEspacoLocadorUsuarioId(usuarioId);
        
        // Converte a lista de entidades para a lista de DTOs seguros
        return reservas.stream().map(reserva -> new ReservaResponseDTO(
                reserva.getId(),
                new ReservaResponseDTO.EspacoResumoDTO(
                        reserva.getEspaco().getId(),
                        reserva.getEspaco().getTitulo()
                ),
                reserva.getDataEvento(),
                reserva.getValorTotal(),
                reserva.getStatus()
        )).toList();
    }

    // Aprovar Reserva
    public Reserva aprovarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        // Proteção: Garante que quem está aprovando é o dono do espaço
        if (!reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: Você não é o dono deste espaço.");
        }

        reserva.setStatus("APROVADA");
        return reservaRepository.save(reserva);
    }

    // Rejeitar Reserva
    public Reserva rejeitarReserva(Long reservaId, Long usuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        if (!reserva.getEspaco().getLocador().getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: Você não é o dono deste espaço.");
        }

        reserva.setStatus("REJEITADA");
        return reservaRepository.save(reserva);
    }
}