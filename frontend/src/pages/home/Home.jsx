import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListaEspacos } from "/src/components/locatario/ListaEspacos.jsx"; // Ajuste o caminho se necessário
import "../dashboard/Dashboard.css"; 

export default function Home() {
    const navigate = useNavigate();
    
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
        <div className="dashboard">
            <header className="header">
                <h2 className="logo" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
                    LocaFesta
                </h2>
                <div className="user-menu">
                    <button onClick={() => navigate("/login")} className="btn btn-destaque">
                        Entrar / Cadastrar
                    </button>
                </div>
            </header>

            <main className="main">
                <div className="home-hero">
                    <h3>Encontre o espaço perfeito para o seu evento</h3>
                    <p>Explore salões, chácaras e espaços disponíveis.</p>
                </div>

                <h4 className="section-title">Espaços em Destaque</h4>

                {/* Aqui entra o componente que reaproveitamos */}
                <ListaEspacos espacos={espacos} carregando={carregando} />
                
            </main>
        </div>
    );
}