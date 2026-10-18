package com.eva.locafesta.reserva;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Regras puras de agenda de um espaço (sem Spring/JPA, fácil de testar).
 * Todas as contas são feitas em minutos do dia para evitar o "wrap" do
 * LocalTime.plusMinutes() na virada da meia-noite.
 */
public final class AgendaEspaco {

    private AgendaEspaco() {}

    public enum Modalidade { MEIO_PERIODO, INTEGRAL, PERSONALIZADO }

    public record Intervalo(LocalTime inicio, LocalTime fim) {
        int ini() { return inicio.toSecondOfDay() / 60; }
        int end() { return fim.toSecondOfDay() / 60; }
    }

    public record Regras(
            LocalTime abertura,
            LocalTime fechamento,
            boolean meioPeriodo,
            boolean integral,
            boolean personalizado,
            BigDecimal duracaoMaxHoras,
            int limpezaMin) {}

    public record Periodo(Modalidade modalidade, Integer numero, Intervalo intervalo) {}

    private static LocalTime hora(int minutos) {
        return LocalTime.of(minutos / 60, minutos % 60);
    }

    private static int duracaoMaxMin(Regras r) {
        return r.duracaoMaxHoras()
                .multiply(BigDecimal.valueOf(60))
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    /**
     * Períodos que o espaço oferece, derivados das regras:
     * 1º período = começa na abertura e dura a duração máxima;
     * 2º período = termina no fechamento e dura a duração máxima
     * (só é oferecido se couber depois do 1º + limpeza);
     * integral = abertura até fechamento.
     */
    public static List<Periodo> periodosOferecidos(Regras r) {
        List<Periodo> out = new ArrayList<>();
        int a = r.abertura().toSecondOfDay() / 60;
        int f = r.fechamento().toSecondOfDay() / 60;

        if (r.meioPeriodo() && r.duracaoMaxHoras() != null) {
            int d = duracaoMaxMin(r);
            if (d > 0 && d <= f - a) {
                out.add(new Periodo(Modalidade.MEIO_PERIODO, 1,
                        new Intervalo(hora(a), hora(a + d))));
                if (a + d + r.limpezaMin() <= f - d) {
                    out.add(new Periodo(Modalidade.MEIO_PERIODO, 2,
                            new Intervalo(hora(f - d), hora(f))));
                }
            }
        }
        if (r.integral()) {
            out.add(new Periodo(Modalidade.INTEGRAL, null,
                    new Intervalo(r.abertura(), r.fechamento())));
        }
        return out;
    }

    /** Retorna a mensagem de erro, ou null se o horário personalizado é válido. */
    public static String validarPersonalizado(Regras r, Intervalo i) {
        if (!r.personalizado()) {
            return "Este espaço não aceita horário personalizado.";
        }
        if (i.inicio() == null || i.fim() == null) {
            return "Informe o horário de início e de fim.";
        }
        if (i.end() <= i.ini()) {
            return "O horário de fim deve ser depois do início.";
        }
        if (i.ini() < r.abertura().toSecondOfDay() / 60
                || i.end() > r.fechamento().toSecondOfDay() / 60) {
            return "O horário precisa estar dentro do funcionamento do espaço ("
                    + r.abertura() + " às " + r.fechamento() + ").";
        }
        if (r.duracaoMaxHoras() != null && i.end() - i.ini() > duracaoMaxMin(r)) {
            return "A duração máxima permitida é de " + r.duracaoMaxHoras().stripTrailingZeros().toPlainString() + " horas.";
        }
        return null;
    }

    /**
     * Há conflito se os intervalos se sobrepõem considerando o tempo de
     * limpeza entre eventos. Encostar exatamente (fim == início) sem limpeza
     * NÃO é conflito.
     */
    public static boolean conflita(Intervalo novo, Intervalo existente, int limpezaMin) {
        return existente.ini() < novo.end() + limpezaMin
                && existente.end() + limpezaMin > novo.ini();
    }
}
