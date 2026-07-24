package com.eva.locafesta.espaco;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EspacoRepository extends JpaRepository<Espaco, Long> {

    List<Espaco> findByLocadorId(Long locadorId);

    long countByStatusAprovacao(String statusAprovacao);
}