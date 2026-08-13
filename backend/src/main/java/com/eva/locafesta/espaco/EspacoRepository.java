package com.eva.locafesta.espaco;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EspacoRepository extends JpaRepository<Espaco, Long> {

    List<Espaco> findByLocadorId(Long locadorId);
    List<Espaco> findByStatusAprovacao(String statusAprovacao);
    long countByStatusAprovacao(String statusAprovacao);
    @Query("SELECT e FROM Espaco e WHERE " +
            "LOWER(e.titulo) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(e.endereco.cidade) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(e.descricao) LIKE LOWER(CONCAT('%', :termo, '%'))")
     List<Espaco> buscarPorTermoMultiplo(@Param("termo") String termo);
}