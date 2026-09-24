import React, { useState, useEffect } from "react";
import { ListaEspacos } from "../../components/locatario/ListaEspacos.jsx";
import HeaderHome from "./components/HeaderHome.jsx";
import "./Home.css";

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
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

    // Separamos a lógica de fetch numa função para podermos reaproveitá-la
    const buscarEspacosNaApi = (termo = "") => {
        setCarregando(true);

        // Se tiver termo, usa a nova rota de busca. Se não, usa a antiga que traz todos.
        const url = termo
            ? `http://localhost:8080/api/locadores/espacos/busca?q=${termo}`
            : `http://localhost:8080/api/locadores/espacos/todos`;

        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Erro na requisição");
                return res.json();
            })
            .then((data) => setEspacos(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Erro ao buscar espaços:", err))
            .finally(() => setCarregando(false));
    };

    // Ao carregar a tela pela primeira vez, busca todos (sem termo)
    useEffect(() => {
        buscarEspacosNaApi();
    }, []);

    // Função que será passada para a barra de pesquisa no Header
    const handlePesquisar = (termo) => {
        setCategoriaAtiva("Todos");
        buscarEspacosNaApi(termo);
    };

    // Filtro rápido por categoria, reaproveitando a mesma rota de busca
    const handleCategoria = (categoria) => {
        setCategoriaAtiva(categoria);
        buscarEspacosNaApi(categoria === "Todos" ? "" : categoria);
    };

    return (
        <div className="home-container">
            <HeaderHome onSearch={handlePesquisar} />

            <main className="home-main">
                <section className="hero-section">
                    <div className="hero-inner">
                        <h1>Encontre o espaço perfeito para o seu próximo evento</h1>
                        <p>Explore centenas de salões, chácaras e rooftops incríveis disponíveis para locação.</p>
                    </div>
                </section>

                <nav className="categorias-bar" aria-label="Categorias de espaços">
                    {CATEGORIAS.map((categoria) => (
                        <button
                            key={categoria}
                            type="button"
                            className={`chip-categoria ${categoriaAtiva === categoria ? "chip-categoria--ativo" : ""}`}
                            onClick={() => handleCategoria(categoria)}
                        >
                            {categoria}
                        </button>
                    ))}
                </nav>

                <div className="home-content">
                    <h2 className="section-title">Espaços em destaque</h2>
                    <ListaEspacos espacos={espacos} carregando={carregando} />
                </div>
            </main>
        </div>
    );
}