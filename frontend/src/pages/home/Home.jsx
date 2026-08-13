import React, { useState, useEffect } from "react";
import { ListaEspacos } from "../../components/locatario/ListaEspacos.jsx"; // Ajuste o caminho
import HeaderHome from "./components/HeaderHome.jsx"; // Ajuste o caminho
import "./Home.css"; // CSS exclusivo da Home

export default function Home() {
    const [espacos, setEspacos] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        fetch("http://localhost:8080/api/locadores/espacos/todos")
            .then((res) => {
                if (!res.ok) throw new Error("Erro na requisição");
                return res.json();
            })
            .then((data) => setEspacos(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Erro ao buscar espaços:", err))
            .finally(() => setCarregando(false));
    }, []);

    return (
        <div className="home-container">
            {/* Componente Header Exclusivo da Home */}
            <HeaderHome />
            
            <main className="home-main">
                {/* Banner de Boas-vindas (Hero) */}
                <section className="hero-section">
                    <h1>Encontre o espaço perfeito para o seu próximo evento</h1>
                    <p>Explore centenas de salões, chácaras e rooftops incríveis disponíveis para locação.</p>
                </section>

                {/* Conteúdo Central */}
                <div className="home-content">
                    <h2 className="section-title">Espaços em Destaque</h2>
                    
                    {/* Lista reaproveitada */}
                    <ListaEspacos espacos={espacos} carregando={carregando} />
                </div>
            </main>
        </div>
    );
}