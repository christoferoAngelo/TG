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
    const capa = String(espaco?.fotoCapaUrl || "").trim();
    if (!capa) return fotos;
    const resto = fotos.filter((foto) => foto.url !== capa);
    return [{ url: capa, ambiente: espaco.titulo || "Capa" }, ...resto];
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

export function qtdAvaliacoes(espaco) {
    return Number(espaco?.quantidadeAvaliacoes) || 0;
}

export function notaDe(espaco) {
    const nota = Number(espaco?.notaMedia);
    return Number.isFinite(nota) ? nota : 0;
}

/** Mais avaliações primeiro; em empate, maior nota; depois título estável. */
export function ordenarPorRelevancia(a, b) {
    const diffAvals = qtdAvaliacoes(b) - qtdAvaliacoes(a);
    if (diffAvals !== 0) return diffAvals;
    const diffNota = notaDe(b) - notaDe(a);
    if (diffNota !== 0) return diffNota;
    return String(a?.titulo || "").localeCompare(String(b?.titulo || ""), "pt-BR");
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
        ordenada.sort((a, b) => {
            const diffNota = notaDe(b) - notaDe(a);
            if (diffNota !== 0) return diffNota;
            return qtdAvaliacoes(b) - qtdAvaliacoes(a);
        });
    } else if (filtros.ordem === "capacidade") {
        ordenada.sort((a, b) => (b.capacidadePessoas ?? 0) - (a.capacidadePessoas ?? 0));
    } else {
        // relevância (padrão): volume de avaliações, depois nota
        ordenada.sort(ordenarPorRelevancia);
    }
    return ordenada;
}

/**
 * Quando a busca/filtros zeram, sugere anúncios “próximos” da intenção
 * (convidados, preço, cidade/termo, disponibilidade na data) e prioriza bem avaliados.
 */
export function sugerirEspacos(catalogo, {
    pessoas = "0",
    termo = "",
    data = "",
    semVaga = [],
    filtros = FILTRO_INICIAL,
    excluirIds = [],
    limite = 8,
} = {}) {
    const base = (catalogo || []).filter(espacoPublicado);
    if (base.length === 0) return [];

    const excluidos = new Set((excluirIds || []).map(Number));
    const candidatos = base.filter((espaco) => !excluidos.has(Number(espaco.id)));
    if (candidatos.length === 0) return [];

    const convidados = Number(pessoas) || 0;
    const capacidadeFiltro = filtros.capacidadeMin === "" ? 0 : Number(filtros.capacidadeMin) || 0;
    const alvoCapacidade = Math.max(convidados, capacidadeFiltro);

    const precos = candidatos.map(precoDe).filter((v) => v != null);
    const medianaCatalogo = precos.length
        ? [...precos].sort((a, b) => a - b)[Math.floor(precos.length / 2)]
        : null;
    const minF = filtros.precoMin === "" ? null : Number(filtros.precoMin);
    const maxF = filtros.precoMax === "" ? null : Number(filtros.precoMax);
    let precoAlvo = medianaCatalogo;
    if (minF != null && maxF != null) precoAlvo = (minF + maxF) / 2;
    else if (minF != null) precoAlvo = minF;
    else if (maxF != null) precoAlvo = maxF;

    const termoLimpo = String(termo || "").trim().toLowerCase();
    const indisponiveis = new Set((semVaga || []).map(Number));

    const pontuados = candidatos.map((espaco) => {
        let pontos = 0;
        const motivo = [];

        const cap = Number(espaco.capacidadePessoas) || 0;
        if (alvoCapacidade > 0) {
            if (cap >= alvoCapacidade) {
                const folga = (cap - alvoCapacidade) / Math.max(alvoCapacidade, 1);
                pontos += Math.max(18, 42 - Math.min(24, folga * 18));
                motivo.push("capacidade parecida");
            } else {
                const falta = (alvoCapacidade - cap) / Math.max(alvoCapacidade, 1);
                pontos += Math.max(0, 16 - falta * 16);
            }
        }

        const preco = precoDe(espaco);
        if (preco != null && precoAlvo != null && precoAlvo > 0) {
            const diff = Math.abs(preco - precoAlvo) / precoAlvo;
            if (diff <= 0.35) {
                pontos += Math.max(8, 32 - diff * 60);
                motivo.push("preço próximo");
            } else {
                pontos += Math.max(0, 10 - diff * 8);
            }
        }

        if (termoLimpo) {
            const texto = [
                espaco.titulo,
                localDe(espaco),
                espaco.endereco?.cidade,
                espaco.endereco?.bairro,
                espaco.endereco?.estado,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            if (texto.includes(termoLimpo)) {
                pontos += 38;
                motivo.push("local parecido");
            } else {
                const tokens = termoLimpo.split(/\s+/).filter((t) => t.length > 2);
                const hits = tokens.filter((t) => texto.includes(t)).length;
                if (hits > 0) {
                    pontos += hits * 10;
                    motivo.push("local parecido");
                }
            }
        }

        if (data) {
            if (!indisponiveis.has(Number(espaco.id))) {
                pontos += 28;
                motivo.push("livre na data");
            }
        }

        if ((filtros.comodidades || []).length > 0) {
            const nomes = new Set((espaco.caracteristicas || []).map((item) => item.nome));
            const hits = filtros.comodidades.filter((nome) => nomes.has(nome)).length;
            if (hits > 0) {
                pontos += hits * 8;
                motivo.push("comodidades em comum");
            }
        }

        // Impulsiona anúncios bem avaliados para “anunciar” melhor os espaços
        pontos += Math.min(24, qtdAvaliacoes(espaco) * 2.5);
        pontos += notaDe(espaco) * 3;

        return { espaco, pontos, motivo: [...new Set(motivo)] };
    });

    pontuados.sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        return ordenarPorRelevancia(a.espaco, b.espaco);
    });

    return pontuados.slice(0, limite).map(({ espaco, motivo }) => ({
        ...espaco,
        _sugestaoMotivo: motivo.slice(0, 2),
    }));
}

export const PRECO_MAX_FILTRO = 15000;
export const CAPACIDADE_MAX_FILTRO = 1500;

/** Contagem por faixa de preço para o histograma do modal de filtros. */
export function histogramaPrecos(espacos, { bins = 36, maxPreco = PRECO_MAX_FILTRO } = {}) {
    const counts = Array.from({ length: bins }, () => 0);
    const step = maxPreco / bins;
    (espacos || []).forEach((espaco) => {
        const preco = precoDe(espaco);
        if (preco == null || preco < 0) return;
        const indice = Math.min(bins - 1, Math.floor(preco / step));
        counts[indice] += 1;
    });
    return { counts, step, max: Math.max(1, ...counts) };
}

/** Filtra espaços (com ordenação) e opcionalmente exclui indisponíveis na data. */
export function filtrarEspacos(espacos, { pessoas, filtros, semVaga = [] }) {
    return aplicarFiltros(espacos, { pessoas, filtros })
        .filter((espaco) => !semVaga.length || !semVaga.includes(Number(espaco.id)));
}

/** Base do histograma: mesmos filtros, ignorando faixa de preço. */
export function espacosParaHistograma(espacos, { pessoas, filtros, semVaga = [] }) {
    return filtrarEspacos(espacos, {
        pessoas,
        filtros: { ...filtros, precoMin: "", precoMax: "" },
        semVaga,
    });
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

export function distanciaKm(lat1, lng1, lat2, lng2) {
    if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(Number(v)))) return null;
    const r = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Destinos para o painel “Onde”: cidades do catálogo + espaços que batem com o termo. */
export function destinosDeCatalogo(catalogo, termo = "", lat = null, lng = null) {
    const lista = (catalogo || []).filter(espacoPublicado);
    const q = String(termo || "").trim().toLowerCase();
    const cidades = new Map();

    lista.forEach((espaco) => {
        const cidade = espaco?.endereco?.cidade?.trim();
        const estado = espaco?.endereco?.estado?.trim();
        if (!cidade) return;
        const chave = `${cidade}|${estado || ""}`.toLowerCase();
        const atual = cidades.get(chave) || {
            id: `cidade-${chave}`,
            tipo: "cidade",
            valor: cidade,
            rotulo: estado ? `${cidade}, ${estado}` : cidade,
            subtitulo: "Cidade",
            contagem: 0,
            lat: espaco?.endereco?.latitude,
            lng: espaco?.endereco?.longitude,
        };
        atual.contagem += 1;
        if (atual.lat == null && espaco?.endereco?.latitude != null) {
            atual.lat = espaco.endereco.latitude;
            atual.lng = espaco.endereco.longitude;
        }
        cidades.set(chave, atual);
    });

    let destinos = [...cidades.values()].map((item) => ({
        ...item,
        subtitulo: item.contagem === 1 ? "1 espaço" : `${item.contagem} espaços`,
        distanciaKm: distanciaKm(lat, lng, item.lat, item.lng),
    }));

    if (q) {
        destinos = destinos.filter((d) => d.rotulo.toLowerCase().includes(q) || d.valor.toLowerCase().includes(q));
        const espacos = lista
            .filter((e) => {
                const texto = [e.titulo, e.endereco?.cidade, e.endereco?.bairro]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return texto.includes(q);
            })
            .slice(0, 5)
            .map((e) => ({
                id: `espaco-${e.id}`,
                tipo: "espaco",
                valor: e.titulo || e.endereco?.cidade || "",
                rotulo: e.titulo || "Espaço",
                subtitulo: localDe(e),
                cidade: e.endereco?.cidade || "",
                distanciaKm: distanciaKm(lat, lng, e.endereco?.latitude, e.endereco?.longitude),
            }));
        destinos = [...destinos.slice(0, 6), ...espacos];
    } else if (lat != null && lng != null) {
        destinos.sort((a, b) => (a.distanciaKm ?? 1e9) - (b.distanciaKm ?? 1e9));
    } else {
        destinos.sort((a, b) => b.contagem - a.contagem || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
    }

    return destinos.slice(0, 8);
}
