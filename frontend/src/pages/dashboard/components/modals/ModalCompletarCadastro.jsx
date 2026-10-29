import React, { useEffect, useRef, useState } from "react";
import Modal from "../../../../components/locador/Modal";
import {
    apenasDigitos,
    cpfOculto,
    cpfValido,
    mascararCep,
    mascararCpf,
    mascararTelefone,
} from "../../../../services/documentos";
import {
    criarDocumentoUsuario,
    uploadDocumentoCloudinary,
} from "../../../../services/documentoService";
import { ladosIdentidade } from "../../../../components/documento/rotulosDocumento";
import BotaoImagem from "../../../../components/ui/BotaoImagem";

const API = "http://localhost:8080/api";

const CAMPOS_ENDERECO = ["cep", "logradouro", "numero", "bairro", "cidade", "estado"];

// A API devolve `endereco: null` para quem ainda não cadastrou, e valor padrão
// de parâmetro (e = {}) não cobre null, só undefined. Por isso o `|| {}`.
const enderecoInicial = (endereco) => {
    const e = endereco || {};
    return {
        cep: mascararCep(e.cep || ""),
        logradouro: e.logradouro || "",
        numero: e.numero || "",
        complemento: e.complemento || "",
        bairro: e.bairro || "",
        cidade: e.cidade || "",
        estado: e.estado || "",
    };
};

async function lerErro(response, padrao) {
    const texto = await response.text();
    return texto || padrao;
}

/**
 * Um único modal para completar o cadastro: telefone, CPF e endereço.
 * Cada parte é salva separadamente, então dá para preencher só o que quiser.
 *
 * Props:
 *  - foco: "telefone" | "cpf" | "endereco" | null → seção destacada ao abrir
 *  - perfilLocatario: perfil já existente (CPF não pode ser alterado depois)
 *  - onAtualizado({ novoPerfilLocatario }): chamado após salvar algo (atualiza a tela)
 *  - onClose: fecha o modal
 */
export default function ModalCompletarCadastro({
    usuarioLogado,
    perfilLocatario,
    foco,
    onAtualizado,
    onClose,
    onDocsEnviados,
}) {
    const telefoneOriginal = usuarioLogado?.telefone || "";
    const enderecoOriginal = enderecoInicial(usuarioLogado?.endereco);
    const cpfJaCadastrado = Boolean(perfilLocatario);

    const [telefone, setTelefone] = useState(mascararTelefone(telefoneOriginal));
    const [cpf, setCpf] = useState("");
    const [endereco, setEndereco] = useState(enderecoOriginal);
    const [tipoId, setTipoId] = useState("CNH");
    const [arquivoId, setArquivoId] = useState(null);
    const [arquivoIdVerso, setArquivoIdVerso] = useState(null);
    const [arquivoComprovante, setArquivoComprovante] = useState(null);
    const [erros, setErros] = useState({});
    const [erroGeral, setErroGeral] = useState("");
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [cepNaoEncontrado, setCepNaoEncontrado] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const telefoneRef = useRef(null);
    const cpfRef = useRef(null);
    const cepRef = useRef(null);
    const numeroRef = useRef(null);

    // Ao abrir, leva o foco direto para a parte que a pessoa clicou
    useEffect(() => {
        const alvo = { telefone: telefoneRef, cpf: cpfRef, endereco: cepRef }[foco];
        alvo?.current?.focus();
    }, [foco]);

    const limparErro = (chave) =>
        setErros((prev) => {
            if (!prev[chave]) return prev;
            const { [chave]: _r, ...resto } = prev;
            return resto;
        });

    const setCampoEndereco = (campo, valor) => {
        setEndereco((prev) => ({ ...prev, [campo]: valor }));
        limparErro(`end_${campo}`);
    };

    const handleCep = async (valor) => {
        const cep = mascararCep(valor);
        setCampoEndereco("cep", cep);
        setCepNaoEncontrado(false);

        const digitos = apenasDigitos(cep);
        if (digitos.length !== 8) return;

        setBuscandoCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
            const data = await res.json();
            if (data.erro) {
                setCepNaoEncontrado(true);
                return;
            }
            setEndereco((prev) => ({
                ...prev,
                logradouro: data.logradouro || prev.logradouro,
                bairro: data.bairro || prev.bairro,
                cidade: data.localidade || prev.cidade,
                estado: data.uf || prev.estado,
            }));
            setErros((prev) => {
                const resto = { ...prev };
                ["end_logradouro", "end_bairro", "end_cidade", "end_estado"].forEach((k) => delete resto[k]);
                return resto;
            });
            numeroRef.current?.focus();
        } catch (err) {
            console.error("Erro ao buscar CEP", err);
        } finally {
            setBuscandoCep(false);
        }
    };

    /* ---------- o que mudou ---------- */

    const telefoneAlterado = apenasDigitos(telefone) !== apenasDigitos(telefoneOriginal);
    const cpfPreenchido = !cpfJaCadastrado && apenasDigitos(cpf).length > 0;
    const enderecoPreenchido = CAMPOS_ENDERECO.some((c) => String(endereco[c]).trim() !== "");
    const enderecoAlterado = Object.keys(endereco).some((c) => endereco[c] !== enderecoOriginal[c]);
    const temAlgoParaSalvar =
        telefoneAlterado
        || cpfPreenchido
        || (enderecoPreenchido && enderecoAlterado)
        || Boolean(arquivoId)
        || Boolean(arquivoIdVerso)
        || Boolean(arquivoComprovante);

    /* ---------- validação ---------- */

    const validar = () => {
        const e = {};

        if (telefoneAlterado && apenasDigitos(telefone).length > 0) {
            const n = apenasDigitos(telefone).length;
            if (n < 10) e.telefone = "Informe o telefone com DDD.";
        }

        if (cpfPreenchido && !cpfValido(cpf)) {
            e.cpf = "CPF inválido. Confira os números.";
        }

        if (enderecoPreenchido && enderecoAlterado) {
            if (apenasDigitos(endereco.cep).length !== 8) e.end_cep = "Informe um CEP com 8 dígitos.";
            if (!endereco.logradouro.trim()) e.end_logradouro = "Informe a rua ou avenida.";
            if (!endereco.numero.trim()) e.end_numero = "Informe o número.";
            if (!endereco.bairro.trim()) e.end_bairro = "Informe o bairro.";
            if (!endereco.cidade.trim()) e.end_cidade = "Informe a cidade.";
            if (endereco.estado.trim().length !== 2) e.end_estado = "Use a sigla com 2 letras.";
        }

        return e;
    };

    /* ---------- envio ---------- */

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (salvando) return;

        setErroGeral("");
        const novosErros = validar();
        setErros(novosErros);

        if (Object.keys(novosErros).length > 0) {
            requestAnimationFrame(() => {
                const campo = document.querySelector(".mdl-campo--erro");
                const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                campo?.scrollIntoView({
                    behavior: reduzirMovimento ? "auto" : "smooth",
                    block: "center",
                });
                campo?.querySelector("input")?.focus({ preventScroll: true });
            });
            return;
        }
        if (!temAlgoParaSalvar) {
            setErroGeral("Preencha pelo menos um dos campos para salvar.");
            return;
        }

        setSalvando(true);
        let novoPerfilLocatario = null;
        let salvouAlgo = false;

        try {
            if (telefoneAlterado && apenasDigitos(telefone).length > 0) {
                const res = await fetch(`${API}/users/${usuarioLogado.id}/telefone`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ telefone }),
                });
                if (!res.ok) throw new Error(`Telefone: ${await lerErro(res, "não foi possível salvar.")}`);
                salvouAlgo = true;
            }

            if (cpfPreenchido) {
                const res = await fetch(`${API}/locatarios`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cpf, usuarioId: usuarioLogado.id }),
                });
                if (!res.ok) throw new Error(`CPF: ${await lerErro(res, "não foi possível salvar.")}`);
                novoPerfilLocatario = await res.json();
                salvouAlgo = true;
            }

            if (enderecoPreenchido && enderecoAlterado) {
                const res = await fetch(`${API}/users/${usuarioLogado.id}/endereco`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...endereco,
                        logradouro: endereco.logradouro.trim(),
                        numero: endereco.numero.trim(),
                        complemento: endereco.complemento.trim(),
                        bairro: endereco.bairro.trim(),
                        cidade: endereco.cidade.trim(),
                    }),
                });
                if (!res.ok) throw new Error(`Endereço: ${await lerErro(res, "não foi possível salvar.")}`);
                salvouAlgo = true;
            }

            const enviarDoc = async (tipoDocumento, arquivo) => {
                const upload = await uploadDocumentoCloudinary(arquivo);
                await criarDocumentoUsuario(usuarioLogado.id, {
                    tipoDocumento,
                    nomeArquivo: upload.nomeArquivo,
                    arquivoUrl: upload.url,
                });
            };

            const lados = ladosIdentidade(tipoId);
            if (arquivoId) {
                await enviarDoc(lados.frente, arquivoId);
                salvouAlgo = true;
            }
            if (arquivoIdVerso) {
                await enviarDoc(lados.verso, arquivoIdVerso);
                salvouAlgo = true;
            }
            if (arquivoComprovante) {
                await enviarDoc("COMPROVANTE_RESIDENCIA", arquivoComprovante);
                salvouAlgo = true;
            }
            if (arquivoId || arquivoIdVerso || arquivoComprovante) {
                onDocsEnviados?.();
            }

            await onAtualizado?.({ novoPerfilLocatario });
            onClose?.();
        } catch (err) {
            console.error(err);
            // O que já foi salvo antes do erro fica salvo: atualiza a tela por trás
            if (salvouAlgo) await onAtualizado?.({ novoPerfilLocatario });
            setErroGeral(
                salvouAlgo
                    ? `${err.message} (O que veio antes disso foi salvo.)`
                    : err.message || "Não foi possível salvar. Tente novamente."
            );
        } finally {
            setSalvando(false);
        }
    };

    const destaque = (secao) => (foco === secao ? " mdl-secao--destaque" : "");

    return (
        <Modal
            titulo="Completar cadastro"
            subtitulo="Preencha o que ainda falta. Você pode salvar uma parte agora e voltar depois para o resto."
            onClose={onClose}
            bloqueado={salvando}
            tamanho="lg"
            rodape={
                <>
                    <button type="button" className="mdl-btn mdl-btn--ghost" onClick={onClose} disabled={salvando}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="form-completar-cadastro"
                        className="mdl-btn mdl-btn--primario"
                        disabled={salvando}
                    >
                        {salvando ? "Salvando…" : "Salvar"}
                    </button>
                </>
            }
        >
            <form id="form-completar-cadastro" onSubmit={handleSubmit} noValidate>
                {erroGeral && <p className="mdl-alerta" role="alert">{erroGeral}</p>}

                {/* ---------- Contato ---------- */}
                <section className={`mdl-secao${destaque("telefone")}`} aria-labelledby="cc-sec-contato">
                    <h3 id="cc-sec-contato" className="mdl-secao-titulo">Contato</h3>
                    <div className={`mdl-campo${erros.telefone ? " mdl-campo--erro" : ""}`}>
                        <label htmlFor="cc-telefone">Telefone / WhatsApp</label>
                        <input
                            id="cc-telefone"
                            ref={telefoneRef}
                            type="tel"
                            inputMode="tel"
                            className="mdl-input"
                            placeholder="(00) 00000-0000"
                            value={telefone}
                            onChange={(e) => {
                                setTelefone(mascararTelefone(e.target.value));
                                limparErro("telefone");
                            }}
                        />
                        {erros.telefone && <small className="mdl-erro">{erros.telefone}</small>}
                    </div>
                </section>

                {/* ---------- Identificação ---------- */}
                <section className={`mdl-secao${destaque("cpf")}`} aria-labelledby="cc-sec-cpf">
                    <h3 id="cc-sec-cpf" className="mdl-secao-titulo">Identificação</h3>
                    <p className="mdl-secao-dica">
                        O CPF cria sua conta de locatário, necessária para alugar espaços e para
                        se tornar locador depois.
                    </p>
                    <div className={`mdl-campo${erros.cpf ? " mdl-campo--erro" : ""}`}>
                        <label htmlFor="cc-cpf">CPF</label>
                        {cpfJaCadastrado ? (
                            <>
                                <input
                                    id="cc-cpf"
                                    ref={cpfRef}
                                    className="mdl-input"
                                    value={cpfOculto(perfilLocatario?.cpf)}
                                    readOnly
                                />
                                <small className="mdl-dica">CPF já cadastrado. Ele não pode ser alterado por aqui.</small>
                            </>
                        ) : (
                            <>
                                <input
                                    id="cc-cpf"
                                    ref={cpfRef}
                                    type="text"
                                    inputMode="numeric"
                                    className="mdl-input"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={(e) => {
                                        setCpf(mascararCpf(e.target.value));
                                        limparErro("cpf");
                                    }}
                                />
                                {erros.cpf && <small className="mdl-erro">{erros.cpf}</small>}
                            </>
                        )}
                    </div>

                    <div className="mdl-campo">
                        <label htmlFor="cc-tipo-id">Documento de identidade (frente e verso)</label>
                        <select
                            id="cc-tipo-id"
                            className="mdl-input"
                            value={tipoId}
                            onChange={(e) => {
                                setTipoId(e.target.value);
                                setArquivoId(null);
                                setArquivoIdVerso(null);
                            }}
                        >
                            <option value="RG">RG (frente e verso)</option>
                            <option value="CIN">CIN (frente e verso)</option>
                            <option value="CNH">CNH (frente e verso)</option>
                        </select>
                    </div>
                    <div className="mdl-campo">
                        <span className="mdl-rotulo" id="cc-arquivo-id-label">Foto da frente do {tipoId}</span>
                        <BotaoImagem
                            id="cc-arquivo-id"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            compacto
                            rotulo={`Enviar frente do ${tipoId}`}
                            rotuloTroca="Trocar arquivo"
                            dica="JPG, PNG, WEBP ou PDF"
                            nomeArquivo={arquivoId?.name}
                            onChange={(e) => setArquivoId(e.target.files?.[0] || null)}
                            className="mdl-botao-arquivo"
                        />
                    </div>
                    <div className="mdl-campo">
                        <span className="mdl-rotulo" id="cc-arquivo-id-verso-label">Foto do verso do {tipoId}</span>
                        <BotaoImagem
                            id="cc-arquivo-id-verso"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            compacto
                            rotulo={`Enviar verso do ${tipoId}`}
                            rotuloTroca="Trocar arquivo"
                            dica="JPG, PNG, WEBP ou PDF"
                            nomeArquivo={arquivoIdVerso?.name}
                            onChange={(e) => setArquivoIdVerso(e.target.files?.[0] || null)}
                            className="mdl-botao-arquivo"
                        />
                    </div>
                </section>

                {/* ---------- Endereço ---------- */}
                <section className={`mdl-secao${destaque("endereco")}`} aria-labelledby="cc-sec-endereco">
                    <h3 id="cc-sec-endereco" className="mdl-secao-titulo">Endereço residencial</h3>
                    <p className="mdl-secao-dica">
                        Usamos o endereço para sugerir espaços perto de você. Digite o CEP e
                        completamos o resto.
                    </p>
                    <div className="mdl-endereco">
                        <div className={`mdl-campo mdl-end-cep${erros.end_cep || cepNaoEncontrado ? " mdl-campo--erro" : ""}`}>
                            <label htmlFor="cc-cep">CEP</label>
                            <input
                                id="cc-cep"
                                ref={cepRef}
                                type="text"
                                inputMode="numeric"
                                className="mdl-input"
                                placeholder="00000-000"
                                value={endereco.cep}
                                onChange={(e) => handleCep(e.target.value)}
                            />
                            {buscandoCep && <small className="mdl-dica">Buscando…</small>}
                            {erros.end_cep && <small className="mdl-erro">{erros.end_cep}</small>}
                            {cepNaoEncontrado && (
                                <small className="mdl-erro">CEP não encontrado. Preencha manualmente.</small>
                            )}
                        </div>

                        <div className={`mdl-campo mdl-end-rua${erros.end_logradouro ? " mdl-campo--erro" : ""}`}>
                            <label htmlFor="cc-logradouro">Rua ou avenida</label>
                            <input
                                id="cc-logradouro"
                                className="mdl-input"
                                value={endereco.logradouro}
                                onChange={(e) => setCampoEndereco("logradouro", e.target.value)}
                            />
                            {erros.end_logradouro && <small className="mdl-erro">{erros.end_logradouro}</small>}
                        </div>

                        <div className={`mdl-campo mdl-end-numero${erros.end_numero ? " mdl-campo--erro" : ""}`}>
                            <label htmlFor="cc-numero">Número</label>
                            <input
                                id="cc-numero"
                                ref={numeroRef}
                                className="mdl-input"
                                value={endereco.numero}
                                onChange={(e) => setCampoEndereco("numero", e.target.value)}
                            />
                            {erros.end_numero && <small className="mdl-erro">{erros.end_numero}</small>}
                        </div>

                        <div className="mdl-campo mdl-end-complemento">
                            <label htmlFor="cc-complemento">
                                Complemento <span className="mdl-opcional">(opcional)</span>
                            </label>
                            <input
                                id="cc-complemento"
                                className="mdl-input"
                                placeholder="Apto, bloco…"
                                value={endereco.complemento}
                                onChange={(e) => setCampoEndereco("complemento", e.target.value)}
                            />
                        </div>

                        <div className={`mdl-campo mdl-end-bairro${erros.end_bairro ? " mdl-campo--erro" : ""}`}>
                            <label htmlFor="cc-bairro">Bairro</label>
                            <input
                                id="cc-bairro"
                                className="mdl-input"
                                value={endereco.bairro}
                                onChange={(e) => setCampoEndereco("bairro", e.target.value)}
                            />
                            {erros.end_bairro && <small className="mdl-erro">{erros.end_bairro}</small>}
                        </div>

                        <div className={`mdl-campo mdl-end-cidade${erros.end_cidade ? " mdl-campo--erro" : ""}`}>
                            <label htmlFor="cc-cidade">Cidade</label>
                            <input
                                id="cc-cidade"
                                className="mdl-input"
                                value={endereco.cidade}
                                onChange={(e) => setCampoEndereco("cidade", e.target.value)}
                            />
                            {erros.end_cidade && <small className="mdl-erro">{erros.end_cidade}</small>}
                        </div>

                        <div className={`mdl-campo mdl-end-uf${erros.end_estado ? " mdl-campo--erro" : ""}`}>
                            <label htmlFor="cc-estado">UF</label>
                            <input
                                id="cc-estado"
                                className="mdl-input"
                                maxLength={2}
                                placeholder="SP"
                                value={endereco.estado}
                                onChange={(e) => setCampoEndereco("estado", e.target.value.toUpperCase())}
                            />
                            {erros.end_estado && <small className="mdl-erro">{erros.end_estado}</small>}
                        </div>
                    </div>

                    <div className="mdl-campo">
                        <span className="mdl-rotulo" id="cc-comprovante-label">Comprovante de endereço (no seu nome)</span>
                        <BotaoImagem
                            id="cc-comprovante"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            compacto
                            rotulo="Enviar comprovante"
                            rotuloTroca="Trocar comprovante"
                            dica="JPG, PNG, WEBP ou PDF"
                            nomeArquivo={arquivoComprovante?.name}
                            onChange={(e) => setArquivoComprovante(e.target.files?.[0] || null)}
                            className="mdl-botao-arquivo"
                        />
                    </div>
                </section>
            </form>
        </Modal>
    );
}