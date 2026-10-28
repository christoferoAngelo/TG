package com.eva.locafesta.core;

import com.eva.locafesta.caracteristica.Caracteristica;
import com.eva.locafesta.caracteristica.CaracteristicaRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
public class CaracteristicaInicializador implements ApplicationRunner {

    private record Semente(String nome, String icone) {}

    private static final List<Semente> PADRAO = List.of(
            new Semente("Piscina", "/icones/caracteristicas/piscina.png"),
            new Semente("Churrasqueira", "/icones/caracteristicas/churrasqueira.png"),
            new Semente("Buffet", "/icones/caracteristicas/buffet.png"),
            new Semente("Palco", "/icones/caracteristicas/palco.png"),
            new Semente("Permitido pets", "/icones/caracteristicas/pets.png"),
            new Semente("Estrutura para show", "/icones/caracteristicas/show.png"),
            new Semente("Decoração", "/icones/caracteristicas/decoracao.png")
    );

    private final CaracteristicaRepository repository;

    public CaracteristicaInicializador(CaracteristicaRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (Semente item : PADRAO) {
            if (repository.existsByNomeIgnoreCase(item.nome())) {
                continue;
            }
            Caracteristica caracteristica = new Caracteristica();
            caracteristica.setNome(item.nome());
            caracteristica.setIcone(item.icone());
            repository.save(caracteristica);
        }
    }
}
