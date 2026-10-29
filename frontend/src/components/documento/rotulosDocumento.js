const ROTULOS = {
    DOCUMENTO_IDENTIFICACAO: "Documento de identificação",
    RG_FRENTE: "RG (frente)",
    RG_VERSO: "RG (verso)",
    CIN_FRENTE: "CIN (frente)",
    CIN_VERSO: "CIN (verso)",
    CNH_FRENTE: "CNH (frente)",
    CNH_VERSO: "CNH (verso)",
    CIN: "CIN",
    CNH: "CNH",
    CPF: "CPF",
    COMPROVANTE_RESIDENCIA: "Comprovante de residência",
    DOCUMENTO_PROPRIEDADE: "Documento de propriedade",
    COMPROVANTE_ENDERECO: "Comprovante de endereço",
    DOCUMENTO_AUTORIZACAO: "Documento de autorização",
    IPTU: "Capa do IPTU",
    MATRICULA: "Matrícula atualizada",
    ESCRITURA: "Escritura pública",
    CONTRATO_LOCACAO: "Contrato de locação comercial",
    AUTORIZACAO_USO: "Autorização de uso",
    ALVARA: "Alvará de funcionamento",
    AVCB: "AVCB",
    PESSOA: "Conta",
    ESPACO: "Espaço",
};

export const TIPOS_IDENTIDADE = [
    "RG_FRENTE",
    "RG_VERSO",
    "CIN_FRENTE",
    "CIN_VERSO",
    "CNH_FRENTE",
    "CNH_VERSO",
    "CIN",
    "CNH",
    "DOCUMENTO_IDENTIFICACAO",
];
export const TIPO_COMPROVANTE = "COMPROVANTE_RESIDENCIA";

export function ehDocumentoIdentidade(tipo) {
    return TIPOS_IDENTIDADE.includes(String(tipo || "").toUpperCase());
}

/** Mapeia o tipo escolhido (RG/CIN/CNH) para os códigos de frente e verso. */
export function ladosIdentidade(tipoEscolhido) {
    const base = String(tipoEscolhido || "RG").toUpperCase();
    if (base === "CIN") return { frente: "CIN_FRENTE", verso: "CIN_VERSO" };
    if (base === "CNH") return { frente: "CNH_FRENTE", verso: "CNH_VERSO" };
    return { frente: "RG_FRENTE", verso: "RG_VERSO" };
}

export function rotuloDocumento(valor) {
    if (!valor) return "Documento";
    const chave = String(valor).toUpperCase();
    if (ROTULOS[chave]) return ROTULOS[chave];
    const texto = String(valor).replaceAll("_", " ").toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
