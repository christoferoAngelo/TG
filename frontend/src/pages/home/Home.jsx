import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ListaEspacos } from "../../components/locatario/ListaEspacos.jsx";
import HeaderHome from "./components/HeaderHome.jsx";
import "./Home.css";

const API_BUSCA = "http://localhost:8080/api/locadores/espacos/busca";

const CATEGORIAS = [
    "Todos",
    "Salões de festa",
    "Chácaras",
    "Sítios",
    "Rooftops",
    "Espaços corporativos",
    "Áreas ao ar livre",
];

export default function Home() {
    const [espacos, setEspacos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
    const [termoAtivo, setTermoAtivo] = useState("");
    const [params] = useSearchParams();

    // Evita que uma resposta antiga sobrescreva uma busca mais recente
    const ultimaBusca = useRef(0);

    // Sempre usa a rota de busca: ela só devolve espaços APROVADOS e ATIVOS.
    // (A rota /espacos/todos devolve tudo, inclusive pendentes e desativados.)
    const buscarEspacosNaApi = (termo = "") => {
        const idBusca = ++ultimaBusca.current;
        setCarregando(true);
        setErro(false);
        setTermoAtivo(termo);

        fetch(`${API_BUSCA}?q=${encodeURIComponent(termo)}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro na requisição");
                return res.json();
            })
            .then((data) => {
                if (idBusca === ultimaBusca.current) setEspacos(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("Erro ao buscar espaços:", err);
                if (idBusca === ultimaBusca.current) {
                    setEspacos([]);
                    setErro(true);
                }
            })
            .finally(() => {
                if (idBusca === ultimaBusca.current) setCarregando(false);
            });
    };

    // Ao abrir a tela busca tudo, ou o termo vindo da busca de outra página (/home?q=...)
    useEffect(() => {
        buscarEspacosNaApi((params.get("q") || "").trim());
    }, [params]);

    // Função passada para a barra de pesquisa no Header
    const handlePesquisar = (termo) => {
        setCategoriaAtiva("Todos");
        buscarEspacosNaApi(termo.trim());
    };

    // Filtro rápido por categoria, reaproveitando a mesma rota de busca
    const handleCategoria = (categoria) => {
        setCategoriaAtiva(categoria);
        buscarEspacosNaApi(categoria === "Todos" ? "" : categoria);
    };

    const tituloLista = termoAtivo ? `Resultados para “${termoAtivo}”` : "Espaços em destaque";
    const listaVazia = !carregando && !erro && espacos.length === 0;

    return (
        <div className="home-container">
            <HeaderHome onSearch={handlePesquisar} />

            <main className="home-main">
                <section className="hero-section">
                    <div className="hero-inner">
                        <h1>Encontre o espaço perfeito para o seu próximo evento</h1>
                        <p>Explore salões, chácaras e rooftops disponíveis para locação.</p>
                    </div>
                </section>

                <nav className="categorias-bar" aria-label="Categorias de espaços">
                    {CATEGORIAS.map((categoria) => (
                        <button
                            key={categoria}
                            type="button"
                            className={`chip-categoria ${categoriaAtiva === categoria ? "chip-categoria--ativo" : ""}`}
                            aria-pressed={categoriaAtiva === categoria}
                            onClick={() => handleCategoria(categoria)}
                        >
                            {categoria}
                        </button>
                    ))}
                </nav>

                <div className="home-content">
                    <h2 className="section-title">{tituloLista}</h2>

                    {erro ? (
                        <div className="home-estado" role="alert">
                            <p>Não conseguimos carregar os espaços agora.</p>
                            <button
                                type="button"
                                className="chip-categoria"
                                onClick={() => buscarEspacosNaApi(termoAtivo)}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : listaVazia ? (
                        <div className="home-estado">
                            <p>
                                {termoAtivo
                                    ? "Nenhum espaço encontrado para essa busca. Tente outro termo ou categoria."
                                    : "Ainda não há espaços disponíveis para locação."}
                            </p>
                        </div>
                    ) : (
                        <ListaEspacos espacos={espacos} carregando={carregando} />
                    )}
                </div>
            </main>
        </div>
    );
}
