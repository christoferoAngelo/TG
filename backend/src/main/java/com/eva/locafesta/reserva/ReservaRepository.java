package com.eva.locafesta.reserva;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    
    boolean existsByEspacoIdAndDataEventoAndStatusNot(Long espacoId, LocalDate dataEvento, String status);

    // Reservas de um espaço numa data, nos status informados (usado para achar os horários ocupados)
    List<Reserva> findByEspacoIdAndDataEventoAndStatusIn(Long espacoId, LocalDate dataEvento, Collection<String> status);

    List<Reserva> findByDataEventoAndStatusIn(LocalDate dataEvento, Collection<String> status);

    // Mágica do Spring Data: Busca reservas onde o ID do Locador do Espaço seja igual ao passado
    List<Reserva> findByEspacoLocadorUsuarioIdOrderByIdAsc(Long usuarioId);

    /**
     * Reservas do locador no intervalo de data do evento.
     * Filtra no banco (locador + período + espaço opcional) antes da agregação em memória.
     */
    @Query("""
            SELECT DISTINCT r FROM Reserva r
            JOIN FETCH r.espaco e
            LEFT JOIN FETCH r.locatario
            WHERE e.locador.usuario.id = :usuarioId
              AND r.dataEvento BETWEEN :de AND :ate
              AND (:espacoId IS NULL OR e.id = :espacoId)
            ORDER BY r.dataEvento DESC, r.id DESC
            """)
    List<Reserva> findByLocadorPeriodoEEspaco(
            @Param("usuarioId") Long usuarioId,
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate,
            @Param("espacoId") Long espacoId
    );

    /**
     * A receber: aprovadas com pagamento ainda não liberado (inclui eventos futuros).
     * Não corta pela data final do filtro de faturamento.
     */
    @Query("""
            SELECT DISTINCT r FROM Reserva r
            JOIN FETCH r.espaco e
            LEFT JOIN FETCH r.locatario
            WHERE e.locador.usuario.id = :usuarioId
              AND UPPER(r.status) = 'APROVADA'
              AND r.pagamentoLiberado = false
              AND (:espacoId IS NULL OR e.id = :espacoId)
            ORDER BY r.dataEvento ASC, r.id ASC
            """)
    List<Reserva> findAReceberPorLocadorEEspaco(
            @Param("usuarioId") Long usuarioId,
            @Param("espacoId") Long espacoId
    );

    // Reservas feitas pelo próprio locatário, mais recentes primeiro
    List<Reserva> findByLocatarioIdOrderByDataEventoDesc(Long locatarioId);

    // Avaliações públicas de um espaço, mais recentes primeiro
    List<Reserva> findByEspacoIdAndNotaIsNotNullOrderByDataAvaliacaoDesc(Long espacoId);

    // Média das notas de todas as reservas avaliadas dos espaços de um locador
    @Query("SELECT AVG(r.nota) FROM Reserva r " +
           "WHERE r.espaco.locador.usuario.id = :locadorUsuarioId AND r.nota IS NOT NULL")
    Double calcularMediaNotaPorLocador(@Param("locadorUsuarioId") Long locadorUsuarioId);

    // Média e quantidade das avaliações de um espaço específico
    @Query("SELECT AVG(r.nota) FROM Reserva r WHERE r.espaco.id = :espacoId AND r.nota IS NOT NULL")
    Double calcularMediaNotaPorEspaco(@Param("espacoId") Long espacoId);

    long countByEspacoIdAndNotaIsNotNull(Long espacoId);

    boolean existsByObservacaoStartingWith(String prefix);
}
