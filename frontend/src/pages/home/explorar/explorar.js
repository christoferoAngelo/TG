export const CATEGORIAS = [
    { id: "Todos", rotulo: "Todos" },
    { id: "Salões de festa", rotulo: "Salões" },
    { id: "Chácaras", rotulo: "Chácaras" },
    { id: "Sítios", rotulo: "Sítios" },
    { id: "Rooftops", rotulo: "Rooftops" },
    { id: "Espaços corporativos", rotulo: "Corporativo" },
    { id: "Áreas ao ar livre", rotulo: "Ao ar livre" },
];

export const FILTRO_INICIAL = {
    precoMin: "",
    precoMax: "",
    capacidadeMin: "",
    comodidades: [],
    ordem: "relevancia",
};

const CHAVE_FAVORITOS = "locafesta-favoritos";

export function lerFavoritos() {
    try {
        const lista = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS));
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function gravarFavoritos(lista) {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
}

export function espacoPublicado(espaco) {
    const status = (espaco?.statusAprovacao || "").toUpperCase();
    return status !== "REJEITADO" && status !== "PENDENTE";
}

export function precoDe(espaco) {
    const valor = Number(espaco?.valorDiaria ?? espaco?.valorMeioPeriodo ?? NaN);
    return Number.isFinite(valor) ? valor : null;
}

export function unidadePreco(espaco) {
    if (espaco?.valorDiaria != null && Number(espaco.valorDiaria) > 0) return "por diária";
    if (espaco?.valorMeioPeriodo != null && Number(espaco.valorMeioPeriodo) > 0) return "por turno";
    return "";
}

export function fotosDe(espaco) {
    const fotos = [];
    (espaco?.ambientes || []).forEach((ambiente) => {
        (ambiente.imagensUrls || []).forEach((url) => {
            if (url) fotos.push({ url, ambiente: ambiente.titulo || espaco.titulo || "Espaço" });
        });
    });
    return fotos;
}

export function localDe(espaco) {
    const endereco = espaco?.endereco;
    if (!endereco) return "Local não informado";
    if (typeof endereco === "string") return endereco;
    const partes = [endereco.bairro, endereco.cidade].filter(Boolean);
    const uf = endereco.estado ? ` - ${endereco.estado}` : "";
    return partes.length ? `${partes.join(", ")}${uf}` : "Local não informado";
}

export function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso) {
    if (!iso) return "";
    const [ano, mes, dia] = iso.split("-");
    if (!ano || !mes || !dia) return "";
    return `${dia}/${mes}/${ano}`;
}

export function aplicarFiltros(espacos, { pessoas, filtros }) {
    let lista = espacos.filter(espacoPublicado);

    const convidados = Number(pessoas);
    if (convidados > 0) {
        lista = lista.filter((espaco) => Number(espaco.capacidadePessoas) >= convidados);
    }

    const minimo = filtros.precoMin === "" ? null : Number(filtros.precoMin);
    const maximo = filtros.precoMax === "" ? null : Number(filtros.precoMax);
    if (minimo != null || maximo != null) {
        lista = lista.filter((espaco) => {
            const preco = precoDe(espaco);
            if (preco == null) return false;
            if (minimo != null && preco < minimo) return false;
            if (maximo != null && preco > maximo) return false;
            return true;
        });
    }

    const capacidade = filtros.capacidadeMin === "" ? null : Number(filtros.capacidadeMin);
    if (capacidade != null && capacidade > 0) {
        lista = lista.filter((espaco) => Number(espaco.capacidadePessoas) >= capacidade);
    }

    if (filtros.comodidades.length > 0) {
        lista = lista.filter((espaco) => {
            const nomes = new Set((espaco.caracteristicas || []).map((item) => item.nome));
            return filtros.comodidades.every((nome) => nomes.has(nome));
        });
    }

    const ordenada = [...lista];
    if (filtros.ordem === "preco-asc") {
        ordenada.sort((a, b) => (precoDe(a) ?? Infinity) - (precoDe(b) ?? Infinity));
    } else if (filtros.ordem === "preco-desc") {
        ordenada.sort((a, b) => (precoDe(b) ?? -1) - (precoDe(a) ?? -1));
    } else if (filtros.ordem === "nota") {
        ordenada.sort((a, b) => (b.notaMedia ?? -1) - (a.notaMedia ?? -1));
    } else if (filtros.ordem === "capacidade") {
        ordenada.sort((a, b) => (b.capacidadePessoas ?? 0) - (a.capacidadePessoas ?? 0));
    }
    return ordenada;
}

export function comodidadesDisponiveis(espacos) {
    const mapa = new Map();
    espacos.filter(espacoPublicado).forEach((espaco) => {
        (espaco.caracteristicas || []).forEach((item) => {
            if (item?.nome) mapa.set(item.nome, item);
        });
    });
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
