package com.eva.locafesta.termo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Texto inicial dos Termos (cópia do frontend {@code termos.js}).
 * Caso encontrado: um único documento; as cláusulas de locador e locatário
 * ainda não estão separadas (só a seção 4 é específica do locador).
 * A v1 de LOCADOR e de LOCATARIO recebe o mesmo texto.
 */
public final class TermosTextoSeed {

    public static final String TITULO = "Termos de Uso e Pol\u00edtica de Privacidade";

    public static final String CONTEUDO = carregar();

    private static String carregar() {
        try (InputStream in = TermosTextoSeed.class.getResourceAsStream("/termos-seed.txt")) {
            if (in == null) {
                throw new IllegalStateException("Recurso /termos-seed.txt não encontrado no classpath.");
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao ler /termos-seed.txt", e);
        }
    }

    private TermosTextoSeed() {}
}
