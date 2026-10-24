const TITULO_EVENTOS = "Eventos aceitos:";
const TITULO_SOM = "Regras gerais e de som:";
const TITULO_LIMPEZA = "Regras de limpeza e danos:";
const TITULO_ACESSO = "Segurança e acesso:";
const TITULO_ACRESCIMOS = "Acréscimos por turno:";
const TITULO_ANTECEDENCIA = "Antecedência mínima:";

function bloco(titulo, texto) {
    const corpo = (texto || "").trim();
    if (!corpo) return "";
    return `${titulo}\n${corpo}`;
}

/** Texto legível gravado em restricoesHorario (o card do espaço mostra esse campo). */
export function serializarRegras({ tiposEvento, regrasSom, regrasLimpeza, regrasAcesso, adicionais, turnos, antecedenciaMinimaDias }) {
    const partes = [];

    if (tiposEvento?.length) {
        partes.push(`${TITULO_EVENTOS} ${tiposEvento.join(", ")}.`);
    }

    const som = bloco(TITULO_SOM, regrasSom);
    const limpeza = bloco(TITULO_LIMPEZA, regrasLimpeza);
    const acesso = bloco(TITULO_ACESSO, regrasAcesso);
    if (som) partes.push(som);
    if (limpeza) partes.push(limpeza);
    if (acesso) partes.push(acesso);

    const extras = (turnos || [])
        .map((turno) => {
            const valor = adicionais?.[turno.chave];
            if (valor === undefined || valor === "" || !(Number(valor) > 0)) return null;
            return `${turno.chave} +R$ ${Number(valor)}`;
        })
        .filter(Boolean);

    if (extras.length) {
        partes.push(`${TITULO_ACRESCIMOS} ${extras.join("; ")}.`);
    }

    const antecedencia = Number(antecedenciaMinimaDias);
    if (Number.isInteger(antecedencia) && antecedencia >= 0) {
        partes.push(`${TITULO_ANTECEDENCIA} ${antecedencia} dia(s).`);
    }

    return partes.join("\n\n");
}

function entre(texto, inicio, fins) {
    const i = texto.indexOf(inicio);
    if (i < 0) return "";
    const depois = i + inicio.length;
    let fim = texto.length;
    fins.forEach((marca) => {
        const j = texto.indexOf(marca, depois);
        if (j >= 0 && j < fim) fim = j;
    });
    return texto.slice(depois, fim).trim().replace(/\.\s*$/, "").trim();
}

/** Recupera o wizard a partir do texto salvo. Texto antigo cai nas regras de som. */
export function interpretarRegras(texto) {
    const vazio = {
        tiposEvento: [],
        regrasSom: "",
        regrasLimpeza: "",
        regrasAcesso: "",
        adicionais: {},
        antecedenciaMinimaDias: null,
    };
    if (!texto || !texto.trim()) return vazio;

    const conhecido = [TITULO_EVENTOS, TITULO_SOM, TITULO_LIMPEZA, TITULO_ACESSO, TITULO_ACRESCIMOS, TITULO_ANTECEDENCIA]
        .some((titulo) => texto.includes(titulo));

    if (!conhecido) {
        return { ...vazio, regrasSom: texto.trim() };
    }

    const marcas = [TITULO_EVENTOS, TITULO_SOM, TITULO_LIMPEZA, TITULO_ACESSO, TITULO_ACRESCIMOS, TITULO_ANTECEDENCIA];
    const eventosBruto = entre(texto, TITULO_EVENTOS, marcas.filter((m) => m !== TITULO_EVENTOS));
    const tiposEvento = eventosBruto
        ? eventosBruto.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

    const acrescimos = entre(texto, TITULO_ACRESCIMOS, marcas.filter((m) => m !== TITULO_ACRESCIMOS));
    const antecedenciaBruta = entre(texto, TITULO_ANTECEDENCIA, marcas.filter((m) => m !== TITULO_ANTECEDENCIA));
    const antecedenciaMatch = antecedenciaBruta.match(/^(\d+)/);
    const antecedenciaMinimaDias = antecedenciaMatch ? Number(antecedenciaMatch[1]) : null;
    const adicionais = {};
    acrescimos.split(";").forEach((parte) => {
        const match = parte.trim().match(/^(.+?)\s+\+R\$\s*(\d+(?:[.,]\d+)?)$/);
        if (match) adicionais[match[1].trim()] = match[2].replace(",", ".");
    });

    return {
        tiposEvento,
        regrasSom: entre(texto, TITULO_SOM, marcas.filter((m) => m !== TITULO_SOM)),
        regrasLimpeza: entre(texto, TITULO_LIMPEZA, marcas.filter((m) => m !== TITULO_LIMPEZA)),
        regrasAcesso: entre(texto, TITULO_ACESSO, marcas.filter((m) => m !== TITULO_ACESSO)),
        adicionais,
        antecedenciaMinimaDias,
    };
}

/** Dias de antecedência que a tela de reserva deve respeitar. */
export function antecedenciaSalva(espaco) {
    const texto = interpretarRegras(espaco?.restricoesHorario).antecedenciaMinimaDias;
    const campo = espaco?.antecedenciaMinimaDias;
    const nCampo = campo == null || campo === "" ? null : Number(campo);
    if (Number.isInteger(nCampo) && nCampo > 0) return nCampo;
    if (texto != null) return texto;
    return Number.isInteger(nCampo) ? nCampo : 0;
}
