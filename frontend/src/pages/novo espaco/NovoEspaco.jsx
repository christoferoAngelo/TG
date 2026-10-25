import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../dashboard/Dashboard.css";
import { criarDocumentoEspaco, uploadDocumentoCloudinary } from "../../services/documentoService";
import "./NovoEspaco.css";
import BarraProgresso from "./etapas/BarraProgresso";
import EtapaBasico from "./etapas/EtapaBasico";
import EtapaHorarios from "./etapas/EtapaHorarios";
import EtapaRegras from "./etapas/EtapaRegras";
import EtapaDocumentos from "./etapas/EtapaDocumentos";
import { validarEtapa1, validarEtapa2, validarEtapa4 } from "./validarEtapas";
import { calcularTurnos } from "./turnos";
import { antecedenciaSalva, interpretarRegras, serializarRegras } from "./regrasTexto";

const ROTA_PAINEL = "/perfil_locador";

const API = "http://localhost:8080/api";
const MAX_FOTO_MB = 10;
const MAX_FOTOS_AMBIENTE = 8;
const MAX_FOTOS_ESPACO = 24;

const ESTADO_INICIAL = {
    titulo: "",
    descricao: "",
    tiposEvento: [],
    capacidadePessoas: "",
    valorDiaria: "",
    horarioAbertura: "",
    horarioFechamento: "",
    fechaNoDiaSeguinte: false,
    aprovacaoInstantanea: false,
    antecedenciaMinimaDias: "0",
    prazoCancelamentoDias: "2",
    aceitaIntegral: true,
    aceitaFracionado: false,
    duracaoMaxHoras: "",
    intervaloLimpezaMin: "",
    regrasSom: "",
    regrasLimpeza: "",
    regrasAcesso: "",
    adicionais: {},
    caracteristicas: [],
    endereco: {
        cep: "", logradouro: "", numero: "", complemento: "",
        bairro: "", cidade: "", estado: "",
    },
};

const documentoVazio = () => ({ tipo: "", arquivo: null, nomeArquivo: "" });

let seq = 0;
const novoId = () => ++seq;
const novoAmbiente = () => ({ id: novoId(), titulo: "", descricao: "", fotos: [] });

const mascararCep = (valor) => {
    const d = valor.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const formatarHora = (v) => {
    if (!v) return "";
    if (Array.isArray(v)) {
        return `${String(v[0]).padStart(2, "0")}:${String(v[1] ?? 0).padStart(2, "0")}`;
    }
    return String(v).slice(0, 5);
};

const ehFotoNova = (f) => Boolean(f.file);
const liberarPreview = (f) => {
    if (f.file) URL.revokeObjectURL(f.preview);
};

const gerarAssinatura = (form, ambientes, resposta) =>
    JSON.stringify({
        form,
        amb: ambientes.map((a) => ({
            t: a.titulo,
            d: a.descricao,
            f: a.fotos.map((f) => f.url || `novo-${f.id}`),
        })),
        r: resposta,
    });

async function enviarParaCloudinary(arquivo) {
    const body = new FormData();
    body.append("file", arquivo);
    body.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body }
    );
    const data = await res.json();

    if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message || `Não foi possível enviar "${arquivo.name}".`);
    }
    return data.secure_url;
}

function formasDe(espaco) {
    const integral = espaco.permitePeriodoIntegral !== false;
    const fracionado = Boolean(espaco.permiteMeioPeriodo);
    const fracionadoReal = fracionado && (espaco.duracaoMaxHoras != null || !integral);
    return { aceitaIntegral: integral, aceitaFracionado: fracionadoReal };
}

function temErros(erros) {
    return Object.keys(erros).length > 0;
}

export default function NovoEspaco() {
    const navigate = useNavigate();
    const { usuarioLogado } = useAuth();

    const { id } = useParams();
    const editando = Boolean(id);

    const [form, setForm] = useState(ESTADO_INICIAL);
    const [ambientes, setAmbientes] = useState(() => [novoAmbiente()]);
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [erros, setErros] = useState({});
    const [avisoFotos, setAvisoFotos] = useState("");
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [progresso, setProgresso] = useState(null);
    const [erroEnvio, setErroEnvio] = useState("");
    const [espacoCriado, setEspacoCriado] = useState(null);
    const [etapa, setEtapa] = useState(1);
    const [documento, setDocumento] = useState(documentoVazio);
    const [seguranca, setSeguranca] = useState(documentoVazio);
    const [segurancaAberta, setSegurancaAberta] = useState(false);
    const [contratoLido, setContratoLido] = useState(false);
    const [termosAceitos, setTermosAceitos] = useState(false);

    const [carregando, setCarregando] = useState(editando);
    const [erroCarregar, setErroCarregar] = useState("");
    const [espacoOriginal, setEspacoOriginal] = useState(null);
    const [respostaLocador, setRespostaLocador] = useState("");
    const snapshotRef = useRef("");

    const numeroRef = useRef(null);
    const paginaRef = useRef(null);
    const uploadsFeitos = useRef(new Map());
    const documentosEnviados = useRef({ vinculo: false, seguranca: false });
    const ambientesRef = useRef(ambientes);
    ambientesRef.current = ambientes;

    useEffect(() => {
        fetch(`${API}/caracteristicas`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setCaracteristicasDisponiveis(Array.isArray(data) ? data : []))
            .catch(() => setCaracteristicasDisponiveis([]));
    }, []);

    useEffect(() => () => {
        ambientesRef.current.forEach((a) => a.fotos.forEach(liberarPreview));
    }, []);

    useEffect(() => {
        if (!editando || !usuarioLogado?.id) return;

        let cancelado = false;
        setCarregando(true);
        setErroCarregar("");

        fetch(`${API}/locadores/${usuarioLogado.id}/espacos`)
            .then((res) =>
                res.ok ? res.json() : Promise.reject(new Error("Não foi possível carregar seus espaços."))
            )
            .then((lista) => {
                const e = (Array.isArray(lista) ? lista : []).find((x) => String(x.id) === String(id));
                if (!e) throw new Error("Espaço não encontrado ou não pertence à sua conta.");
                if (cancelado) return;

                const abre = formatarHora(e.horarioAbertura);
                const fecha = formatarHora(e.horarioFechamento);
                const formas = formasDe(e);
                const regras = interpretarRegras(e.restricoesHorario);
                const valorBase = formas.aceitaFracionado && !formas.aceitaIntegral
                    ? (e.valorMeioPeriodo ?? e.valorDiaria)
                    : e.valorDiaria;

                const formCarregado = {
                    ...ESTADO_INICIAL,
                    titulo: e.titulo ?? "",
                    descricao: e.descricao ?? "",
                    tiposEvento: regras.tiposEvento,
                    capacidadePessoas: e.capacidadePessoas == null ? "" : String(e.capacidadePessoas),
                    valorDiaria: valorBase == null ? "" : String(valorBase),
                    horarioAbertura: abre,
                    horarioFechamento: fecha,
                    fechaNoDiaSeguinte: Boolean(abre && fecha && fecha <= abre),
                    aprovacaoInstantanea: Boolean(e.aprovacaoInstantanea),
                    antecedenciaMinimaDias: String(antecedenciaSalva(e)),
                    prazoCancelamentoDias: e.prazoCancelamentoDias == null ? "2" : String(e.prazoCancelamentoDias),
                    aceitaIntegral: formas.aceitaIntegral,
                    aceitaFracionado: formas.aceitaFracionado,
                    duracaoMaxHoras: e.duracaoMaxHoras == null ? "" : String(e.duracaoMaxHoras),
                    intervaloLimpezaMin: String(e.intervaloLimpezaMin ?? 0),
                    regrasSom: regras.regrasSom,
                    regrasLimpeza: regras.regrasLimpeza,
                    regrasAcesso: regras.regrasAcesso,
                    adicionais: regras.adicionais,
                    caracteristicas: Array.isArray(e.caracteristicas) ? e.caracteristicas : [],
                    endereco: {
                        cep: e.endereco?.cep ?? "",
                        logradouro: e.endereco?.logradouro ?? "",
                        numero: e.endereco?.numero ?? "",
                        complemento: e.endereco?.complemento ?? "",
                        bairro: e.endereco?.bairro ?? "",
                        cidade: e.endereco?.cidade ?? "",
                        estado: e.endereco?.estado ?? "",
                    },
                };

                const ambientesCarregados =
                    Array.isArray(e.ambientes) && e.ambientes.length > 0
                        ? e.ambientes.map((a) => ({
                              id: novoId(),
                              titulo: a.titulo ?? "",
                              descricao: a.descricao ?? "",
                              fotos: (a.imagensUrls ?? []).map((url) => ({ id: novoId(), url, preview: url })),
                          }))
                        : [novoAmbiente()];

                const resposta = e.respostaLocador ?? "";

                setEspacoOriginal(e);
                setForm(formCarregado);
                setAmbientes(ambientesCarregados);
                setRespostaLocador(resposta);
                snapshotRef.current = gerarAssinatura(formCarregado, ambientesCarregados, resposta);
            })
            .catch((err) => {
                if (!cancelado) setErroCarregar(err.message || "Não foi possível carregar o espaço.");
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });

        return () => {
            cancelado = true;
        };
    }, [editando, id, usuarioLogado?.id]);

    const limparErro = (chave) =>
        setErros((prev) => {
            if (!prev[chave]) return prev;
            const { [chave]: _removido, ...resto } = prev;
            return resto;
        });

    const setCampo = (campo, valor) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
        limparErro(campo);
        if (campo === "horarioAbertura") limparErro("horarioFechamento");
        if (campo === "aceitaFracionado" || campo === "aceitaIntegral") {
            limparErro("duracaoMaxHoras");
            limparErro("intervaloLimpezaMin");
            limparErro("formas");
        }
    };

    const toggleTipoEvento = (tipo) => {
        setForm((prev) => {
            const jaTem = prev.tiposEvento.includes(tipo);
            return {
                ...prev,
                tiposEvento: jaTem
                    ? prev.tiposEvento.filter((item) => item !== tipo)
                    : [...prev.tiposEvento, tipo],
            };
        });
        limparErro("tiposEvento");
    };

    const setAdicional = (chave, valor) => {
        setForm((prev) => ({ ...prev, adicionais: { ...prev.adicionais, [chave]: valor } }));
    };

    const marcarContratoLido = useCallback(() => setContratoLido(true), []);

    const setEndereco = (campo, valor) => {
        setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, [campo]: valor } }));
        limparErro(`end_${campo}`);
    };

    const bind = (campo) => ({
        id: `ne-${campo}`,
        value: form[campo],
        onChange: (e) => setCampo(campo, e.target.value),
        "aria-invalid": erros[campo] ? "true" : undefined,
    });

    const bindEnd = (campo) => ({
        id: `ne-end-${campo}`,
        value: form.endereco[campo],
        onChange: (e) => setEndereco(campo, e.target.value),
        "aria-invalid": erros[`end_${campo}`] ? "true" : undefined,
    });

    const toggleCaracteristica = (item) =>
        setForm((prev) => {
            const jaTem = prev.caracteristicas.some((c) => c.id === item.id);
            return {
                ...prev,
                caracteristicas: jaTem
                    ? prev.caracteristicas.filter((c) => c.id !== item.id)
                    : [...prev.caracteristicas, item],
            };
        });

    const handleCep = async (valor) => {
        const cep = mascararCep(valor);
        setEndereco("cep", cep);
        setCepNaoEncontrado(false);

        const digitos = cep.replace(/\D/g, "");
        if (digitos.length !== 8) return;

        setBuscandoCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
            const data = await res.json();
            if (data.erro) {
                setCepNaoEncontrado(true);
                return;
            }
            setForm((prev) => ({
                ...prev,
                endereco: {
                    ...prev.endereco,
                    logradouro: data.logradouro || prev.endereco.logradouro,
                    bairro: data.bairro || prev.endereco.bairro,
                    cidade: data.localidade || prev.endereco.cidade,
                    estado: data.uf || prev.endereco.estado,
                },
            }));
            setErros((prev) => {
                const resto = { ...prev };
                ["end_logradouro", "end_bairro", "end_cidade", "end_estado"].forEach((k) => delete resto[k]);
                return resto;
            });
            numeroRef.current?.focus();
        } catch (err) {
            console.error("Erro ao buscar CEP", err);
        } finally {
            setBuscandoCep(false);
        }
    };

    const atualizarAmbiente = (ambId, campo, valor) => {
        setAmbientes((prev) => prev.map((a) => (a.id === ambId ? { ...a, [campo]: valor } : a)));
        setErros((prev) => {
            if (!prev.amb?.[ambId]?.[campo] && !prev.ambientes) return prev;
            const amb = { ...(prev.amb || {}) };
            if (amb[ambId]) {
                const { [campo]: _r, ...resto } = amb[ambId];
                if (Object.keys(resto).length) amb[ambId] = resto; else delete amb[ambId];
            }
            const { ambientes: _a, ...semGeral } = prev;
            return { ...semGeral, amb };
        });
    };

    const adicionarAmbiente = () => setAmbientes((prev) => [...prev, novoAmbiente()]);

    const removerAmbiente = (ambId) => {
        const alvo = ambientes.find((a) => a.id === ambId);
        alvo?.fotos.forEach(liberarPreview);
        setAmbientes((prev) => (prev.length === 1 ? [novoAmbiente()] : prev.filter((a) => a.id !== ambId)));
    };

    const adicionarFotos = (ambId, lista) => {
        const arquivos = Array.from(lista);
        const limite = MAX_FOTO_MB * 1024 * 1024;
        const validos = arquivos.filter((f) => f.type.startsWith("image/") && f.size <= limite);
        const recusados = arquivos.length - validos.length;
        const ambiente = ambientes.find((item) => item.id === ambId);
        const usadas = ambientes.reduce((soma, item) => soma + item.fotos.length, 0);
        const vagaAmbiente = Math.max(0, MAX_FOTOS_AMBIENTE - (ambiente?.fotos.length || 0));
        const vagaTotal = Math.max(0, MAX_FOTOS_ESPACO - usadas);
        const aceitas = validos.slice(0, Math.min(vagaAmbiente, vagaTotal));
        const excedeu = validos.length - aceitas.length;

        const avisos = [];
        if (recusados > 0) avisos.push(`Use imagens de até ${MAX_FOTO_MB} MB.`);
        if (excedeu > 0) {
            avisos.push(`Cada cômodo aceita até ${MAX_FOTOS_AMBIENTE} fotos, e o anúncio até ${MAX_FOTOS_ESPACO}.`);
        }
        setAvisoFotos(avisos.join(" "));
        if (aceitas.length === 0) return;

        const novas = aceitas.map((file) => ({ id: novoId(), file, preview: URL.createObjectURL(file) }));
        setAmbientes((prev) =>
            prev.map((a) => (a.id === ambId ? { ...a, fotos: [...a.fotos, ...novas] } : a))
        );
        atualizarErroFotos(ambId);
    };

    const atualizarErroFotos = (ambId) =>
        setErros((prev) => {
            if (!prev.amb?.[ambId]?.fotos && !prev.ambientes) return prev;
            const amb = { ...(prev.amb || {}) };
            if (amb[ambId]) {
                const { fotos: _f, ...resto } = amb[ambId];
                if (Object.keys(resto).length) amb[ambId] = resto; else delete amb[ambId];
            }
            const { ambientes: _a, ...semGeral } = prev;
            return { ...semGeral, amb };
        });

    const removerFoto = (ambId, fotoId) => {
        const foto = ambientes.find((a) => a.id === ambId)?.fotos.find((f) => f.id === fotoId);
        if (foto) liberarPreview(foto);
        uploadsFeitos.current.delete(fotoId);
        setAmbientes((prev) =>
            prev.map((a) => (a.id === ambId ? { ...a, fotos: a.fotos.filter((f) => f.id !== fotoId) } : a))
        );
    };

    const formularioSujo = editando
        ? snapshotRef.current !== "" &&
          snapshotRef.current !== gerarAssinatura(form, ambientes, respostaLocador)
        : Boolean(
            form.titulo || form.descricao ||
            ambientes.some((a) => a.titulo || a.fotos.length > 0) ||
            documento.arquivo || seguranca.arquivo
        );

    const cancelar = () => {
        const aviso = editando
            ? "Descartar as alterações? O que você mudou não será salvo."
            : "Descartar este anúncio? As informações preenchidas serão perdidas.";
        if (formularioSujo && !window.confirm(aviso)) {
            return;
        }
        navigate(ROTA_PAINEL);
    };

    const finalizar = () => navigate(ROTA_PAINEL, { replace: true });

    const irParaTopo = () => {
        paginaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const rolarParaPrimeiroErro = () =>
        requestAnimationFrame(() =>
            paginaRef.current?.querySelector('[data-erro="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })
        );

    const errosDaEtapa = (numero) => {
        if (numero === 1) return validarEtapa1(form, ambientes);
        if (numero === 2) return validarEtapa2(form);
        if (numero === 4) {
            return validarEtapa4({
                editando,
                documento,
                seguranca,
                segurancaAberta,
                contratoLido,
                termosAceitos,
            });
        }
        return {};
    };

    const irParaEtapa = (numero) => {
        if (numero > etapa) return;
        setErros({});
        setErroEnvio("");
        setEtapa(numero);
        irParaTopo();
    };

    const avancar = () => {
        const novosErros = errosDaEtapa(etapa);
        setErros(novosErros);
        setErroEnvio("");
        if (temErros(novosErros)) {
            rolarParaPrimeiroErro();
            return;
        }
        setEtapa((atual) => Math.min(4, atual + 1));
        irParaTopo();
    };

    const voltarEtapa = () => {
        setErros({});
        setErroEnvio("");
        setEtapa((atual) => Math.max(1, atual - 1));
        irParaTopo();
    };

    const turnosAtuais = () => {
        if (!form.aceitaFracionado) return [];
        return calcularTurnos({
            abertura: form.horarioAbertura,
            fechamento: form.horarioFechamento,
            duracaoHoras: form.duracaoMaxHoras,
            limpezaMin: form.intervaloLimpezaMin === "" ? NaN : Number(form.intervaloLimpezaMin),
        }).turnos;
    };

    const enviarDocumento = async (espacoId, item) => {
        if (!item.tipo || !item.arquivo) return;
        const upload = await uploadDocumentoCloudinary(item.arquivo);
        await criarDocumentoEspaco(espacoId, {
            tipoDocumento: item.tipo,
            nomeArquivo: upload.nomeArquivo,
            arquivoUrl: upload.url,
            observacao: null,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (enviando) return;

        if (etapa < 4) {
            avancar();
            return;
        }

        if (!usuarioLogado?.id) {
            setErroEnvio("Sua sessão expirou. Entre novamente para salvar o espaço.");
            return;
        }

        const erros1 = validarEtapa1(form, ambientes);
        const erros2 = validarEtapa2(form);
        const erros4 = validarEtapa4({
            editando,
            documento,
            seguranca,
            segurancaAberta,
            contratoLido,
            termosAceitos,
        });
        const etapaComErro = temErros(erros1) ? 1 : temErros(erros2) ? 2 : temErros(erros4) ? 4 : 0;
        if (etapaComErro) {
            setEtapa(etapaComErro);
            setErros(etapaComErro === 1 ? erros1 : etapaComErro === 2 ? erros2 : erros4);
            irParaTopo();
            rolarParaPrimeiroErro();
            return;
        }

        const fracionado = form.aceitaFracionado;
        const valorBase = Number(form.valorDiaria);
        const preenchidos = ambientes.filter((a) => a.titulo.trim() || a.descricao.trim() || a.fotos.length > 0);

        setEnviando(true);
        setErroEnvio("");
        try {
            let salvo = espacoCriado;

            if (!salvo) {
                const fotosNovas = (a) => a.fotos.filter(ehFotoNova);
                const totalFotos = preenchidos.reduce((soma, a) => soma + fotosNovas(a).length, 0);
                let enviadas = preenchidos.reduce(
                    (soma, a) => soma + fotosNovas(a).filter((f) => uploadsFeitos.current.has(f.id)).length, 0
                );
                if (totalFotos > 0) setProgresso({ enviadas, total: totalFotos });

                const ambientesProcessados = [];
                for (const amb of preenchidos) {
                    const imagensUrls = await Promise.all(
                        amb.fotos.map(async (foto) => {
                            if (foto.url) return foto.url;
                            if (uploadsFeitos.current.has(foto.id)) return uploadsFeitos.current.get(foto.id);
                            const url = await enviarParaCloudinary(foto.file);
                            uploadsFeitos.current.set(foto.id, url);
                            enviadas += 1;
                            setProgresso({ enviadas, total: totalFotos });
                            return url;
                        })
                    );
                    ambientesProcessados.push({
                        titulo: amb.titulo.trim(),
                        descricao: amb.descricao.trim(),
                        imagensUrls,
                    });
                }

                setProgresso(null);

                const payload = {
                    locadorId: usuarioLogado.id,
                    titulo: form.titulo.trim(),
                    descricao: form.descricao.trim(),
                    capacidadePessoas: parseInt(form.capacidadePessoas, 10),
                    valorDiaria: valorBase,
                    valorMeioPeriodo: fracionado ? valorBase : null,
                    valorHora: null,
                    horarioAbertura: form.horarioAbertura,
                    horarioFechamento: form.horarioFechamento,
                    fechaNoDiaSeguinte: form.fechaNoDiaSeguinte,
                    permiteMeioPeriodo: form.aceitaFracionado,
                    permitePeriodoIntegral: form.aceitaIntegral,
                    permiteHorarioPersonalizado: false,
                    aprovacaoInstantanea: Boolean(form.aprovacaoInstantanea),
                    antecedenciaMinimaDias: form.antecedenciaMinimaDias === ""
                        ? 0
                        : parseInt(form.antecedenciaMinimaDias, 10),
                    prazoCancelamentoDias: form.prazoCancelamentoDias === ""
                        ? 2
                        : parseInt(form.prazoCancelamentoDias, 10),
                    duracaoMaxHoras: fracionado ? Number(form.duracaoMaxHoras) : null,
                    intervaloLimpezaMin: fracionado ? parseInt(form.intervaloLimpezaMin || "0", 10) : 0,
                    restricoesHorario: serializarRegras({
                        tiposEvento: form.tiposEvento,
                        regrasSom: form.regrasSom,
                        regrasLimpeza: form.regrasLimpeza,
                        regrasAcesso: form.regrasAcesso,
                        adicionais: form.adicionais,
                        turnos: turnosAtuais(),
                        antecedenciaMinimaDias: form.antecedenciaMinimaDias === ""
                            ? 0
                            : parseInt(form.antecedenciaMinimaDias, 10),
                    }) || null,
                    caracteristicas: form.caracteristicas,
                    endereco: {
                        ...form.endereco,
                        logradouro: form.endereco.logradouro.trim(),
                        numero: form.endereco.numero.trim(),
                        complemento: form.endereco.complemento.trim(),
                        bairro: form.endereco.bairro.trim(),
                        cidade: form.endereco.cidade.trim(),
                    },
                    ambientes: ambientesProcessados,
                };

                if (editando) {
                    payload.respostaLocador = respostaLocador.trim() || null;
                }

                const espacoId = editando ? id : null;
                const url = editando
                    ? `${API}/locadores/${usuarioLogado.id}/espacos/${espacoId}`
                    : `${API}/locadores/${usuarioLogado.id}/espacos`;

                const response = await fetch(url, {
                    method: editando ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const msg = await response.text();
                    throw new Error(msg || (editando ? "Falha ao salvar as alterações." : "Falha ao cadastrar o espaço."));
                }

                salvo = await response.json();
                if (!editando) setEspacoCriado(salvo);
            }

            if (salvo?.id) {
                if (documento.arquivo && !documentosEnviados.current.vinculo) {
                    await enviarDocumento(salvo.id, documento);
                    documentosEnviados.current.vinculo = true;
                }
                if (segurancaAberta && seguranca.arquivo && !documentosEnviados.current.seguranca) {
                    await enviarDocumento(salvo.id, seguranca);
                    documentosEnviados.current.seguranca = true;
                }
            }

            if (editando) {
                const estavaPendente = (espacoOriginal?.statusAprovacao || "").toUpperCase() === "PENDENTE";
                if (!estavaPendente && (salvo.statusAprovacao || "").toUpperCase() === "PENDENTE") {
                    window.alert(
                        "Alterações salvas. Como houve mudanças que precisam de análise, o anúncio voltou para pendente."
                    );
                }
            }

            finalizar();
        } catch (err) {
            console.error(err);
            setErroEnvio(err.message || "Não foi possível salvar o anúncio. Tente novamente.");
        } finally {
            setEnviando(false);
            setProgresso(null);
        }
    };

    const textoBotao = enviando
        ? progresso && progresso.total > 0
            ? `Enviando fotos ${progresso.enviadas}/${progresso.total}…`
            : "Salvando…"
        : etapa < 4
            ? "Avançar"
            : editando
                ? "Salvar alterações"
                : "Concluir cadastro";

    const rejeitado = (espacoOriginal?.statusAprovacao || "").toUpperCase() === "REJEITADO";
    const concluirBloqueado = !editando && etapa === 4 && (!contratoLido || !termosAceitos);

    const mensagemEtapa = erroEnvio
        || (temErros(erros) ? "Revise os campos destacados antes de continuar." : "");

    if (editando && carregando) {
        return (
            <div className="ne-page">
                <div className="ne-conteudo ne-topo">
                    <p className="ne-vazio" role="status">Carregando espaço…</p>
                </div>
            </div>
        );
    }

    if (editando && erroCarregar) {
        return (
            <div className="ne-page">
                <div className="ne-conteudo ne-topo">
                    <button type="button" className="ne-voltar" onClick={() => navigate(ROTA_PAINEL)}>
                        ‹ Voltar ao painel
                    </button>
                    <h1>Não foi possível abrir o espaço</h1>
                    <p className="ne-erro">{erroCarregar}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ne-page" ref={paginaRef}>
            <header className="ne-conteudo ne-topo">
                <button type="button" className="ne-voltar" onClick={cancelar}>
                    ‹ Voltar ao painel
                </button>
                <h1>{editando ? "Editar espaço" : "Cadastrar espaço"}</h1>
                <p>
                    {editando
                        ? "Atualize o anúncio em etapas. Mudanças de título, descrição, endereço, capacidade, valores ou fotos voltam para análise."
                        : "Quatro etapas: apresentação, horários, regras e documentos. Cada uma é conferida antes de avançar."}
                </p>
                {editando && rejeitado && espacoOriginal?.motivoRejeicao && (
                    <div className="rejeicao-box">
                        <strong>Motivo da rejeição:</strong> {espacoOriginal.motivoRejeicao}
                    </div>
                )}
                <BarraProgresso etapa={etapa} onIr={irParaEtapa} />
            </header>

            <form className="ne-form" onSubmit={handleSubmit} noValidate>
                <div className="ne-conteudo">
                    {etapa === 1 && (
                        <EtapaBasico
                            form={form}
                            erros={erros}
                            bind={bind}
                            bindEnd={bindEnd}
                            setEndereco={setEndereco}
                            handleCep={handleCep}
                            buscandoCep={buscandoCep}
                            cepNaoEncontrado={cepNaoEncontrado}
                            numeroRef={numeroRef}
                            toggleTipoEvento={toggleTipoEvento}
                            ambientes={ambientes}
                            avisoFotos={avisoFotos}
                            adicionarAmbiente={adicionarAmbiente}
                            removerAmbiente={removerAmbiente}
                            atualizarAmbiente={atualizarAmbiente}
                            adicionarFotos={adicionarFotos}
                            removerFoto={removerFoto}
                        />
                    )}
                    {etapa === 2 && (
                        <EtapaHorarios
                            form={form}
                            erros={erros}
                            bind={bind}
                            setCampo={setCampo}
                            setAdicional={setAdicional}
                        />
                    )}
                    {etapa === 3 && (
                        <EtapaRegras
                            form={form}
                            caracteristicasDisponiveis={caracteristicasDisponiveis}
                            toggleCaracteristica={toggleCaracteristica}
                            bind={bind}
                        />
                    )}
                    {etapa === 4 && (
                        <EtapaDocumentos
                            editando={editando}
                            erros={erros}
                            documento={documento}
                            setDocumento={setDocumento}
                            segurancaAberta={segurancaAberta}
                            abrirSeguranca={() => setSegurancaAberta(true)}
                            seguranca={seguranca}
                            setSeguranca={setSeguranca}
                            contratoLido={contratoLido}
                            marcarContratoLido={marcarContratoLido}
                            termosAceitos={termosAceitos}
                            setTermosAceitos={setTermosAceitos}
                            rejeitado={rejeitado}
                            motivoRejeicao={espacoOriginal?.motivoRejeicao}
                            respostaLocador={respostaLocador}
                            setRespostaLocador={setRespostaLocador}
                        />
                    )}

                    <div className="ne-acoes">
                        {mensagemEtapa && (
                            <p className="ne-acoes-msg" role="status">
                                <span className="ne-erro">{mensagemEtapa}</span>
                            </p>
                        )}
                        {!mensagemEtapa && etapa === 4 && (
                            <p className="ne-acoes-msg">
                                {editando
                                    ? "Ao salvar, o anúncio pode voltar para análise."
                                    : "Ao concluir, o comprovante é enviado e o anúncio segue para análise."}
                            </p>
                        )}
                        <div className="ne-acoes-botoes">
                            {etapa === 1 ? (
                                <button type="button" className="ne-btn ne-btn--ghost" onClick={cancelar} disabled={enviando}>
                                    Cancelar
                                </button>
                            ) : (
                                <button type="button" className="ne-btn ne-btn--ghost" onClick={voltarEtapa} disabled={enviando}>
                                    Voltar
                                </button>
                            )}
                            <button
                                type="submit"
                                className="ne-btn ne-btn--primario"
                                disabled={enviando || concluirBloqueado}
                            >
                                {textoBotao}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
