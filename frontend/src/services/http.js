import { auth } from "../config/firebaseConfig";

export const CODIGO_TERMOS_NAO_ACEITOS = "TERMOS_NAO_ACEITOS";

/**
 * Interpreta 403 TERMOS_NAO_ACEITOS e redireciona para /aceitar-termos.
 * Retorna true se redirecionou.
 */
export function redirecionarSeTermosPendentes(payload, voltar) {
    if (!payload || payload.codigo !== CODIGO_TERMOS_NAO_ACEITOS) {
        return false;
    }
    const destino = voltar || `${window.location.pathname}${window.location.search}`;
    const url = `/aceitar-termos?voltar=${encodeURIComponent(destino)}`;
    if (!window.location.pathname.startsWith("/aceitar-termos")) {
        window.location.assign(url);
    }
    return true;
}

export async function parseJsonSeguro(response) {
    const texto = await response.text();
    if (!texto) return null;
    try {
        return JSON.parse(texto);
    } catch {
        return { erro: texto };
    }
}

/** fetch com Bearer Firebase + tratamento do gate de Termos. */
export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    const user = auth.currentUser;
    if (user && !headers.has("Authorization")) {
        const token = await user.getIdToken();
        headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 403) {
        const corpo = await parseJsonSeguro(response.clone());
        if (redirecionarSeTermosPendentes(corpo)) {
            const err = new Error(corpo?.erro || "Aceite os Termos de Uso para continuar.");
            err.codigo = CODIGO_TERMOS_NAO_ACEITOS;
            err.response = corpo;
            throw err;
        }
    }
    return response;
}
