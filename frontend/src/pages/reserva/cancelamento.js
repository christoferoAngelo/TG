const PRAZO_PADRAO = 2;

function hhmm(hora) {
    if (!hora) return "";
    if (Array.isArray(hora)) {
        return `${String(hora[0]).padStart(2, "0")}:${String(hora[1] ?? 0).padStart(2, "0")}`;
    }
    return String(hora).slice(0, 5);
}

export function inicioEvento(reserva) {
    const iso = String(reserva?.dataEvento || "");
    const [ano, mes, dia] = iso.split("-").map(Number);
    const texto = hhmm(reserva?.horaInicio) || "00:00";
    const [h, m] = texto.split(":").map(Number);
    return new Date(ano, (mes || 1) - 1, dia || 1, h || 0, m || 0, 0, 0);
}

export function prazoLocador(reserva) {
    const n = Number(reserva?.prazoCancelamentoDias);
    return Number.isInteger(n) && n >= 0 ? n : PRAZO_PADRAO;
}

export function podeCancelarLocatario(reserva) {
    const status = (reserva?.status || "").toUpperCase();
    if (status !== "PENDENTE" && status !== "APROVADA") return false;
    if (!reserva?.dataEvento) return false;
    return new Date() < inicioEvento(reserva);
}

export function podeCancelarLocador(reserva) {
    if ((reserva?.status || "").toUpperCase() !== "APROVADA") return false;
    if (!reserva?.dataEvento) return false;
    const limite = new Date(inicioEvento(reserva).getTime() - prazoLocador(reserva) * 86400000);
    return new Date() < limite;
}

export function avisoPrazoLocador(reserva) {
    if ((reserva?.status || "").toUpperCase() !== "APROVADA" || !reserva?.dataEvento) return "";
    if (new Date() >= inicioEvento(reserva) || podeCancelarLocador(reserva)) return "";
    const prazo = prazoLocador(reserva);
    return prazo === 0
        ? "O prazo para cancelar esta reserva já passou."
        : `O prazo para cancelar já passou: até ${prazo} dia(s) antes do evento.`;
}

export function textoCancelamento(reserva) {
    if ((reserva?.status || "").toUpperCase() !== "CANCELADA") return "";
    const quem = reserva.canceladoPor === "LOCADOR"
        ? "Cancelada pelo locador."
        : reserva.canceladoPor === "LOCATARIO"
            ? "Cancelada pelo locatário."
            : "Cancelada.";
    const condicao = reserva.condicaoReembolso === "TOTAL"
        ? "Reembolso total."
        : reserva.condicaoReembolso === "SEM_REEMBOLSO"
            ? "Sem reembolso automático."
            : reserva.condicaoReembolso === "SEM_COBRANCA"
                ? "Pedido não confirmado, sem cobrança."
                : "";
    return [quem, condicao, "A data voltou a ficar disponível."].filter(Boolean).join(" ");
}
