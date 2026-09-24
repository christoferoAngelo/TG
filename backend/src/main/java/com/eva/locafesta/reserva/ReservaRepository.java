package com.eva.locafesta.reserva;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    
    boolean existsByEspacoIdAndDataEventoAndStatusNot(Long espacoId, LocalDate dataEvento, String status);

    // Mágica do Spring Data: Busca reservas onde o ID do Locador do Espaço seja igual ao passado
    List<Reserva> findByEspacoLocadorUsuarioId(Long usuarioId);

    // Reservas feitas pelo próprio locatário, mais recentes primeiro
    List<Reserva> findByLocatarioIdOrderByDataEventoDesc(Long locatarioId);

    // Média das notas de todas as reservas avaliadas dos espaços de um locador
    @Query("SELECT AVG(r.nota) FROM Reserva r " +
           "WHERE r.espaco.locador.usuario.id = :locadorUsuarioId AND r.nota IS NOT NULL")
    Double calcularMediaNotaPorLocador(@Param("locadorUsuarioId") Long locadorUsuarioId);

    // Média e quantidade das avaliações de um espaço específico
    @Query("SELECT AVG(r.nota) FROM Reserva r WHERE r.espaco.id = :espacoId AND r.nota IS NOT NULL")
    Double calcularMediaNotaPorEspaco(@Param("espacoId") Long espacoId);

    long countByEspacoIdAndNotaIsNotNull(Long espacoId);
}