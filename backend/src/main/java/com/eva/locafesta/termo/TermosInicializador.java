package com.eva.locafesta.termo;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Garante a versão 1 PUBLICADA de LOCADOR e LOCATARIO.
 * Caso: um único texto TERMOS → as duas audiências começam iguais.
 */
@Component
@Order(3)
public class TermosInicializador implements ApplicationRunner {

    private final TermoUsoRepository termoUsoRepository;

    public TermosInicializador(TermoUsoRepository termoUsoRepository) {
        this.termoUsoRepository = termoUsoRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        LocalDateTime agora = LocalDateTime.now();
        for (TipoTermo tipo : TipoTermo.values()) {
            if (termoUsoRepository.existsByTipoAndStatus(tipo, StatusTermo.PUBLICADO)) {
                continue;
            }
            if (termoUsoRepository.maxVersao(tipo) > 0) {
                continue;
            }
            TermoUso termo = TermoUso.builder()
                    .tipo(tipo)
                    .versao(1)
                    .titulo(TermosTextoSeed.TITULO)
                    .conteudo(TermosTextoSeed.CONTEUDO)
                    .status(StatusTermo.PUBLICADO)
                    .criadoPor(null)
                    .criadoEm(agora)
                    .publicadoEm(agora)
                    .build();
            termoUsoRepository.save(termo);
        }
    }
}
