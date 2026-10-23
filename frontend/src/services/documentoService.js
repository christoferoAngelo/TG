import { getAuth } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * =========================================================
 * TOKEN
 * O backend valida um ID token do Firebase em /documentos/**.
 * O token vem SEMPRE do Firebase (renovado automaticamente quando perto de
 * expirar). Ler de localStorage.getItem("token") enviava "Bearer null" ou um
 * token vencido, que é o que gerava "Failed to parse Firebase ID token".
 * =========================================================
 */
async function obterToken(forcarRenovacao = false) {
    const auth = getAuth();

    // Espera o Firebase terminar de restaurar a sessão (evita currentUser nulo logo após o F5)
    if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
    }

    const usuario = auth.currentUser;
    if (!usuario) {
        throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }

    return usuario.getIdToken(forcarRenovacao);
}

// Extrai uma mensagem legível, venha o erro como JSON do filtro/Spring ou como texto puro
async function lerMensagemDeErro(resposta, padrao) {
    const texto = await resposta.text();
    if (!texto) return padrao;

    try {
        const dados = JSON.parse(texto);
        return dados.detalhe || dados.message || dados.erro || padrao;
    } catch {
        return texto;
    }
}

async function requisitar(caminho, { method = "GET", body } = {}, mensagemPadrao, primeiraTentativa = true) {
    const token = await obterToken(!primeiraTentativa);

    const response = await fetch(`${API_URL}/documentos${caminho}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    // O token pode ter vencido entre a leitura e o envio: renova uma vez e tenta de novo
    if (response.status === 401 && primeiraTentativa) {
        return requisitar(caminho, { method, body }, mensagemPadrao, false);
    }

    if (!response.ok) {
        throw new Error(await lerMensagemDeErro(response, mensagemPadrao));
    }

    return response.json();
}


/**
 * =========================================================
 * CLOUDINARY (não precisa de token)
 * =========================================================
 */
export async function uploadDocumentoCloudinary(arquivo) {
    if (!arquivo) {
        throw new Error("Nenhum arquivo foi selecionado.");
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Configuração do Cloudinary não encontrada.");
    }

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
        console.error("Resposta Cloudinary:", data);
        throw new Error(
            data?.error?.message || "Não foi possível enviar o arquivo para o Cloudinary."
        );
    }

    return {
        url: data.secure_url,
        publicId: data.public_id,
        nomeArquivo: arquivo.name
    };
}


/**
 * =========================================================
 * DOCUMENTOS DO USUÁRIO
 * =========================================================
 */
export const criarDocumentoUsuario = (usuarioId, documento) =>
    requisitar(`/usuario/${usuarioId}`, { method: "POST", body: documento }, "Erro ao cadastrar documento do usuário.");

export const listarDocumentosUsuario = (usuarioId) =>
    requisitar(`/usuario/${usuarioId}`, {}, "Erro ao buscar documentos do usuário.");


/**
 * =========================================================
 * DOCUMENTOS DO ESPAÇO
 * =========================================================
 */
export const criarDocumentoEspaco = (espacoId, documento) =>
    requisitar(`/espaco/${espacoId}`, { method: "POST", body: documento }, "Erro ao cadastrar documento do espaço.");

export const listarDocumentosEspaco = (espacoId) =>
    requisitar(`/espaco/${espacoId}`, {}, "Erro ao buscar documentos do espaço.");


/**
 * =========================================================
 * DOCUMENTO POR ID
 * =========================================================
 */
export const buscarDocumento = (id) =>
    requisitar(`/${id}`, {}, "Erro ao buscar documento.");


/**
 * =========================================================
 * ADMIN
 * =========================================================
 */
export const listarDocumentosPendentes = () =>
    requisitar("/admin/pendentes", {}, "Erro ao buscar documentos pendentes.");

export const aprovarDocumento = (id) =>
    requisitar(`/admin/${id}/aprovar`, { method: "PUT" }, "Erro ao aprovar documento.");

export const rejeitarDocumento = (id, motivo) =>
    requisitar(`/admin/${id}/rejeitar?${new URLSearchParams({ motivo })}`, { method: "PUT" }, "Erro ao rejeitar documento.");

export const solicitarCorrecao = (id, motivo) =>
    requisitar(`/admin/${id}/correcao?${new URLSearchParams({ motivo })}`, { method: "PUT" }, "Erro ao solicitar correção.");
