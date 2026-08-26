package com.eva.locafesta.reserva;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    
    boolean existsByEspacoIdAndDataEventoAndStatusNot(Long espacoId, LocalDate dataEvento, String status);

    // Mágica do Spring Data: Busca reservas onde o ID do Locador do Espaço seja igual ao passado
    List<Reserva> findByEspacoLocadorUsuarioId(Long usuarioId);
}