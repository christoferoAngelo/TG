import { auth } from "../../config/firebaseConfig";
import { gravarFavoritos, lerFavoritos } from "../home/explorar/explorar";

const API = "http://localhost:8080/api/favoritos";

const SESSAO = "Sessão expirada. Por favor, inicie sessão novamente.";
const SEM_PERMISSAO = "Sem permissão para realizar esta ação.";

async function obterToken(forcarRenovacao = false) {
    if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
    }
    const usuario = auth.currentUser;
    if (!usuario) {
        throw new Error(SESSAO);
    }
    return usuario.getIdToken(forcarRenovacao);
}

async function cabecalhos(usuarioId, json, forcarRenovacao = false) {
    const token = await obterToken(forcarRenovacao);
    const headers = {
        Authorization: `Bearer ${token}`,
        "Usuario-Id": String(usuarioId),
    };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
}

function textoUtil(valor) {
    if (typeof valor !== "string") return "";
    const limpo = valor.trim();
    if (!limpo || limpo.startsWith("{") || limpo.startsWith("[")) return "";
    if (/^(forbidden|access denied|unauthorized)$/i.test(limpo)) return "";
    return limpo;
}

async function lerErro(res, fallback) {
    const texto = await res.text();
    let dados = null;
    try {
        dados = JSON.parse(texto);
    } catch {
        dados = null;
    }

    if (res.status === 401) return SESSAO;
    if (res.status === 403) {
        const especifica = textoUtil(dados?.message);
        return especifica || SEM_PERMISSAO;
    }
    if (res.status === 404) {
        const especifica = textoUtil(dados?.message);
        if (/encontrad/i.test(especifica)) return especifica;
        return "As listas ainda não estão ativas. Reinicie a API e tente de novo.";
    }

    return textoUtil(dados?.message) || textoUtil(dados?.erro) || textoUtil(texto) || fallback;
}

async function pedir(url, { method = "GET", body } = {}, usuarioId, fallback, renovar = false) {
    const res = await fetch(url, {
        method,
        headers: await cabecalhos(usuarioId, body != null, renovar),
        body: body != null ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !renovar) {
        return pedir(url, { method, body }, usuarioId, fallback, true);
    }
    if (!res.ok) {
        throw new Error(await lerErro(res, fallback));
    }
    if (res.status === 204) return null;
    return res.json();
}

export function contemEspaco(lista, espacoId) {
    return (lista?.espacoIds || []).some((id) => Number(id) === Number(espacoId));
}

export function espacoSalvo(listas, espacoId) {
    return (listas || []).some((lista) => contemEspaco(lista, espacoId));
}

export async function carregarListas(usuarioId) {
    const listas = await pedir(API, {}, usuarioId, "Não foi possível carregar suas listas.");
    if (!Array.isArray(listas)) return [];
    if (listas.length > 0) return listas;

    const antigos = lerFavoritos().map(Number).filter((id) => id > 0);
    if (!antigos.length) return [];

    const criada = await criarLista(usuarioId, "Favoritos");
    let atual = criada;
    for (const id of antigos) {
        try {
            atual = await adicionarEspaco(usuarioId, atual.id, id);
        } catch {
            /* espaço que não existe mais fica de fora da lista */
        }
    }
    gravarFavoritos([]);
    return [atual];
}

export function criarLista(usuarioId, nome, espacoId) {
    return pedir(
        API,
        { method: "POST", body: { nome, espacoId: espacoId ?? null } },
        usuarioId,
        "Não foi possível criar a lista."
    );
}

export function renomearLista(usuarioId, listaId, nome) {
    return pedir(
        `${API}/${listaId}`,
        { method: "PATCH", body: { nome } },
        usuarioId,
        "Não foi possível renomear a lista."
    );
}

export function excluirLista(usuarioId, listaId) {
    return pedir(
        `${API}/${listaId}`,
        { method: "DELETE" },
        usuarioId,
        "Não foi possível apagar a lista."
    );
}

export function adicionarEspaco(usuarioId, listaId, espacoId) {
    return pedir(
        `${API}/${listaId}/espacos/${espacoId}`,
        { method: "POST" },
        usuarioId,
        "Não foi possível salvar o espaço."
    );
}

export function removerEspaco(usuarioId, listaId, espacoId) {
    return pedir(
        `${API}/${listaId}/espacos/${espacoId}`,
        { method: "DELETE" },
        usuarioId,
        "Não foi possível tirar o espaço da lista."
    );
}
