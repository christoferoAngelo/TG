package com.eva.locafesta.caracteristica;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaracteristicaRepository extends JpaRepository<Caracteristica, Long> {
    // Verifica se já existe uma característica cadastrada com exatamente o mesmo nome
    boolean existsByNomeIgnoreCase(String nome);
}