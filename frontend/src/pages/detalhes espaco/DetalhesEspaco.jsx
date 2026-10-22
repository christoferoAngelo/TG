import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeaderHome from "../home/components/HeaderHome";
import { useAuth } from "../../contexts/AuthContext";
import "./DetalhesEspaco.css";

const API = "http://localhost:8080/api";
const ROTA_LOGIN = "/login";

const hhmm = (t) => {
    if (!t) return "";
    if (Array.isArray(t)) return `${String(t[0]).padStart(2, "0")}:${String(t[1] ?? 0).padStart(2, "0")}`;
    return String(t).slice(0, 5);
};

const moeda = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const horas = (v) => `${String(Number(v)).replace(".", ",")} h`;

const hojeISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

const chavePeriodo = (p) => (p.modalidade === "MEIO_PERIODO" ? `MEIO_PERIODO-${p.periodo}` : p.modalidade);
const rotuloPeriodo = (p) => (p.modalidade === "INTEGRAL" ? "Dia inteiro" : `Período ${p.periodo}`);

export default function DetalhesEspaco() {
    const { id } = useParams();
    const { usuarioLogado } = useAuth();
    const navigate = useNavigate();

    const [espaco, setEspaco] = useState(null);
    const [carregando, setCarregando] = useState(true);

    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true);

    const [lightbox, setLightbox] = useState(null);

    // Reserva
    const [data, setData] = useState("");
    const [disp, setDisp] = useState(null);
    const [carregandoDisp, setCarregandoDisp] = useState(false);
    const [erroDisp, setErroDisp] = useState("");
    const [recarga, setRecarga] = useState(0);
    const [escolha, setEscolha] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [observacao, setObservacao] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erroReserva, setErroReserva] = useState("");
    const [sucesso, setSucesso] = useState(false);

    const handlePesquisar = (termo) => {
        navigate(termo ? `/home?q=${encodeURIComponent(termo)}` : "/home");
    };

    /* ---------- carga de dados ---------- */

    useEffect(() => {
        setCarregando(true);
        fetch(`${API}/locadores/espacos/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar o espaço");
                return res.json();
            })
            .then(setEspaco)
            .catch((err) => {
                console.error("Erro:", err);
                setEspaco(null);
            })
            .finally(() => setCarregando(false));
    }, [id]);

    useEffect(() => {
        fetch(`${API}/reservas/espaco/${id}/avaliacoes`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar avaliações");
                return res.json();
            })
            .then((lista) => setAvaliacoes(Array.isArray(lista) ? lista : []))
            .catch((err) => console.error("Erro ao buscar avaliações:", err))
            .finally(() => setCarregandoAvaliacoes(false));
    }, [id]);

    useEffect(() => {
        if (!data) {
            setDisp(null);
            setErroDisp("");
            return;
        }
        let ativo = true;
        setCarregandoDisp(true);
        setErroDisp("");
        setEscolha("");

        fetch(`${API}/reservas/espaco/${id}/disponibilidade?data=${data}`)
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error((await res.text()) || "Não foi possível consultar a disponibilidade.");
                }
                return res.json();
            })
            .then((d) => ativo && setDisp(d))
            .catch((e) => {
                if (!ativo) return;
                setDisp(null);
                setErroDisp(e.message);
            })
            .finally(() => ativo && setCarregandoDisp(false));

        return () => {
            ativo = false;
        };
    }, [id, data, recarga]);

    /* ---------- fotos ---------- */

    const fotos = useMemo(() => {
        const lista = [];
        const inicios = [];
        (espaco?.ambientes || []).forEach((amb) => {
            inicios.push(lista.length);
            (amb.imagensUrls || []).forEach((url, i) => lista.push({ url, ambiente: amb.titulo, n: i + 1 }));
        });
        return { lista, inicios };
    }, [espaco]);

    const totalFotos = fotos.lista.length;
    const lightboxAberto = lightbox !== null;

    useEffect(() => {
        if (!lightboxAberto) return;
        const aoTeclar = (e) => {
            if (e.key === "Escape") setLightbox(null);
            if (e.key === "ArrowRight") setLightbox((i) => (i + 1) % totalFotos);
            if (e.key === "ArrowLeft") setLightbox((i) => (i - 1 + totalFotos) % totalFotos);
        };
        window.addEventListener("keydown", aoTeclar);
        const anterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", aoTeclar);
            document.body.style.overflow = anterior;
        };
    }, [lightboxAberto, totalFotos]);

    /* ---------- derivados calculados com Hooks (no topo) ---------- */

    const periodoAtual = disp?.periodos?.find((p) => chavePeriodo(p) === escolha);

    const precoAtual = useMemo(() => {
        if (!espaco) return { valor: 0, rotulo: "por diária" };

        if (escolha === "PERSONALIZADO") {
            const valorHora = Number(espaco.valorHora || espaco.valorDiaria || 0);
            if (horaInicio && horaFim) {
                const [hIni, mIni] = horaInicio.split(":").map(Number);
                const [hFim, mFim] = horaFim.split(":").map(Number);
                const diffMinutos = (hFim * 60 + mFim) - (hIni * 60 + mIni);
                const horasTotais = diffMinutos > 0 ? diffMinutos / 60 : 0;
                return {
                    valor: horasTotais * valorHora,
                    rotulo: `para ${horasTotais.toFixed(1).replace(".", ",")}h (${moeda(valorHora)}/h)`
                };
            }
            return { valor: valorHora, rotulo: "por hora" };
        }

        if (periodoAtual?.modalidade === "MEIO_PERIODO") {
            return { valor: espaco.valorMeioPeriodo ?? espaco.valorDiaria, rotulo: "por meio período" };
        }
        return { valor: espaco.valorDiaria, rotulo: "por diária" };
    }, [escolha, periodoAtual, espaco, horaInicio, horaFim]);

    /* ---------- reserva ---------- */

    const handleReservar = async (e) => {
        e.preventDefault();
        setErroReserva("");

        if (!usuarioLogado?.id) {
            navigate(ROTA_LOGIN);
            return;
        }
        if (!data) return setErroReserva("Escolha a data do evento.");
        if (!escolha) return setErroReserva("Escolha um período.");

        const corpo = {
            espacoId: Number(id),
            dataEvento: data,
            observacao: observacao.trim() || null,
        };

        let valorTotalCalculado = Number(espaco.valorDiaria);

        if (escolha === "PERSONALIZADO") {
            if (!horaInicio || !horaFim) return setErroReserva("Informe o horário de início e de fim.");
            corpo.modalidade = "PERSONALIZADO";
            corpo.horaInicio = horaInicio;
            corpo.horaFim = horaFim;

            const [hIni, mIni] = horaInicio.split(":").map(Number);
            const [hFim, mFim] = horaFim.split(":").map(Number);
            const diffMinutos = (hFim * 60 + mFim) - (hIni * 60 + mIni);
            const horasTotais = diffMinutos > 0 ? diffMinutos / 60 : 0;
            const valorHora = Number(espaco.valorHora || espaco.valorDiaria || 0);
            valorTotalCalculado = horasTotais * valorHora;
        } else {
            const periodo = disp.periodos.find((p) => chavePeriodo(p) === escolha);
            corpo.modalidade = periodo.modalidade;
            if (periodo.periodo) corpo.periodo = periodo.periodo;

            if (periodo.modalidade === "MEIO_PERIODO") {
                valorTotalCalculado = Number(espaco.valorMeioPeriodo ?? espaco.valorDiaria);
            } else {
                valorTotalCalculado = Number(espaco.valorDiaria);
            }
        }

        corpo.valorTotal = valorTotalCalculado;

        setEnviando(true);
        try {
            const response = await fetch(`${API}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Usuario-Id": usuarioLogado.id },
                body: JSON.stringify(corpo),
            });

            if (!response.ok) {
                throw new Error((await response.text()) || "Erro ao solicitar reserva.");
            }

            setSucesso(true);
            setData("");
            setObservacao("");
            setHoraInicio("");
            setHoraFim("");
            setRecarga((n) => n + 1);
        } catch (err) {
            console.error("Erro:", err);
            setErroReserva(err.message);
        } finally {
            setEnviando(false);
        }
    };

    /* ---------- estados de tela ---------- */

    if (carregando) {
        return (
            <div className="dt-page">
                <HeaderHome onSearch={handlePesquisar} />
                <div className="dt-estado">
                    <p>Carregando detalhes do espaço…</p>
                </div>
            </div>
        );
    }

    if (!espaco) {
        return (
            <div className="dt-page">
                <HeaderHome onSearch={handlePesquisar} />
                <div className="dt-estado">
                    <h2>Espaço não encontrado</h2>
                    <p>Ele pode ter sido removido ou estar indisponível no momento.</p>
                    <button type="button" className="dt-btn dt-btn--ghost" onClick={() => navigate(-1)}>
                        Voltar para a página anterior
                    </button>
                </div>
            </div>
        );
    }

    const aceitaMeio = espaco.permiteMeioPeriodo !== false;
    const aceitaIntegral = espaco.permitePeriodoIntegral !== false;
    const aceitaPersonalizado = espaco.permiteHorarioPersonalizado === true;
    const formasDeLocacao = [
        aceitaIntegral && "Dia inteiro",
        aceitaMeio && "Meio período",
        aceitaPersonalizado && "Horário personalizado",
    ].filter(Boolean);

    const qtdHero = totalFotos >= 5 ? 5 : totalFotos >= 3 ? 3 : totalFotos;
    const endereco = [espaco.endereco?.bairro, espaco.endereco?.cidade].filter(Boolean).join(", ");
    const enderecoCompleto = espaco.endereco?.estado ? `${endereco} - ${espaco.endereco.estado}` : endereco;
    const nota = espaco.notaMedia ? Number(espaco.notaMedia) : null;
    const qtdAvaliacoes = espaco.quantidadeAvaliacoes || 0;
    const textoAvaliacoes = `${qtdAvaliacoes} avaliaç${qtdAvaliacoes === 1 ? "ão" : "ões"}`;

    return (
        <div className="dt-page">
            <main className="dt-container">
                <button type="button" className="dt-voltar" onClick={() => navigate(-1)}>
                    ‹ Voltar
                </button>

                <header className="dt-titulo">
                    <h1>{espaco.titulo}</h1>
                    <p className="dt-meta">
                        {nota ? (
                            <a href="#avaliacoes" className="dt-nota">
                                <span className="dt-estrela" aria-hidden="true">★</span>
                                <strong>{nota.toFixed(1)}</strong>
                                <span>{textoAvaliacoes}</span>
                            </a>
                        ) : (
                            <span className="dt-sem-nota">Ainda sem avaliações</span>
                        )}
                        {enderecoCompleto && <span className="dt-local">{enderecoCompleto}</span>}
                    </p>
                </header>

                {/* ---------- Galeria ---------- */}
                {totalFotos > 0 ? (
                    <section className={`dt-hero dt-hero--${qtdHero}`} aria-label="Fotos do espaço">
                        {fotos.lista.slice(0, qtdHero).map((foto, i) => (
                            <button
                                type="button"
                                key={foto.url + i}
                                className="dt-hero-foto"
                                onClick={() => setLightbox(i)}
                                aria-label={`Ampliar foto: ${foto.ambiente}`}
                            >
                                <img src={foto.url} alt={`${foto.ambiente}, foto ${foto.n}`} />
                            </button>
                        ))}
                        {totalFotos > qtdHero && (
                            <button type="button" className="dt-hero-todas" onClick={() => setLightbox(0)}>
                                Ver todas as {totalFotos} fotos
                            </button>
                        )}
                    </section>
                ) : (
                    <div className="dt-hero-vazio">Este anúncio ainda não tem fotos.</div>
                )}

                <div className="dt-layout">
                    <div className="dt-principal">
                        {/* ---------- Sobre ---------- */}
                        <section className="dt-secao">
                            <h2>Sobre o espaço</h2>
                            <p className="dt-descricao">{espaco.descricao}</p>

                            <dl className="dt-fatos">
                                <div>
                                    <dt>Capacidade</dt>
                                    <dd>Até {espaco.capacidadePessoas} pessoas</dd>
                                </div>
                                {espaco.horarioAbertura && espaco.horarioFechamento && (
                                    <div>
                                        <dt>Funcionamento</dt>
                                        <dd>
                                            {hhmm(espaco.horarioAbertura)} às {hhmm(espaco.horarioFechamento)}
                                        </dd>
                                    </div>
                                )}
                                {espaco.duracaoMaxHoras && (
                                    <div>
                                        <dt>Duração máxima</dt>
                                        <dd>{horas(espaco.duracaoMaxHoras)} por locação</dd>
                                    </div>
                                )}
                                {espaco.intervaloLimpezaMin > 0 && (
                                    <div>
                                        <dt>Limpeza entre eventos</dt>
                                        <dd>{espaco.intervaloLimpezaMin} minutos</dd>
                                    </div>
                                )}
                                {formasDeLocacao.length > 0 && (
                                    <div className="dt-fato-largo">
                                        <dt>Formas de locação</dt>
                                        <dd>{formasDeLocacao.join(", ")}</dd>
                                    </div>
                                )}
                            </dl>

                            {espaco.restricoesHorario && (
                                <div className="dt-aviso">
                                    <strong>Regras e restrições</strong>
                                    <p>{espaco.restricoesHorario}</p>
                                </div>
                            )}
                        </section>

                        {/* ---------- Cômodos ---------- */}
                        {espaco.ambientes?.length > 0 && (
                            <section className="dt-secao">
                                <h2>Conheça cada ambiente</h2>
                                <div className="dt-ambientes">
                                    {espaco.ambientes.map((amb, idx) => (
                                        <article key={amb.id ?? idx} className="dt-ambiente">
                                            <div className="dt-ambiente-info">
                                                <h3>{amb.titulo}</h3>
                                                {amb.descricao && <p>{amb.descricao}</p>}
                                            </div>
                                            {amb.imagensUrls?.length > 0 ? (
                                                <div className="dt-galeria">
                                                    {amb.imagensUrls.map((url, i) => (
                                                        <button
                                                            type="button"
                                                            key={url + i}
                                                            className="dt-galeria-foto"
                                                            onClick={() => setLightbox(fotos.inicios[idx] + i)}
                                                            aria-label={`Ampliar ${amb.titulo}, foto ${i + 1}`}
                                                        >
                                                            <img src={url} alt={`${amb.titulo}, foto ${i + 1}`} loading="lazy" />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="dt-vazio">Sem fotos para este cômodo.</p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ---------- Características ---------- */}
                        {espaco.caracteristicas?.length > 0 && (
                            <section className="dt-secao">
                                <h2>O que o espaço oferece</h2>
                                <ul className="dt-tags">
                                    {espaco.caracteristicas.map((c) => (
                                        <li key={c.id}>{c.nome}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* ---------- Avaliações ---------- */}
                        <section className="dt-secao" id="avaliacoes">
                            <h2>
                                Avaliações
                                {nota && (
                                    <span className="dt-titulo-nota">
                                        <span className="dt-estrela" aria-hidden="true">★</span> {nota.toFixed(1)} ({qtdAvaliacoes})
                                    </span>
                                )}
                            </h2>

                            {carregandoAvaliacoes ? (
                                <p className="dt-vazio">Carregando avaliações…</p>
                            ) : avaliacoes.length === 0 ? (
                                <p className="dt-vazio">Este espaço ainda não recebeu nenhuma avaliação.</p>
                            ) : (
                                <div className="dt-avaliacoes">
                                    {avaliacoes.map((av, i) => (
                                        <article key={i} className="dt-avaliacao">
                                            <header>
                                                <strong>{av.nomeLocatario}</strong>
                                                <time>{new Date(av.dataAvaliacao).toLocaleDateString("pt-BR")}</time>
                                            </header>
                                            <p className="dt-estrelas" aria-label={`Nota ${av.nota} de 5`}>
                                                {"★".repeat(av.nota)}
                                                <span className="dt-estrelas-vazias">{"★".repeat(5 - av.nota)}</span>
                                            </p>
                                            {av.comentario && <p className="dt-comentario">{av.comentario}</p>}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ---------- Cartão de reserva ---------- */}
                    <aside className="dt-lateral">
                        <form className="dt-reserva" id="reserva" onSubmit={handleReservar} noValidate>
                            <p className="dt-preco">
                                <strong>{moeda(precoAtual.valor)}</strong> <span>{precoAtual.rotulo}</span>
                            </p>

                            {sucesso && (
                                <div className="dt-sucesso" role="status">
                                    <strong>Solicitação enviada.</strong>
                                    <p>O locador vai analisar o pedido e responder em breve.</p>
                                </div>
                            )}

                            <div className="dt-campo">
                                <label htmlFor="dt-data">Data do evento</label>
                                <input
                                    id="dt-data"
                                    type="date"
                                    className="dt-input"
                                    min={hojeISO()}
                                    value={data}
                                    onChange={(e) => {
                                        setData(e.target.value);
                                        setSucesso(false);
                                        setErroReserva("");
                                    }}
                                />
                            </div>

                            {carregandoDisp && <p className="dt-dica">Consultando horários…</p>}
                            {erroDisp && <p className="dt-erro">{erroDisp}</p>}

                            {disp && (
                                <fieldset className="dt-periodos">
                                    <legend>Período</legend>

                                    {disp.periodos.length === 0 && !disp.aceitaHorarioPersonalizado && (
                                        <p className="dt-dica">Este espaço não tem períodos disponíveis para reserva.</p>
                                    )}

                                    {disp.periodos.map((p) => {
                                        const chave = chavePeriodo(p);
                                        return (
                                            <label
                                                key={chave}
                                                className={`dt-periodo${escolha === chave ? " dt-periodo--ativo" : ""}${!p.disponivel ? " dt-periodo--off" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="periodo"
                                                    value={chave}
                                                    disabled={!p.disponivel}
                                                    checked={escolha === chave}
                                                    onChange={() => {
                                                        setEscolha(chave);
                                                        setErroReserva("");
                                                    }}
                                                />
                                                <span className="dt-periodo-nome">{rotuloPeriodo(p)}</span>
                                                <span className="dt-periodo-hora">
                                                    {hhmm(p.horaInicio)} às {hhmm(p.horaFim)}
                                                </span>
                                                {!p.disponivel && <span className="dt-periodo-status">Indisponível</span>}
                                            </label>
                                        );
                                    })}

                                    {disp.aceitaHorarioPersonalizado && (
                                        <label
                                            className={`dt-periodo${escolha === "PERSONALIZADO" ? " dt-periodo--ativo" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="periodo"
                                                value="PERSONALIZADO"
                                                checked={escolha === "PERSONALIZADO"}
                                                onChange={() => {
                                                    setEscolha("PERSONALIZADO");
                                                    setErroReserva("");
                                                }}
                                            />
                                            <span className="dt-periodo-nome">Horário personalizado</span>
                                            <span className="dt-periodo-hora">
                                                Entre {hhmm(disp.horarioAbertura)} e {hhmm(disp.horarioFechamento)}
                                            </span>
                                        </label>
                                    )}

                                    {escolha === "PERSONALIZADO" && (
                                        <div className="dt-horas">
                                            <div className="dt-campo">
                                                <label htmlFor="dt-ini">Início</label>
                                                <input
                                                    id="dt-ini"
                                                    type="time"
                                                    className="dt-input"
                                                    min={hhmm(disp.horarioAbertura)}
                                                    max={hhmm(disp.horarioFechamento)}
                                                    value={horaInicio}
                                                    onChange={(e) => setHoraInicio(e.target.value)}
                                                />
                                            </div>
                                            <div className="dt-campo">
                                                <label htmlFor="dt-fim">Fim</label>
                                                <input
                                                    id="dt-fim"
                                                    type="time"
                                                    className="dt-input"
                                                    min={hhmm(disp.horarioAbertura)}
                                                    max={hhmm(disp.horarioFechamento)}
                                                    value={horaFim}
                                                    onChange={(e) => setHoraFim(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {disp.ocupados?.length > 0 && (
                                        <p className="dt-dica">
                                            Já reservado neste dia:{" "}
                                            {disp.ocupados.map((o) => `${hhmm(o.horaInicio)} às ${hhmm(o.horaFim)}`).join(", ")}.
                                        </p>
                                    )}
                                </fieldset>
                            )}

                            <div className="dt-campo">
                                <label htmlFor="dt-obs">
                                    Tipo de evento <span className="dt-opcional">(opcional)</span>
                                </label>
                                <textarea
                                    id="dt-obs"
                                    rows={3}
                                    className="dt-input"
                                    maxLength={500}
                                    placeholder="Ex: Aniversário para 50 pessoas"
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                />
                            </div>

                            {erroReserva && <p className="dt-erro" role="alert">{erroReserva}</p>}

                            <button type="submit" className="dt-btn dt-btn--primario dt-btn--largo" disabled={enviando}>
                                {enviando
                                    ? "Enviando…"
                                    : usuarioLogado?.id
                                        ? "Solicitar reserva"
                                        : "Entrar para reservar"}
                            </button>
                            <p className="dt-dica dt-centro">O locador analisa o pedido antes de confirmar.</p>
                        </form>
                    </aside>
                </div>
            </main>

            {/* Barra de reserva no celular */}
            <div className="dt-barra-mobile">
                <p>
                    <strong>{moeda(precoAtual.valor)}</strong> <span>{precoAtual.rotulo}</span>
                </p>
                <a href="#reserva" className="dt-btn dt-btn--primario">
                    Reservar
                </a>
            </div>

            {/* ---------- Visualizador de fotos ---------- */}
            {lightboxAberto && fotos.lista[lightbox] && (
                <div
                    className="dt-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Fotos do espaço"
                    onClick={() => setLightbox(null)}
                >
                    <button type="button" className="dt-lb-fechar" onClick={() => setLightbox(null)} aria-label="Fechar">
                        ×
                    </button>
                    {totalFotos > 1 && (
                        <button
                            type="button"
                            className="dt-lb-nav dt-lb-prev"
                            aria-label="Foto anterior"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox((i) => (i - 1 + totalFotos) % totalFotos);
                            }}
                        >
                            ‹
                        </button>
                    )}
                    <figure onClick={(e) => e.stopPropagation()}>
                        <img src={fotos.lista[lightbox].url} alt={`${fotos.lista[lightbox].ambiente}, foto ${fotos.lista[lightbox].n}`} />
                        <figcaption>
                            {fotos.lista[lightbox].ambiente}: foto {lightbox + 1} de {totalFotos}
                        </figcaption>
                    </figure>
                    {totalFotos > 1 && (
                        <button
                            type="button"
                            className="dt-lb-nav dt-lb-next"
                            aria-label="Próxima foto"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightbox((i) => (i + 1) % totalFotos);
                            }}
                        >
                            ›
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}