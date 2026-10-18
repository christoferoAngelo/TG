import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// O DocumentacaoEspacoModal depende das classes de modal do Dashboard.css
import "../dashboard/Dashboard.css";
import DocumentacaoEspacoModal from "../../components/documento/DocumentacaoEspacoModal";
import "./NovoEspaco.css";

// ⚠️ Ajuste para a rota real do DashboardLocador no seu router
const ROTA_PAINEL = "/perfil_locador";

const API = "http://localhost:8080/api";
const MAX_FOTO_MB = 10;

const ESTADO_INICIAL = {
    titulo: "",
    descricao: "",
    capacidadePessoas: "",
    valorDiaria: "",
    horarioAbertura: "",
    horarioFechamento: "",
    fechaNoDiaSeguinte: false, 
    permiteMeioPeriodo: true,
    permitePeriodoIntegral: true,
    permiteHorarioPersonalizado: false,
    duracaoMaxHoras: "",
    intervaloLimpezaMin: "0",
    restricoesHorario: "",
    caracteristicas: [],
    endereco: {
        cep: "", logradouro: "", numero: "", complemento: "",
        bairro: "", cidade: "", estado: "",
    },
};

let seq = 0;
const novoId = () => ++seq;
const novoAmbiente = () => ({ id: novoId(), titulo: "", descricao: "", fotos: [] });

const mascararCep = (valor) => {
    const d = valor.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

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

function validar(form, ambientesPreenchidos) {
    const e = {};
    const end = form.endereco;

    if (!form.titulo.trim()) e.titulo = "Dê um título ao anúncio.";
    if (!form.descricao.trim()) e.descricao = "Descreva o espaço para quem vai alugar.";
    if (!(parseInt(form.capacidadePessoas, 10) > 0)) e.capacidadePessoas = "Informe a capacidade (mínimo 1).";
    if (!(Number(form.valorDiaria) > 0)) e.valorDiaria = "Informe um valor de diária maior que zero.";

    if (!form.horarioAbertura) e.horarioAbertura = "Informe o horário de abertura.";
    
    // --- CORREÇÃO DA VALIDAÇÃO DE HORÁRIO ---
    if (!form.horarioFechamento) {
        e.horarioFechamento = "Informe o horário de fechamento.";
    } else if (!form.fechaNoDiaSeguinte && form.horarioAbertura && form.horarioFechamento <= form.horarioAbertura) {
        // Só gera erro se NÃO marcou a opção do dia seguinte E o fechamento for menor/igual à abertura
        e.horarioFechamento = "O fechamento precisa ser depois da abertura (ou marque a opção de fechar no dia seguinte).";
    }
    // ----------------------------------------

    if (!form.permiteMeioPeriodo && !form.permitePeriodoIntegral && !form.permiteHorarioPersonalizado) {
        e.modalidades = "Escolha pelo menos uma forma de locação.";
    }

    if (form.duracaoMaxHoras !== "") {
        const h = Number(form.duracaoMaxHoras);
        if (!(h > 0) || h > 99.99) e.duracaoMaxHoras = "Use um valor entre 0,01 e 99,99 horas.";
    }
    const limpeza = Number(form.intervaloLimpezaMin || 0);
    if (!Number.isInteger(limpeza) || limpeza < 0) e.intervaloLimpezaMin = "Use um número inteiro de minutos (0 ou mais).";

    if (end.cep.replace(/\D/g, "").length !== 8) e.end_cep = "Informe um CEP com 8 dígitos.";
    if (!end.logradouro.trim()) e.end_logradouro = "Informe a rua ou avenida.";
    if (!end.numero.trim()) e.end_numero = "Informe o número.";
    if (!end.bairro.trim()) e.end_bairro = "Informe o bairro.";
    if (!end.cidade.trim()) e.end_cidade = "Informe a cidade.";
    if (end.estado.trim().length !== 2) e.end_estado = "Use a sigla com 2 letras.";

    if (ambientesPreenchidos.length === 0) {
        e.ambientes = "Adicione pelo menos um cômodo com fotos.";
    } else {
        const amb = {};
        ambientesPreenchidos.forEach((a) => {
            const erroAmb = {};
            if (!a.titulo.trim()) erroAmb.titulo = "Dê um nome ao cômodo.";
            if (a.fotos.length === 0) erroAmb.fotos = "Adicione pelo menos uma foto.";
            if (Object.keys(erroAmb).length) amb[a.id] = erroAmb;
        });
        if (Object.keys(amb).length) e.amb = amb;
    }

    return e;
}

function Campo({ id, label, opcional, dica, erro, span = 6, children }) {
    return (
        <div
            className={`ne-campo ne-span-${span}${erro ? " ne-campo--erro" : ""}`}
            data-erro={erro ? "true" : undefined}
        >
            <label htmlFor={id}>
                {label}
                {opcional && <span className="ne-opcional"> (opcional)</span>}
            </label>
            {children}
            {dica && !erro && <small className="ne-dica">{dica}</small>}
            {erro && <small className="ne-erro">{erro}</small>}
        </div>
    );
}

export default function NovoEspaco() {
    const navigate = useNavigate();
    const { usuarioLogado } = useAuth();

    const [form, setForm] = useState(ESTADO_INICIAL);
    const [ambientes, setAmbientes] = useState(() => [novoAmbiente()]);
    const [caracteristicasDisponiveis, setCaracteristicasDisponiveis] = useState([]);
    const [erros, setErros] = useState({});
    const [avisoFotos, setAvisoFotos] = useState("");
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [progresso, setProgresso] = useState(null); // { enviadas, total } | null
    const [erroEnvio, setErroEnvio] = useState("");
    const [espacoCriado, setEspacoCriado] = useState(null);

    const numeroRef = useRef(null);
    // Guarda as URLs já enviadas ao Cloudinary: se o POST falhar, o reenvio não refaz os uploads
    const uploadsFeitos = useRef(new Map());
    // Referência atualizada para revogar as prévias ao sair da página
    const ambientesRef = useRef(ambientes);
    ambientesRef.current = ambientes;

    useEffect(() => {
        fetch(`${API}/caracteristicas`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setCaracteristicasDisponiveis(Array.isArray(data) ? data : []))
            .catch(() => setCaracteristicasDisponiveis([]));
    }, []);

    useEffect(() => () => {
        ambientesRef.current.forEach((a) => a.fotos.forEach((f) => URL.revokeObjectURL(f.preview)));
    }, []);

    /* ---------- helpers de estado ---------- */

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
        if (campo.startsWith("permite")) limparErro("modalidades");
    };

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

    /* ---------- CEP ---------- */

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

    /* ---------- cômodos e fotos ---------- */

    const atualizarAmbiente = (id, campo, valor) => {
        setAmbientes((prev) => prev.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)));
        setErros((prev) => {
            if (!prev.amb?.[id]?.[campo] && !prev.ambientes) return prev;
            const amb = { ...(prev.amb || {}) };
            if (amb[id]) {
                const { [campo]: _r, ...resto } = amb[id];
                if (Object.keys(resto).length) amb[id] = resto; else delete amb[id];
            }
            const { ambientes: _a, ...semGeral } = prev;
            return { ...semGeral, amb };
        });
    };

    const adicionarAmbiente = () => setAmbientes((prev) => [...prev, novoAmbiente()]);

    const removerAmbiente = (id) => {
        const alvo = ambientes.find((a) => a.id === id);
        alvo?.fotos.forEach((f) => URL.revokeObjectURL(f.preview));
        setAmbientes((prev) => (prev.length === 1 ? [novoAmbiente()] : prev.filter((a) => a.id !== id)));
    };

    const adicionarFotos = (ambId, lista) => {
        const arquivos = Array.from(lista);
        const limite = MAX_FOTO_MB * 1024 * 1024;
        const validos = arquivos.filter((f) => f.type.startsWith("image/") && f.size <= limite);
        const recusados = arquivos.length - validos.length;

        setAvisoFotos(
            recusados > 0
                ? `${recusados} arquivo(s) ignorado(s). Use imagens de até ${MAX_FOTO_MB} MB.`
                : ""
        );
        if (validos.length === 0) return;

        const novas = validos.map((file) => ({ id: novoId(), file, preview: URL.createObjectURL(file) }));
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
        if (foto) URL.revokeObjectURL(foto.preview);
        uploadsFeitos.current.delete(fotoId);
        setAmbientes((prev) =>
            prev.map((a) => (a.id === ambId ? { ...a, fotos: a.fotos.filter((f) => f.id !== fotoId) } : a))
        );
    };

    /* ---------- navegação ---------- */

    const formularioSujo =
        form.titulo || form.descricao || ambientes.some((a) => a.titulo || a.fotos.length > 0);

    const cancelar = () => {
        if (formularioSujo && !window.confirm("Descartar este anúncio? As informações preenchidas serão perdidas.")) {
            return;
        }
        navigate(ROTA_PAINEL);
    };

    const finalizar = () => navigate(ROTA_PAINEL, { replace: true });

    /* ---------- envio ---------- */

    const rolarParaPrimeiroErro = () =>
        requestAnimationFrame(() =>
            document.querySelector('[data-erro="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" })
        );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (enviando || espacoCriado) return;

        if (!usuarioLogado?.id) {
            setErroEnvio("Sua sessão expirou. Entre novamente para anunciar o espaço.");
            return;
        }

        const preenchidos = ambientes.filter((a) => a.titulo.trim() || a.descricao.trim() || a.fotos.length > 0);
        const novosErros = validar(form, preenchidos);
        setErros(novosErros);
        setErroEnvio("");

        if (Object.keys(novosErros).length > 0) {
            rolarParaPrimeiroErro();
            return;
        }

        setEnviando(true);
        try {
            const totalFotos = preenchidos.reduce((soma, a) => soma + a.fotos.length, 0);
            let enviadas = preenchidos.reduce(
                (soma, a) => soma + a.fotos.filter((f) => uploadsFeitos.current.has(f.id)).length, 0
            );
            setProgresso({ enviadas, total: totalFotos });

            const ambientesProcessados = [];
            for (const amb of preenchidos) {
                // Promise.all preserva a ordem das fotos
                const imagensUrls = await Promise.all(
                    amb.fotos.map(async (foto) => {
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
                valorDiaria: Number(form.valorDiaria),
                horarioAbertura: form.horarioAbertura,       // "HH:mm" → LocalTime
                horarioFechamento: form.horarioFechamento,
                fechaNoDiaSeguinte: form.fechaNoDiaSeguinte,
                permiteMeioPeriodo: form.permiteMeioPeriodo,
                permitePeriodoIntegral: form.permitePeriodoIntegral,
                permiteHorarioPersonalizado: form.permiteHorarioPersonalizado,
                duracaoMaxHoras: form.duracaoMaxHoras === "" ? null : Number(form.duracaoMaxHoras),
                intervaloLimpezaMin: parseInt(form.intervaloLimpezaMin || "0", 10),
                restricoesHorario: form.restricoesHorario.trim() || null,
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

            const response = await fetch(`${API}/locadores/${usuarioLogado.id}/espacos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || "Falha ao cadastrar o espaço.");
            }

            setEspacoCriado(await response.json());
        } catch (err) {
            console.error(err);
            setErroEnvio(err.message || "Não foi possível salvar o anúncio. Tente novamente.");
        } finally {
            setEnviando(false);
            setProgresso(null);
        }
    };

    const temErros = Object.keys(erros).length > 0;
    const textoBotao = enviando
        ? progresso
            ? `Enviando fotos ${progresso.enviadas}/${progresso.total}…`
            : "Salvando anúncio…"
        : "Publicar anúncio";

    /* ---------- render ---------- */

    return (
        <div className="ne-page">
            <header className="ne-conteudo ne-topo">
                <button type="button" className="ne-voltar" onClick={cancelar}>
                    ‹ Voltar ao painel
                </button>
                <h1>Anunciar novo espaço</h1>
                <p>
                    Preencha os dados do espaço e mostre cada cômodo com fotos. Depois de salvar,
                    você envia a documentação e o anúncio segue para aprovação.
                </p>
            </header>

            <form className="ne-form" onSubmit={handleSubmit} noValidate>
                <div className="ne-conteudo">

                    {/* ---------- Sobre o espaço ---------- */}
                    <section className="ne-secao">
                        <div className="ne-secao-cab">
                            <h2>Sobre o espaço</h2>
                            <p>O que aparece no topo do anúncio e na busca.</p>
                        </div>
                        <div className="ne-grid">
                            <Campo id="ne-titulo" label="Título do anúncio" erro={erros.titulo}>
                                <input
                                    type="text"
                                    className="ne-input"
                                    maxLength={150}
                                    placeholder="Ex: Sítio Recanto das Festas"
                                    {...bind("titulo")}
                                />
                            </Campo>
                            <Campo id="ne-descricao" label="Descrição geral" erro={erros.descricao}>
                                <textarea
                                    className="ne-textarea"
                                    rows={4}
                                    placeholder="Ex: Amplo espaço com área verde, ideal para confraternizações."
                                    {...bind("descricao")}
                                />
                            </Campo>
                            <Campo id="ne-capacidadePessoas" label="Capacidade (pessoas)" span={3} erro={erros.capacidadePessoas}>
                                <input
                                    type="number"
                                    min="1"
                                    inputMode="numeric"
                                    className="ne-input"
                                    placeholder="100"
                                    {...bind("capacidadePessoas")}
                                />
                            </Campo>
                            <Campo id="ne-valorDiaria" label="Valor da diária (R$)" span={3} erro={erros.valorDiaria}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    className="ne-input"
                                    placeholder="800,00"
                                    {...bind("valorDiaria")}
                                />
                            </Campo>
                        </div>
                    </section>

                    {/* ---------- Localização ---------- */}
                    <section className="ne-secao">
                        <div className="ne-secao-cab">
                            <h2>Localização</h2>
                            <p>Digite o CEP e completamos o restante do endereço.</p>
                        </div>
                        <div className="ne-grid">
                            <Campo
                                id="ne-end-cep"
                                label="CEP"
                                span={2}
                                erro={erros.end_cep || (cepNaoEncontrado ? "CEP não encontrado. Preencha o endereço manualmente." : "")}
                                dica={buscandoCep ? "Buscando endereço…" : undefined}
                            >
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="ne-input"
                                    placeholder="00000-000"
                                    {...bindEnd("cep")}
                                    onChange={(e) => handleCep(e.target.value)}
                                />
                            </Campo>
                            <Campo id="ne-end-logradouro" label="Rua ou avenida" span={4} erro={erros.end_logradouro}>
                                <input type="text" className="ne-input" {...bindEnd("logradouro")} />
                            </Campo>
                            <Campo id="ne-end-numero" label="Número" span={2} erro={erros.end_numero}>
                                <input type="text" className="ne-input" ref={numeroRef} {...bindEnd("numero")} />
                            </Campo>
                            <Campo id="ne-end-complemento" label="Complemento" opcional span={4}>
                                <input
                                    type="text"
                                    className="ne-input"
                                    placeholder="Salão 2, Bloco B…"
                                    {...bindEnd("complemento")}
                                />
                            </Campo>
                            <Campo id="ne-end-bairro" label="Bairro" span={3} erro={erros.end_bairro}>
                                <input type="text" className="ne-input" {...bindEnd("bairro")} />
                            </Campo>
                            <Campo id="ne-end-cidade" label="Cidade" span={2} erro={erros.end_cidade}>
                                <input type="text" className="ne-input" {...bindEnd("cidade")} />
                            </Campo>
                            <Campo id="ne-end-estado" label="UF" span={1} erro={erros.end_estado}>
                                <input
                                    type="text"
                                    className="ne-input"
                                    maxLength={2}
                                    placeholder="SP"
                                    value={form.endereco.estado}
                                    id="ne-end-estado"
                                    aria-invalid={erros.end_estado ? "true" : undefined}
                                    onChange={(e) => setEndereco("estado", e.target.value.toUpperCase())}
                                />
                            </Campo>
                        </div>
                    </section>

                    {/* ---------- Funcionamento e locação ---------- */}
                    <section className="ne-secao">
                        <div className="ne-secao-cab">
                            <h2>Funcionamento e locação</h2>
                            <p>Quando o espaço abre e de que formas ele pode ser reservado.</p>
                        </div>
                        <div className="ne-grid">
                            <Campo id="ne-horarioAbertura" label="Abre às" span={3} erro={erros.horarioAbertura}>
                                <input type="time" className="ne-input" {...bind("horarioAbertura")} />
                            </Campo>
                            <Campo id="ne-horarioFechamento" label="Fecha às" span={3} erro={erros.horarioFechamento}>
                                <input type="time" className="ne-input" {...bind("horarioFechamento")} />
                            </Campo>

                            {/* --- CHECKBOX PARA DIAS DIFERENTES --- */}
                            <div className="ne-campo ne-span-6">
                                <label className="ne-opcao" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.fechaNoDiaSeguinte}
                                        onChange={(e) => setForm(prev => ({ ...prev, fechaNoDiaSeguinte: e.target.checked }))}
                                    />
                                    <span className="ne-opcao-titulo">O horário de fechamento é no dia seguinte (ex: festa que invade a madrugada)</span>
                                </label>
                            </div>
                            {/* ------------------------------------- */}

                            <div
                                className={`ne-campo ne-span-6${erros.modalidades ? " ne-campo--erro" : ""}`}
                                data-erro={erros.modalidades ? "true" : undefined}
                            >
                                <span className="ne-rotulo">Formas de locação</span>
                                <div className="ne-opcoes">
                                    {[
                                        ["permiteMeioPeriodo", "Meio período", "Reserva de parte do dia."],
                                        ["permitePeriodoIntegral", "Período integral", "Reserva do dia inteiro."],
                                        ["permiteHorarioPersonalizado", "Horário personalizado", "O locatário escolhe início e fim."],
                                    ].map(([campo, titulo, dica]) => (
                                        <label
                                            key={campo}
                                            className={`ne-opcao${form[campo] ? " ne-opcao--ativa" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form[campo]}
                                                onChange={(e) => setCampo(campo, e.target.checked)}
                                            />
                                            <span className="ne-opcao-titulo">{titulo}</span>
                                            <span className="ne-opcao-dica">{dica}</span>
                                        </label>
                                    ))}
                                </div>
                                {erros.modalidades && <small className="ne-erro">{erros.modalidades}</small>}
                            </div>

                            <Campo
                                id="ne-duracaoMaxHoras"
                                label="Duração máxima (horas)"
                                opcional
                                span={3}
                                erro={erros.duracaoMaxHoras}
                                dica="Deixe em branco para não limitar."
                            >
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    inputMode="decimal"
                                    className="ne-input"
                                    placeholder="Ex: 8"
                                    {...bind("duracaoMaxHoras")}
                                />
                            </Campo>
                            <Campo
                                id="ne-intervaloLimpezaMin"
                                label="Intervalo para limpeza (minutos)"
                                span={3}
                                erro={erros.intervaloLimpezaMin}
                                dica="Tempo livre entre um evento e outro."
                            >
                                <input
                                    type="number"
                                    min="0"
                                    step="5"
                                    inputMode="numeric"
                                    className="ne-input"
                                    {...bind("intervaloLimpezaMin")}
                                />
                            </Campo>
                            <Campo id="ne-restricoesHorario" label="Restrições de horário" opcional>
                                <input
                                    type="text"
                                    className="ne-input"
                                    maxLength={255}
                                    placeholder="Ex: Som alto até as 20h"
                                    {...bind("restricoesHorario")}
                                />
                            </Campo>
                        </div>
                    </section>

                    {/* ---------- Características ---------- */}
                    <section className="ne-secao">
                        <div className="ne-secao-cab">
                            <h2>Características</h2>
                            <p>Marque o que o espaço oferece.</p>
                        </div>
                        <div>
                            {caracteristicasDisponiveis.length === 0 ? (
                                <p className="ne-vazio">Nenhuma característica cadastrada no sistema.</p>
                            ) : (
                                <div className="ne-chips">
                                    {caracteristicasDisponiveis.map((item) => {
                                        const marcado = form.caracteristicas.some((c) => c.id === item.id);
                                        return (
                                            <label key={item.id} className="ne-chip">
                                                <input
                                                    type="checkbox"
                                                    className="ne-sr"
                                                    checked={marcado}
                                                    onChange={() => toggleCaracteristica(item)}
                                                />
                                                <span className={marcado ? "ne-chip-ativo" : ""}>{item.nome}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ---------- Cômodos e fotos ---------- */}
                    <section className="ne-secao">
                        <div className="ne-secao-cab">
                            <h2>Cômodos e fotos</h2>
                            <p>Mostre cada ambiente separado: salão, cozinha, área externa, quartos…</p>
                        </div>
                        <div
                            className="ne-ambientes"
                            data-erro={erros.ambientes ? "true" : undefined}
                        >
                            {erros.ambientes && <p className="ne-erro ne-erro--bloco">{erros.ambientes}</p>}
                            {avisoFotos && <p className="ne-aviso">{avisoFotos}</p>}

                            {ambientes.map((amb, i) => {
                                const erroAmb = erros.amb?.[amb.id] || {};
                                return (
                                    <article className="ne-ambiente" key={amb.id}>
                                        <div className="ne-ambiente-cab">
                                            <h3>Cômodo {i + 1}</h3>
                                            {(ambientes.length > 1 || amb.titulo || amb.fotos.length > 0) && (
                                                <button
                                                    type="button"
                                                    className="ne-btn ne-btn--perigo"
                                                    onClick={() => removerAmbiente(amb.id)}
                                                >
                                                    Remover
                                                </button>
                                            )}
                                        </div>

                                        <div className="ne-grid">
                                            <Campo id={`ne-amb-${amb.id}-titulo`} label="Nome do cômodo" erro={erroAmb.titulo}>
                                                <input
                                                    id={`ne-amb-${amb.id}-titulo`}
                                                    type="text"
                                                    className="ne-input"
                                                    maxLength={100}
                                                    placeholder="Ex: Cozinha completa, Área gourmet…"
                                                    value={amb.titulo}
                                                    aria-invalid={erroAmb.titulo ? "true" : undefined}
                                                    onChange={(e) => atualizarAmbiente(amb.id, "titulo", e.target.value)}
                                                />
                                            </Campo>
                                            <Campo id={`ne-amb-${amb.id}-descricao`} label="O que tem neste cômodo" opcional>
                                                <input
                                                    id={`ne-amb-${amb.id}-descricao`}
                                                    type="text"
                                                    className="ne-input"
                                                    placeholder="Ex: Fogão, forno, freezer, utensílios básicos"
                                                    value={amb.descricao}
                                                    onChange={(e) => atualizarAmbiente(amb.id, "descricao", e.target.value)}
                                                />
                                            </Campo>
                                        </div>

                                        <div
                                            className={`ne-fotos${erroAmb.fotos ? " ne-campo--erro" : ""}`}
                                            data-erro={erroAmb.fotos ? "true" : undefined}
                                        >
                                            {amb.fotos.map((foto) => (
                                                <figure className="ne-foto" key={foto.id}>
                                                    <img src={foto.preview} alt={`Prévia: ${amb.titulo || "cômodo"}`} />
                                                    <button
                                                        type="button"
                                                        className="ne-foto-remover"
                                                        aria-label={`Remover foto ${foto.file.name}`}
                                                        onClick={() => removerFoto(amb.id, foto.id)}
                                                    >
                                                        ×
                                                    </button>
                                                </figure>
                                            ))}
                                            <label className="ne-foto-add">
                                                <input
                                                    type="file"
                                                    className="ne-sr"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => {
                                                        adicionarFotos(amb.id, e.target.files);
                                                        e.target.value = "";
                                                    }}
                                                />
                                                <span className="ne-foto-add-mais">+</span>
                                                <span>{amb.fotos.length === 0 ? "Adicionar fotos" : "Mais fotos"}</span>
                                            </label>
                                        </div>
                                        {erroAmb.fotos && <small className="ne-erro">{erroAmb.fotos}</small>}
                                    </article>
                                );
                            })}

                            <button type="button" className="ne-btn ne-btn--ghost ne-btn--largo" onClick={adicionarAmbiente}>
                                + Adicionar outro cômodo
                            </button>
                        </div>
                    </section>
                </div>

                {/* ---------- Barra de ações fixa ---------- */}
                <div className="ne-barra">
                    <div className="ne-barra-inner">
                        <p className="ne-barra-msg" role="status">
                            {erroEnvio
                                ? <span className="ne-erro">{erroEnvio}</span>
                                : temErros
                                    ? <span className="ne-erro">Revise os campos destacados.</span>
                                    : "Seu anúncio será analisado antes de aparecer na busca."}
                        </p>
                        <div className="ne-barra-acoes">
                            <button
                                type="button"
                                className="ne-btn ne-btn--ghost"
                                onClick={cancelar}
                                disabled={enviando || !!espacoCriado}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="ne-btn ne-btn--primario"
                                disabled={enviando || !!espacoCriado}
                            >
                                {textoBotao}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {espacoCriado && (
                <DocumentacaoEspacoModal
                    espaco={espacoCriado}
                    onClose={finalizar}
                    onConcluir={finalizar}
                />
            )}
        </div>
    );
}
