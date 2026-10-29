import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.css";
import "./Perfil.css";

import PerfilHero from "./components/PerfilHero";
import ChecklistCadastro from "./components/ChecklistCadastro";
import AtalhosPerfil from "./components/AtalhosPerfil";
import DadosPessoais from "./components/DadosPessoais";
import DocumentosPerfil from "./components/DocumentosPerfil";
import ModalCompletarCadastro from "./components/modals/ModalCompletarCadastro";
import { cpfOculto } from "../../services/documentos";
import { uploadDocumentoCloudinary } from "../../services/documentoService";
import { ehDocumentoIdentidade, TIPO_COMPROVANTE } from "../../components/documento/rotulosDocumento";

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
    const [modal, setModal] = useState(null);
    const [enviandoFoto, setEnviandoFoto] = useState(false);
    const [erroFoto, setErroFoto] = useState("");
    const [docs, setDocs] = useState([]);
    const [docsVersao, setDocsVersao] = useState(0);

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

    const ehLocatario = Boolean(usuarioLogado?.isLocatario || perfilLocatario);
    const ehLocador = Boolean(usuarioLogado?.isLocador || usuarioLogado?.locador || perfilLocador);
    const ehAdmin = Boolean(usuarioLogado?.admin || usuarioLogado?.isAdmin);

    const temTelefone = Boolean(usuarioLogado?.telefone && usuarioLogado.telefone.trim() !== "");
    const temEndereco = Boolean(usuarioLogado?.endereco?.cep);
    const enderecoTexto = formatarEndereco(usuarioLogado?.endereco);
    const cpfExibicao = ehLocatario ? cpfOculto(perfilLocatario?.cpf) : "";

    const temIdentidade = docs.some((d) => ehDocumentoIdentidade(d.tipoDocumento));
    const temComprovante = docs.some((d) => String(d.tipoDocumento).toUpperCase() === TIPO_COMPROVANTE);

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
            titulo: "CPF e documento de identidade",
            descricao: "CPF e RG/CIN ou CNH para validar sua identidade.",
            feito: ehLocatario && temIdentidade,
            valor: cpfExibicao,
        },
        {
            id: "endereco",
            titulo: "Endereço e comprovante",
            descricao: "Endereço residencial com comprovante no seu nome.",
            feito: temEndereco && temComprovante,
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

    const primeiroPendente = itens.find((i) => !i.feito)?.id ?? null;

    const abrirModal = (foco = null) => setModal({ foco });
    const fecharModal = () => setModal(null);

    const handleAtualizado = async ({ novoPerfilLocatario } = {}) => {
        if (novoPerfilLocatario) setPerfilLocatario(novoPerfilLocatario);
        if (atualizarUsuario) await atualizarUsuario();
    };

    const alterarFoto = async (arquivo) => {
        if (!arquivo.type.startsWith("image/")) {
            setErroFoto("Escolha uma imagem.");
            return;
        }
        if (arquivo.size > 5 * 1024 * 1024) {
            setErroFoto("A foto precisa ter no máximo 5 MB.");
            return;
        }
        setEnviandoFoto(true);
        setErroFoto("");
        try {
            const upload = await uploadDocumentoCloudinary(arquivo);
            const resposta = await fetch(`${API}/users/${usuarioLogado.id}/foto`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fotoUrl: upload.url }),
            });
            if (!resposta.ok) {
                const texto = await resposta.text();
                throw new Error(texto || "Não foi possível salvar a foto.");
            }
            if (atualizarUsuario) await atualizarUsuario();
        } catch (falha) {
            setErroFoto(falha.message || "Não foi possível salvar a foto.");
        } finally {
            setEnviandoFoto(false);
        }
    };

    const removerFoto = async () => {
        setEnviandoFoto(true);
        setErroFoto("");
        try {
            const resposta = await fetch(`${API}/users/${usuarioLogado.id}/foto`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fotoUrl: "" }),
            });
            if (!resposta.ok) {
                const texto = await resposta.text();
                throw new Error(texto || "Não foi possível remover a foto.");
            }
            if (atualizarUsuario) await atualizarUsuario();
        } catch (falha) {
            setErroFoto(falha.message || "Não foi possível remover a foto.");
        } finally {
            setEnviandoFoto(false);
        }
    };

    return (
        <div className="pf-page">
            <main className="pf-container">
                <PerfilHero
                    nome={usuarioLogado?.nome || "Usuário"}
                    email={usuarioLogado?.email}
                    fotoUrl={usuarioLogado?.fotoUrl}
                    tipos={tipos}
                    feitos={feitos}
                    total={itens.length}
                    onCompletar={() => abrirModal(primeiroPendente)}
                    onFoto={alterarFoto}
                    onRemoverFoto={removerFoto}
                    enviandoFoto={enviandoFoto}
                    erroFoto={erroFoto}
                />

                {cadastroCompleto ? (
                    <p className="pf-sucesso" role="status">
                        Seu cadastro está completo. Você já pode solicitar reservas e, quando quiser,
                        criar sua conta de locador.
                    </p>
                ) : (
                    <ChecklistCadastro itens={itens} onAbrir={abrirModal} />
                )}

                <AtalhosPerfil
                    ehLocatario={ehLocatario}
                    ehLocador={ehLocador}
                    cadastroCompleto={cadastroCompleto}
                    onReservas={() => navigate("/minhas-reservas")}
                    onExplorar={() => navigate("/home")}
                    onPainel={() => {
                        if (!ehLocador && !cadastroCompleto) abrirModal(primeiroPendente);
                        else navigate(ehLocador ? "/perfil_locador" : "/cadastro-locador");
                    }}
                />

                <DadosPessoais
                    usuarioLogado={usuarioLogado}
                    cpfExibicao={cpfExibicao}
                    enderecoTexto={enderecoTexto}
                    onEditar={abrirModal}
                />

                {usuarioLogado?.id && (
                    <DocumentosPerfil
                        key={docsVersao}
                        usuarioId={usuarioLogado.id}
                        onMudanca={setDocs}
                        variante="locatario"
                    />
                )}
            </main>

            {modal && (
                <ModalCompletarCadastro
                    usuarioLogado={usuarioLogado}
                    perfilLocatario={perfilLocatario}
                    foco={modal.foco}
                    onAtualizado={handleAtualizado}
                    onClose={fecharModal}
                    onDocsEnviados={() => setDocsVersao((n) => n + 1)}
                />
            )}
        </div>
    );
}
