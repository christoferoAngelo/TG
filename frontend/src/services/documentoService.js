import { getAuth } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * =========================================================
 * CLOUDINARY (Não precisa de Token JWT)
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
export async function criarDocumentoUsuario(usuarioId, documento) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/documentos/usuario/${usuarioId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(documento)
    });

    if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || "Erro ao cadastrar documento do usuário.");
    }

    return response.json();
}

export async function listarDocumentosUsuario(usuarioId) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/documentos/usuario/${usuarioId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao buscar documentos do usuário.");
    }

    return response.json();
}


/**
 * =========================================================
 * DOCUMENTOS DO ESPAÇO
 * =========================================================
 */
export async function criarDocumentoEspaco(espacoId, documento) {
    // Pede para o Firebase quem é o usuário atual
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Você precisa estar logado para enviar um documento.");
    }

    // Pede o token fresquinho e válido direto pro Firebase!
    const token = await user.getIdToken();

    console.log("🕵️ TOKEN SENDO ENVIADO:", token ? "Token capturado com sucesso!" : "Ainda vazio :(");

    const response = await fetch(`${API_URL}/documentos/espaco/${espacoId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(documento)
    });

    if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || "Erro ao cadastrar documento do espaço.");
    }

    return response.json();
}

export async function listarDocumentosEspaco(espacoId) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/documentos/espaco/${espacoId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao buscar documentos do espaço.");
    }

    return response.json();
}


/**
 * =========================================================
 * DOCUMENTO POR ID
 * =========================================================
 */
export async function buscarDocumento(id) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/documentos/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao buscar documento.");
    }

    return response.json();
}


/**
 * =========================================================
 * ADMIN
 * =========================================================
 */
export async function listarDocumentosPendentes() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/documentos/admin/pendentes`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao buscar documentos pendentes.");
    }

    return response.json();
}

export async function aprovarDocumento(id) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/documentos/admin/${id}/aprovar`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || "Erro ao aprovar documento.");
    }

    return response.json();
}

export async function rejeitarDocumento(id, motivo) {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    params.append("motivo", motivo);

    const response = await fetch(`${API_URL}/documentos/admin/${id}/rejeitar?${params.toString()}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || "Erro ao rejeitar documento.");
    }

    return response.json();
}

export async function solicitarCorrecao(id, motivo) {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    params.append("motivo", motivo);

    const response = await fetch(`${API_URL}/documentos/admin/${id}/correcao?${params.toString()}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || "Erro ao solicitar correção.");
    }

    return response.json();
}