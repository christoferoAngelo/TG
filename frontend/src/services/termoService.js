import { auth } from "../config/firebaseConfig";
import {
    guardarTermosAceitosIds,
    lerTermosAceitosIds,
    limparTermosAceitosIds,
} from "../components/apresentacao/termos";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function tokenAuth(forcar = false) {
    const usuario = auth.currentUser;
    if (!usuario) return null;
    return usuario.getIdToken(forcar);
}

async function headersAuth() {
    const token = await tokenAuth();
    if (!token) throw new Error("Faça login para continuar.");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

async function lerJson(response) {
    const texto = await response.text();
    if (!response.ok) {
        let msg = texto || `Erro HTTP ${response.status}`;
        try {
            const j = JSON.parse(texto);
            msg = j.erro || j.message || msg;
        } catch {
            /* texto puro */
        }
        throw new Error(msg);
    }
    if (!texto) return null;
    return JSON.parse(texto);
}

export const termoService = {
    async vigente(tipo) {
        const response = await fetch(`${API_BASE_URL}/api/termos/${tipo}/vigente`);
        return lerJson(response);
    },

    async pendente() {
        const headers = await headersAuth();
        const response = await fetch(`${API_BASE_URL}/api/termos/pendente`, { headers });
        return lerJson(response);
    },

    async aceitar(termoIds) {
        const headers = await headersAuth();
        const body = Array.isArray(termoIds) && termoIds.length
            ? JSON.stringify({ termoIds })
            : JSON.stringify({});
        const response = await fetch(`${API_BASE_URL}/api/termos/aceitar`, {
            method: "POST",
            headers,
            body,
        });
        return lerJson(response);
    },

    async listarAdmin(tipo) {
        const headers = await headersAuth();
        const response = await fetch(
            `${API_BASE_URL}/api/admin/termos?tipo=${encodeURIComponent(tipo)}`,
            { headers }
        );
        return lerJson(response);
    },

    async detalheAdmin(id) {
        const headers = await headersAuth();
        const response = await fetch(`${API_BASE_URL}/api/admin/termos/${id}`, { headers });
        return lerJson(response);
    },

    async criarRascunho({ tipo, titulo, conteudo }) {
        const headers = await headersAuth();
        const response = await fetch(`${API_BASE_URL}/api/admin/termos`, {
            method: "POST",
            headers,
            body: JSON.stringify({ tipo, titulo, conteudo }),
        });
        return lerJson(response);
    },

    async atualizarRascunho(id, { titulo, conteudo }) {
        const headers = await headersAuth();
        const response = await fetch(`${API_BASE_URL}/api/admin/termos/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ titulo, conteudo }),
        });
        return lerJson(response);
    },

    async publicar(id) {
        const headers = await headersAuth();
        const response = await fetch(`${API_BASE_URL}/api/admin/termos/${id}/publicar`, {
            method: "POST",
            headers,
        });
        return lerJson(response);
    },
};

/** Persiste no localStorage e, se houver sessão Firebase, grava em aceites_termos. */
export async function registrarAceiteTermos(termoIds) {
    const ids = [...new Set((termoIds || []).map(Number).filter((id) => id > 0))];
    if (ids.length) {
        guardarTermosAceitosIds(ids);
    }
    if (!auth.currentUser) {
        return { gravadoNoBanco: false, ids };
    }
    await termoService.aceitar(ids);
    limparTermosAceitosIds();
    return { gravadoNoBanco: true, ids };
}

/** Após login/cadastro: envia IDs guardados no localStorage para o backend. */
export async function sincronizarAceitesPendentesDoStorage() {
    const ids = lerTermosAceitosIds();
    if (!ids.length || !auth.currentUser) {
        return false;
    }
    try {
        await termoService.aceitar(ids);
        limparTermosAceitosIds();
        return true;
    } catch (e) {
        console.error("Falha ao sincronizar aceite de termos:", e);
        return false;
    }
}
