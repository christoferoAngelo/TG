
package com.eva.locafesta.espaco;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EspacoRepository extends JpaRepository<Espaco, Long> {

    // Espaços de um locador
    List<Espaco> findByLocadorId(Long locadorId);

    // Espaços por status de aprovação
    List<Espaco> findByStatusAprovacao(String statusAprovacao);

    long countByStatusAprovacao(String statusAprovacao);

    // Espaços ativos e aprovados para exibição pública
    List<Espaco> findByAtivoTrueAndStatusAprovacao(
        String statusAprovacao
    );

    // Pesquisa por título, cidade ou descrição
    @Query("""
        SELECT e FROM Espaco e
        LEFT JOIN e.endereco endereco
        WHERE (
            LOWER(e.titulo) LIKE LOWER(CONCAT('%', :termo, '%'))
            OR LOWER(endereco.cidade)
                LIKE LOWER(CONCAT('%', :termo, '%'))
            OR LOWER(e.descricao)
                LIKE LOWER(CONCAT('%', :termo, '%'))
        )
        AND e.ativo = true
        AND e.statusAprovacao = 'APROVADO'
        """)
    List<Espaco> buscarPorTermoMultiplo(
        @Param("termo") String termo
    );

    // Busca e bloqueia o espaço durante uma operação de reserva.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Espaco e WHERE e.id = :id")
    Optional<Espaco> buscarParaReserva(@Param("id") Long id);
}
