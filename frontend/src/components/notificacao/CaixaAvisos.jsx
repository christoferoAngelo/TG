import { useCallback, useEffect, useRef, useState } from "react";
import "./CaixaAvisos.css";
import AnimatedList from "../bits/AnimatedList";

const API = "http://localhost:8080/api";

export function pedirRecargaAvisos() {
    window.dispatchEvent(new Event("locafesta-avisos"));
}

function quando(iso) {
    if (!iso) return "";
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return "";
    return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CaixaAvisos({ usuarioId }) {
    const [avisos, setAvisos] = useState([]);
    const [aberto, setAberto] = useState(false);
    const caixaRef = useRef(null);

    const carregar = useCallback(() => {
        if (!usuarioId) return;
        fetch(`${API}/notificacoes`, { headers: { "Usuario-Id": usuarioId } })
            .then((res) => (res.ok ? res.json() : []))
            .then((lista) => setAvisos(Array.isArray(lista) ? lista : []))
            .catch(() => setAvisos([]));
    }, [usuarioId]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    useEffect(() => {
        const atualizar = () => carregar();
        window.addEventListener("locafesta-avisos", atualizar);
        return () => window.removeEventListener("locafesta-avisos", atualizar);
    }, [carregar]);

    useEffect(() => {
        if (!aberto) return undefined;
        const fechar = (evento) => {
            if (!caixaRef.current?.contains(evento.target)) setAberto(false);
        };
        const tecla = (evento) => {
            if (evento.key === "Escape") setAberto(false);
        };
        document.addEventListener("mousedown", fechar);
        document.addEventListener("keydown", tecla);
        return () => {
            document.removeEventListener("mousedown", fechar);
            document.removeEventListener("keydown", tecla);
        };
    }, [aberto]);

    const marcar = async (id) => {
        await fetch(`${API}/notificacoes/${id}/lida`, {
            method: "PATCH",
            headers: { "Usuario-Id": usuarioId },
        });
        setAvisos((atual) => atual.map((aviso) => (aviso.id === id ? { ...aviso, lida: true } : aviso)));
    };

    const marcarTodas = async () => {
        await fetch(`${API}/notificacoes/lidas`, {
            method: "PATCH",
            headers: { "Usuario-Id": usuarioId },
        });
        setAvisos((atual) => atual.map((aviso) => ({ ...aviso, lida: true })));
    };

    if (!usuarioId) return null;
    const novas = avisos.filter((aviso) => !aviso.lida).length;

    return (
        <div className="av-sino" ref={caixaRef}>
            <button
                type="button"
                className="av-sino-botao"
                aria-label={novas > 0 ? `Avisos, ${novas} não lidos` : "Avisos"}
                aria-expanded={aberto}
                aria-haspopup="dialog"
                onClick={() => {
                    setAberto((atual) => !atual);
                    carregar();
                }}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.4 1.6H4.6L6 16.5Z" />
                    <path d="M10 19.2a2 2 0 0 0 4 0" />
                </svg>
                {novas > 0 && <span className="av-badge">{novas > 9 ? "9+" : novas}</span>}
            </button>

            {aberto && (
                <section className="av-painel" role="dialog" aria-label="Histórico de avisos">
                    <header className="av-topo">
                        <h2>Avisos</h2>
                        {novas > 0 && (
                            <button type="button" onClick={marcarTodas}>Marcar todos como lidos</button>
                        )}
                    </header>
                    {avisos.length === 0 ? (
                        <p className="av-vazio">Nenhum aviso por enquanto.</p>
                    ) : (
                        <AnimatedList
                            className="av-lista"
                            items={avisos}
                            frame={false}
                            theme="light"
                            width="100%"
                            maxHeight={320}
                            selectOnHover={false}
                            enableArrowNavigation={false}
                            showGradients
                            animation="fade"
                            stagger={0.04}
                            accentColor="#FECB5A"
                            renderItem={(aviso) => (
                                <div className={aviso.lida ? "av-item av-item--lido" : "av-item"}>
                                    <div>
                                        <strong>{aviso.titulo}</strong>
                                        <p>{aviso.mensagem}</p>
                                        <time>{quando(aviso.criadaEm)}</time>
                                    </div>
                                    {!aviso.lida && (
                                        <button type="button" onClick={(evento) => { evento.stopPropagation(); marcar(aviso.id); }}>Marcar como lido</button>
                                    )}
                                </div>
                            )}
                        />
                    )}
                </section>
            )}
        </div>
    );
}
