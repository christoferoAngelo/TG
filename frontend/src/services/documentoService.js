const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080";

const CLOUDINARY_CLOUD_NAME =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


/**
 * =========================================================
 * CLOUDINARY
 * =========================================================
 */

export async function uploadDocumentoCloudinary(arquivo) {

    if (!arquivo) {
        throw new Error("Nenhum arquivo foi selecionado.");
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(
            "Configuração do Cloudinary não encontrada."
        );
    }

    const formData = new FormData();

    formData.append("file", arquivo);
    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
        console.error(
            "Resposta Cloudinary:",
            data
        );

        throw new Error(
            "Não foi possível enviar o arquivo para o Cloudinary."
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

export async function criarDocumentoUsuario(
    usuarioId,
    documento
) {

    const response = await fetch(
        `${API_URL}/documentos/usuario/${usuarioId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(documento)
        }
    );

    if (!response.ok) {
        const texto = await response.text();

        throw new Error(
            texto || "Erro ao cadastrar documento do usuário."
        );
    }

    return response.json();
}


export async function listarDocumentosUsuario(
    usuarioId
) {

    const response = await fetch(
        `${API_URL}/documentos/usuario/${usuarioId}`
    );

    if (!response.ok) {
        throw new Error(
            "Erro ao buscar documentos do usuário."
        );
    }

    return response.json();
}


/**
 * =========================================================
 * DOCUMENTOS DO ESPAÇO
 * =========================================================
 */

export async function criarDocumentoEspaco(
    espacoId,
    documento
) {

    const response = await fetch(
        `${API_URL}/documentos/espaco/${espacoId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(documento)
        }
    );

    if (!response.ok) {
        const texto = await response.text();

        throw new Error(
            texto || "Erro ao cadastrar documento do espaço."
        );
    }

    return response.json();
}


export async function listarDocumentosEspaco(
    espacoId
) {

    const response = await fetch(
        `${API_URL}/documentos/espaco/${espacoId}`
    );

    if (!response.ok) {
        throw new Error(
            "Erro ao buscar documentos do espaço."
        );
    }

    return response.json();
}


/**
 * =========================================================
 * DOCUMENTO POR ID
 * =========================================================
 */

export async function buscarDocumento(id) {

    const response = await fetch(
        `${API_URL}/documentos/${id}`
    );

    if (!response.ok) {
        throw new Error(
            "Erro ao buscar documento."
        );
    }

    return response.json();
}


/**
 * =========================================================
 * ADMIN
 * =========================================================
 */

export async function listarDocumentosPendentes() {

    const response = await fetch(
        `${API_URL}/documentos/admin/pendentes`
    );

    if (!response.ok) {
        throw new Error(
            "Erro ao buscar documentos pendentes."
        );
    }

    return response.json();
}


export async function aprovarDocumento(id) {

    const response = await fetch(
        `${API_URL}/documentos/admin/${id}/aprovar`,
        {
            method: "PUT"
        }
    );

    if (!response.ok) {
        const texto = await response.text();

        throw new Error(
            texto || "Erro ao aprovar documento."
        );
    }

    return response.json();
}


export async function rejeitarDocumento(
    id,
    motivo
) {

    const params = new URLSearchParams();

    params.append("motivo", motivo);

    const response = await fetch(
        `${API_URL}/documentos/admin/${id}/rejeitar?${params.toString()}`,
        {
            method: "PUT"
        }
    );

    if (!response.ok) {
        const texto = await response.text();

        throw new Error(
            texto || "Erro ao rejeitar documento."
        );
    }

    return response.json();
}


export async function solicitarCorrecao(
    id,
    motivo
) {

    const params = new URLSearchParams();

    params.append("motivo", motivo);

    const response = await fetch(
        `${API_URL}/documentos/admin/${id}/correcao?${params.toString()}`,
        {
            method: "PUT"
        }
    );

    if (!response.ok) {
        const texto = await response.text();

        throw new Error(
            texto || "Erro ao solicitar correção."
        );
    }

    return response.json();
}