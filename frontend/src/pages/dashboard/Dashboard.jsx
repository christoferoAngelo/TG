import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css"; // mantido: outras telas (ex.: Minhas Reservas) ainda usam estas classes
import "./Perfil.css";

import PerfilHero from "./components/PerfilHero";
import ChecklistCadastro from "./components/ChecklistCadastro";
import AtalhosPerfil from "./components/AtalhosPerfil";
import DadosPessoais from "./components/DadosPessoais";
import ModalCompletarCadastro from "./components/modals/ModalCompletarCadastro";
import { cpfOculto } from "../../services/documentos";

const API = "http://localhost:8080/api";

const formatarEndereco = (e) => {
    if (!e?.cep) return "";
    const rua = [e.logradouro, e.numero && `Nº ${e.numero}`].filter(Boolean).join(", ");
    const comp = e.complemento ? ` (${e.complemento})` : "";
    const cidade = [e.bairro, [e.cidade, e.estado].filter(Boolean).join("/")].filter(Boolean).join(", ");
    return `${rua}${comp} - ${cidade} - CEP ${e.cep}`;
};

export default function Dashboard() {
    const { usuarioLogado, atualizarUsuario } = useAuth();
    const navigate = useNavigate();

    const [perfilLocador, setPerfilLocador] = useState(null);
    const [perfilLocatario, setPerfilLocatario] = useState(null);
    // null = fechado; { foco } = aberto (foco: "telefone" | "cpf" | "endereco" | null)
    const [modal, setModal] = useState(null);

    // Consulta na API se o usuário já tem conta de Locador ou Locatário criada
    useEffect(() => {
        if (!usuarioLogado?.id) return;

        fetch(`${API}/locadores/usuario/${usuarioLogado.id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then(setPerfilLocador)
            .catch(() => setPerfilLocador(null));

        fetch(`${API}/locatarios/usuario/${usuarioLogado.id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then(setPerfilLocatario)
            .catch(() => setPerfilLocatario(null));
    }, [usuarioLogado]);

    // O que a pessoa já tem
    const ehLocatario = Boolean(usuarioLogado?.isLocatario || perfilLocatario);
    const ehLocador = Boolean(usuarioLogado?.isLocador || usuarioLogado?.locador || perfilLocador);
    const ehAdmin = Boolean(usuarioLogado?.admin);

    const temTelefone = Boolean(usuarioLogado?.telefone && usuarioLogado.telefone.trim() !== "");
    const temEndereco = Boolean(usuarioLogado?.endereco?.cep);
    const enderecoTexto = formatarEndereco(usuarioLogado?.endereco);
    const cpfExibicao = ehLocatario ? cpfOculto(perfilLocatario?.cpf) : "";

    const itens = [
        {
            id: "telefone",
            titulo: "Telefone de contato",
            descricao: "Para o locador conseguir falar com você.",
            feito: temTelefone,
            valor: usuarioLogado?.telefone,
        },
        {
            id: "cpf",
            titulo: "CPF",
            descricao: "Cria sua conta de locatário, necessária para alugar e para anunciar.",
            feito: ehLocatario,
            valor: cpfExibicao,
        },
        {
            id: "endereco",
            titulo: "Endereço residencial",
            descricao: "Para sugerirmos espaços perto de você.",
            feito: temEndereco,
            valor: enderecoTexto,
        },
    ];
    const feitos = itens.filter((i) => i.feito).length;
    const cadastroCompleto = feitos === itens.length;

    const tipos = [
        ehLocatario && { rotulo: "Locatário", ativo: true },
        ehLocador && { rotulo: "Locador", ativo: true },
        ehAdmin && { rotulo: "Administrador", ativo: true },
    ].filter(Boolean);
    if (tipos.length === 0) tipos.push({ rotulo: "Nenhum perfil criado ainda", ativo: false });

    // Primeiro item pendente (usado pelo botão "Completar cadastro")
    const primeiroPendente = itens.find((i) => !i.feito)?.id ?? null;

    const abrirModal = (foco = null) => setModal({ foco });
    const fecharModal = () => setModal(null);

    // Depois de salvar algo: guarda o novo perfil e atualiza o usuário no contexto
    const handleAtualizado = async ({ novoPerfilLocatario } = {}) => {
        if (novoPerfilLocatario) setPerfilLocatario(novoPerfilLocatario);
        if (atualizarUsuario) await atualizarUsuario();
    };

    return (
        <div className="pf-page">
            <main className="pf-container">
                <PerfilHero
                    nome={usuarioLogado?.nome || "Usuário"}
                    email={usuarioLogado?.email}
                    tipos={tipos}
                    feitos={feitos}
                    total={itens.length}
                    onCompletar={() => abrirModal(primeiroPendente)}
                />

                {cadastroCompleto ? (
                    <p className="pf-sucesso" role="status">
                        Seu cadastro está completo. Você já pode alugar espaços e, quando quiser,
                        criar sua conta de locador pelo painel.
                    </p>
                ) : (
                    <ChecklistCadastro itens={itens} onAbrir={abrirModal} />
                )}

                <AtalhosPerfil
                    ehLocatario={ehLocatario}
                    ehLocador={ehLocador}
                    onReservas={() => navigate("/minhas-reservas")}
                    onExplorar={() => navigate("/home")}
                    onPainel={() => navigate("/perfil_locador")}
                />

                <DadosPessoais
                    usuarioLogado={usuarioLogado}
                    cpfExibicao={cpfExibicao}
                    enderecoTexto={enderecoTexto}
                    onEditar={abrirModal}
                />
            </main>

            {modal && (
                <ModalCompletarCadastro
                    usuarioLogado={usuarioLogado}
                    perfilLocatario={perfilLocatario}
                    foco={modal.foco}
                    onAtualizado={handleAtualizado}
                    onClose={fecharModal}
                />
            )}
        </div>
    );
}
