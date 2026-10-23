const ROTULOS = {
    DOCUMENTO_IDENTIFICACAO: "Documento de identificação",
    CPF: "CPF",
    COMPROVANTE_RESIDENCIA: "Comprovante de residência",
    DOCUMENTO_PROPRIEDADE: "Documento de propriedade",
    COMPROVANTE_ENDERECO: "Comprovante de endereço",
    DOCUMENTO_AUTORIZACAO: "Documento de autorização",
    PESSOA: "Conta",
    ESPACO: "Espaço",
};

export function rotuloDocumento(valor) {
    if (!valor) return "Documento";
    const chave = String(valor).toUpperCase();
    if (ROTULOS[chave]) return ROTULOS[chave];
    const texto = String(valor).replaceAll("_", " ").toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
