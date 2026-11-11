const CHAVE = "locafesta-tema";

export function preferenciaSistema() {
    if (typeof window === "undefined" || !window.matchMedia) return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function temaSalvo() {
    try {
        const valor = localStorage.getItem(CHAVE);
        if (valor === "dark" || valor === "light") return valor;
    } catch {
        /* ignore */
    }
    return null;
}

export function temaAtual() {
    return temaSalvo() || preferenciaSistema();
}

export function aplicarTema(tema) {
    const valor = tema === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-tema", valor);
    document.documentElement.style.colorScheme = valor;
    try {
        localStorage.setItem(CHAVE, valor);
    } catch {
        /* ignore */
    }
    window.dispatchEvent(new CustomEvent("locafesta-tema", { detail: valor }));
    return valor;
}

export function alternarTema() {
    return aplicarTema(temaAtual() === "dark" ? "light" : "dark");
}

export function iniciarTema() {
    aplicarTema(temaAtual());
}
