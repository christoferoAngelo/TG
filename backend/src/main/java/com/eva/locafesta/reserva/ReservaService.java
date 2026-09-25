package com.eva.locafesta.reserva;

import com.eva.locafesta.espaco.Espaco;
import com.eva.locafesta.espaco.EspacoRepository;
import com.eva.locafesta.usuario.Usuario;
import com.eva.locafesta.usuario.UsuarioRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
        return reservas.stream().map(this::mapearParaResponseDTO).toList();
    }

    // Listar as próprias reservas do locatário
    public List<ReservaResponseDTO> listarMinhasReservas(Long usuarioId) {
        List<Reserva> reservas = reservaRepository.findByLocatarioIdOrderByDataEventoDesc(usuarioId);
        return reservas.stream().map(this::mapearParaResponseDTO).toList();
    }

    // Listar as avaliações públicas de um espaço (para a página de detalhes)
    public List<AvaliacaoResponseDTO> listarAvaliacoesDoEspaco(Long espacoId) {
        List<Reserva> reservas = reservaRepository.findByEspacoIdAndNotaIsNotNullOrderByDataAvaliacaoDesc(espacoId);

        return reservas.stream().map(reserva -> new AvaliacaoResponseDTO(
                primeiroNome(reserva.getLocatario().getNome()),
                reserva.getNota(),
                reserva.getComentarioAvaliacao(),
                reserva.getDataAvaliacao()
        )).toList();
    }

    // Evita expor o nome completo do locatário na página pública do espaço
    private String primeiroNome(String nomeCompleto) {
        if (nomeCompleto == null || nomeCompleto.isBlank()) return "Cliente";
        return nomeCompleto.trim().split("\\s+")[0];
    }

    private ReservaResponseDTO mapearParaResponseDTO(Reserva reserva) {
        return new ReservaResponseDTO(
                reserva.getId(),
                new ReservaResponseDTO.EspacoResumoDTO(
                        reserva.getEspaco().getId(),
                        reserva.getEspaco().getTitulo()
                ),
                reserva.getDataEvento(),
                reserva.getValorTotal(),
                reserva.getStatus(),
                reserva.getNota(),
                reserva.getComentarioAvaliacao()
        );
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

    // Avaliar uma reserva já concluída (feito pelo locatário)
    public Reserva avaliarReserva(Long reservaId, Long usuarioId, AvaliacaoDTO dto) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva não encontrada"));

        if (!reserva.getLocatario().getId().equals(usuarioId)) {
            throw new RuntimeException("Acesso negado: você não é o locatário desta reserva.");
        }

        if (!"APROVADA".equals(reserva.getStatus())) {
            throw new RuntimeException("Só é possível avaliar reservas aprovadas.");
        }

        if (reserva.getDataEvento().isAfter(LocalDate.now())) {
            throw new RuntimeException("O evento ainda não aconteceu.");
        }

        if (reserva.getNota() != null) {
            throw new RuntimeException("Esta reserva já foi avaliada.");
        }

        if (dto.nota() == null || dto.nota() < 1 || dto.nota() > 5) {
            throw new RuntimeException("A nota deve ser um número entre 1 e 5.");
        }

        reserva.setNota(dto.nota());
        reserva.setComentarioAvaliacao(dto.comentario());
        reserva.setDataAvaliacao(LocalDateTime.now());
        Reserva reservaSalva = reservaRepository.save(reserva);

        atualizarNotaDoEspaco(reserva.getEspaco().getId());
        atualizarNotaGeralDoLocador(reserva.getEspaco().getLocador().getUsuario().getId());

        return reservaSalva;
    }

    // Recalcula a média e a quantidade de avaliações do espaço avaliado
    private void atualizarNotaDoEspaco(Long espacoId) {
        Double media = reservaRepository.calcularMediaNotaPorEspaco(espacoId);
        long quantidade = reservaRepository.countByEspacoIdAndNotaIsNotNull(espacoId);

        Espaco espaco = espacoRepository.findById(espacoId)
                .orElseThrow(() -> new RuntimeException("Espaço não encontrado"));

        espaco.setNotaMedia(media);
        espaco.setQuantidadeAvaliacoes((int) quantidade);
        espacoRepository.save(espaco);
    }

    // Recalcula a média de notas do locador e atualiza o campo nota_geral do usuário
    private void atualizarNotaGeralDoLocador(Long locadorUsuarioId) {
        Double media = reservaRepository.calcularMediaNotaPorLocador(locadorUsuarioId);

        Usuario usuario = usuarioRepository.findById(locadorUsuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        usuario.setNota(media != null ? (int) Math.round(media) : 0);
        usuarioRepository.save(usuario);
    }
}