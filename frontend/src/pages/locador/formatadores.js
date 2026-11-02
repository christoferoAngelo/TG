export const formatarData = (valor) => {
    if (!valor) return "—";
    if (Array.isArray(valor)) {
        const [a, m, d] = valor;
        return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
};

export const formatarMoeda = (v) =>
    Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatarHora = (hora) => {
    if (!hora) return "";
    if (Array.isArray(hora)) {
        return `${String(hora[0]).padStart(2, "0")}:${String(hora[1] ?? 0).padStart(2, "0")}`;
    }
    return String(hora).slice(0, 5);
};

export const statusDe = (s) => (s || "").toUpperCase();
