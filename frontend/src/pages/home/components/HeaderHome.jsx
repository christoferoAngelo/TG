import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import CaixaAvisos from "../../../components/notificacao/CaixaAvisos";
import BotaoTema from "../../../components/tema/BotaoTema";
import BuscaPill from "../explorar/BuscaPill";
import MenuPerfil from "../explorar/MenuPerfil";
import "../Home.css";
import "../HomeExplorar.css";

const API_BUSCA = "http://localhost:8080/api/locadores/espacos/busca";

function montarQueryHome({ onde, quando, pessoas }) {
    const busca = new URLSearchParams();
    const q = String(onde || "").trim();
    if (q && !/^qualquer lugar$/i.test(q)) busca.set("q", q);
    else if (/^qualquer lugar$/i.test(q)) busca.set("q", "Qualquer lugar");
    if (quando) busca.set("data", quando);
    if (Number(pessoas) > 0) busca.set("pessoas", String(pessoas));
    return busca;
}

/** Header global: logo + busca + ações. Categorias ficam só na Home. */
export default function HeaderHome() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { usuarioLogado } = useAuth();
    const naHome = location.pathname === "/home";

    const [onde, setOnde] = useState(() => searchParams.get("q") || "");
    const [quando, setQuando] = useState(() => searchParams.get("data") || "");
    const [pessoas, setPessoas] = useState(() => searchParams.get("pessoas") || "0");
    const [catalogo, setCatalogo] = useState([]);

    const isLocador = Boolean(usuarioLogado?.locador || usuarioLogado?.isLocador);

    useEffect(() => {
        if (!naHome) return;
        setOnde(searchParams.get("q") || "");
        setQuando(searchParams.get("data") || "");
        setPessoas(searchParams.get("pessoas") || "0");
    }, [naHome, searchParams]);

    useEffect(() => {
        let ativo = true;
        fetch(`${API_BUSCA}?q=`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                if (ativo) setCatalogo(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (ativo) setCatalogo([]);
            });
        return () => {
            ativo = false;
        };
    }, []);

    const handleAnunciarClick = () => {
        if (!usuarioLogado) {
            navigate("/login", {
                state: { fundo: { pathname: location.pathname, search: location.search, hash: location.hash } },
            });
            return;
        }
        navigate(isLocador ? "/locador" : "/cadastro-locador");
    };

    const pesquisar = () => {
        const query = montarQueryHome({ onde, quando, pessoas });
        const destino = query.toString() ? `/home?${query}` : "/home";
        navigate(destino);
    };

    return (
        <header className={`hm-topo hm-topo--global${naHome ? " hm-topo--na-home" : ""}`}>
            <button
                type="button"
                className="hm-logo"
                onClick={() => navigate("/home")}
                aria-label="Ir para o início"
                title="Ir para o início"
            >
                LocaFesta
            </button>

            <BuscaPill
                onde={onde}
                quando={quando}
                pessoas={pessoas}
                catalogo={catalogo}
                onChange={(parcial) => {
                    if (parcial.onde != null) setOnde(parcial.onde);
                    if (parcial.quando != null) setQuando(parcial.quando);
                    if (parcial.pessoas != null) setPessoas(String(parcial.pessoas));
                }}
                onBuscar={pesquisar}
            />

            <div className="hm-acoes">
                <button type="button" className="hm-cta-anunciar" onClick={handleAnunciarClick}>
                    {isLocador ? "Meu negócio" : "Vou anunciar"}
                </button>

                <BotaoTema />

                {usuarioLogado ? <CaixaAvisos usuarioId={usuarioLogado.id} /> : null}

                {usuarioLogado ? (
                    <button
                        type="button"
                        className="hm-listas"
                        aria-label="Favoritos"
                        onClick={() => navigate("/favoritos")}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 19.4 4.8 12.6a4.2 4.2 0 0 1 6-5.9L12 7.8l1.2-1.1a4.2 4.2 0 0 1 6 5.9L12 19.4Z" />
                        </svg>
                    </button>
                ) : null}

                <MenuPerfil />
            </div>
        </header>
    );
}
