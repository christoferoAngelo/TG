/** Converte "HH:MM" em minutos desde a meia-noite. */
export function paraMinutos(hora) {
    if (!hora || !hora.includes(":")) return null;
    const [h, m] = hora.split(":").map(Number);
    if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
    return h * 60 + m;
}

/** 600 → "10h", 630 → "10h30". Passa da meia-noite sem estourar o relógio. */
export function formatarMinutos(total) {
    const dia = ((total % 1440) + 1440) % 1440;
    const h = Math.floor(dia / 60);
    const m = dia % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/**
 * Encaixa turnos em sequência: cada um dura a duração do evento e o
 * próximo só começa depois do intervalo de limpeza.
 */
export function calcularTurnos({ abertura, fechamento, duracaoHoras, limpezaMin }) {
    const avisos = [];
    const duracao = Number(duracaoHoras);
    const limpeza = Number(limpezaMin);

    if (!abertura || !fechamento || !(duracao > 0) || !Number.isInteger(limpeza) || limpeza < 0) {
        return { turnos: [], avisos };
    }

    if (duracao <= 1) {
        avisos.push({
            tipo: "curta",
            nivel: "erro",
            mensagem: "Duração muito curta, isso pode afastar potenciais clientes.",
        });
    }

    const abre = paraMinutos(abertura);
    let fecha = paraMinutos(fechamento);
    if (abre == null || fecha == null) return { turnos: [], avisos };
    if (fecha <= abre) fecha += 1440;

    const durMin = Math.round(duracao * 60);
    const turnos = [];
    let cursor = abre;

    while (cursor + durMin <= fecha && turnos.length < 24) {
        const fim = cursor + durMin;
        const inicioRotulo = formatarMinutos(cursor);
        const fimRotulo = formatarMinutos(fim);
        turnos.push({
            chave: `${inicioRotulo}–${fimRotulo}`,
            numero: turnos.length + 1,
            inicio: inicioRotulo,
            fim: fimRotulo,
            fimMin: fim,
        });
        cursor = fim + limpeza;
    }

    if (turnos.length > 0) {
        const restante = fecha - turnos[turnos.length - 1].fimMin;
        if (restante > 0 && restante < durMin) {
            avisos.push({
                tipo: "ocioso",
                nivel: "aviso",
                mensagem: "Aviso: Restará tempo ocioso na sua agenda que não forma um novo turno.",
            });
        }
    }

    if (turnos.length === 1) {
        avisos.push({
            tipo: "unico",
            nivel: "aviso",
            mensagem: "Aviso: Suas configurações de horário geram apenas um turno.",
        });
    }

    return { turnos, avisos };
}
