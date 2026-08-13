import React, { useState, useEffect } from "react";
import { ListaEspacos } from "../../components/locatario/ListaEspacos.jsx"; 
import HeaderHome from "./components/HeaderHome.jsx"; 
import "./Home.css"; 

export default function Home() {
    const [espacos, setEspacos] = useState([]);
    const [carregando, setCarregando] = useState(true);

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
        buscarEspacosNaApi(termo);
    };

    return (
        <div className="home-container">
            {/* Passamos a função handlePesquisar via prop "onSearch" */}
            <HeaderHome onSearch={handlePesquisar} />
            
            <main className="home-main">
                <section className="hero-section">
                    <h1>Encontre o espaço perfeito para o seu próximo evento</h1>
                    <p>Explore centenas de salões, chácaras e rooftops incríveis disponíveis para locação.</p>
                </section>

                <div className="home-content">
                    <h2 className="section-title">Espaços em Destaque</h2>
                    <ListaEspacos espacos={espacos} carregando={carregando} />
                </div>
            </main>
        </div>
    );
}