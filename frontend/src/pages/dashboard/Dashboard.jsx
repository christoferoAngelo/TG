import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css"; // Seu arquivo CSS intacto pode ser importado aqui

// Importando nossos novos componentes
import Header from "./components/Header";
import StatusCadastro from "./components/StatusCadastro";
import MeusPerfis from "./components/MeusPerfis";
import DadosCadastrais from "./components/DadosCadastrais";
import ModalLocador from "./components/modals/ModalLocador";
import ModalLocatario from "./components/modals/ModalLocatario";
import ModalEndereco from "./components/modals/ModalEndereco";

export default function Dashboard() {
    const { usuarioLogado, atualizarUsuario } = useAuth();
    const [modalAberto, setModalAberto] = useState(null);

    const [perfilLocador, setPerfilLocador] = useState(null);
    const [perfilLocatario, setPerfilLocatario] = useState(null);

    // Consulta na API se o usuário já tem conta de Locador ou Locatário criada
    useEffect(() => {
        if (usuarioLogado?.id) {
            fetch(`http://localhost:8080/api/locadores/usuario/${usuarioLogado.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => setPerfilLocador(data))
                .catch(() => setPerfilLocador(null));

            fetch(`http://localhost:8080/api/locatarios/usuario/${usuarioLogado.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => setPerfilLocatario(data))
                .catch(() => setPerfilLocatario(null));
        }
    }, [usuarioLogado]);

    // Lógicas de checagem
    const temDocumento = Boolean(perfilLocador || perfilLocatario);
    const temTelefone = Boolean(usuarioLogado?.telefone && usuarioLogado.telefone.trim() !== "");
    const temEndereco = Boolean(usuarioLogado?.endereco && usuarioLogado.endereco.cep);
    const contaCompleta = temDocumento && temTelefone && temEndereco;

    // Função universal para fechar o modal e atualizar o Contexto de Auth
    const handleSucessoModal = async () => {
        setModalAberto(null);
        if (atualizarUsuario) await atualizarUsuario();
    };

    return (
        <div className="dashboard">
            <Header />

            <main className="main">
                <h3>Painel do Cliente</h3>
                <p>Seja bem-vindo ao seu painel de locações de espaços para eventos.</p>

                <StatusCadastro 
                    contaCompleta={contaCompleta} 
                    temDocumento={temDocumento} 
                    temTelefone={temTelefone} 
                    temEndereco={temEndereco} 
                />

                <MeusPerfis 
                    usuarioLogado={usuarioLogado} 
                    setModalAberto={setModalAberto} 
                />

                <DadosCadastrais 
                    usuarioLogado={usuarioLogado} 
                    temEndereco={temEndereco} 
                    setModalAberto={setModalAberto} 
                />
            </main>

            {/* Modais */}
            {modalAberto === 'locador' && (
                <ModalLocador 
                    usuarioLogado={usuarioLogado} 
                    onClose={() => setModalAberto(null)} 
                    onSuccess={handleSucessoModal} 
                />
            )}

            {modalAberto === 'endereco' && (
                <ModalEndereco 
                    usuarioLogado={usuarioLogado} 
                    onClose={() => setModalAberto(null)} 
                    onSuccess={handleSucessoModal} 
                />
            )}

            {modalAberto === 'locatario' && (
                <ModalLocatario 
                    usuarioLogado={usuarioLogado} 
                    onClose={() => setModalAberto(null)} 
                    onSuccess={handleSucessoModal} 
                    setPerfilLocatario={setPerfilLocatario}
                />
            )}
        </div>
    );
}