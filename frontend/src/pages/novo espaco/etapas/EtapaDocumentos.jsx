import { useEffect, useRef } from "react";
import GlideSelect from "../../../components/bits/GlideSelect";
import Campo from "./Campo";

export const TIPOS_VINCULO = [
    { valor: "IPTU", rotulo: "Capa do IPTU do ano vigente" },
    { valor: "MATRICULA", rotulo: "Matrícula atualizada do imóvel" },
    { valor: "ESCRITURA", rotulo: "Escritura pública de compra e venda" },
    { valor: "CONTRATO_LOCACAO", rotulo: "Contrato de locação comercial" },
    { valor: "AUTORIZACAO_USO", rotulo: "Autorização de uso / declaração de propriedade" },
];

export const TIPOS_SEGURANCA = [
    { valor: "ALVARA", rotulo: "Alvará de funcionamento" },
    { valor: "AVCB", rotulo: "AVCB (Auto de Vistoria do Corpo de Bombeiros)" },
];

const CONTRATO = `
Termo de aceite e contrato de locação — LocaFesta

1. Objeto
Este termo regula o anúncio de um espaço para eventos na plataforma LocaFesta. Ao concluí-lo, o locador declara que tem direito de oferecer aquele imóvel para locação por temporada de eventos, seja como proprietário, locatário comercial autorizado ou pessoa autorizada pelo proprietário.

2. O que a plataforma confere
A LocaFesta confere se a pessoa que anuncia tem relação comprovada com o imóvel. Essa conferência existe para reduzir anúncios falsos. Ela não substitui a fiscalização da prefeitura e não atesta, por si, alvará, habite-se ou regularidade tributária do negócio.

3. Comprovante de vínculo
O locador envia um documento que ligue o nome dele, ou de quem o autoriza, ao endereço do espaço. São aceitos: capa do carnê do IPTU do ano vigente, matrícula atualizada expedida pelo cartório de imóveis, escritura pública, contrato de locação comercial que não proíba a exploração do espaço para eventos, ou autorização de uso assinada pelo proprietário acompanhada do IPTU, comum em chácaras familiares.

4. Documentos de segurança
Alvará de funcionamento e AVCB são opcionais. A falta deles não impede o cadastro. O envio do AVCB pode ser usado depois como diferencial de "Espaço certificado" para quem busca festas com exigência maior de segurança, como festas infantis grandes.

5. Veracidade
O locador responde pela veracidade das fotos, da descrição, dos horários, dos preços e das regras. Anúncio que não corresponda ao imóvel, ou documento de terceiro usado sem autorização, pode ser recusado ou retirado do ar.

6. Análise
Depois do envio, o anúncio fica pendente até a análise. Mudanças de título, descrição, endereço, capacidade, valores ou fotos podem devolver o anúncio para nova análise.

7. Reservas
Os horários informados definem o que o locatário pode reservar. No período integral, a reserva ocupa da abertura ao fechamento. No modo fracionado, a reserva ocupa um dos turnos calculados, respeitando a duração do evento e o intervalo de limpeza. O valor base é o preço da diária ou de cada turno. Acréscimos informados em um turno específico compõem o preço daquele horário.

8. Regras da casa
As regras de som, limpeza, danos, segurança e acesso escritas pelo locador fazem parte da oferta. O locatário deve conhecê-las antes de reservar. O locador deve aplicá-las de forma compatível com o que publicou.

9. Cancelamento e conduta
A plataforma pode suspender um anúncio quando houver indício de fraude, documento ilegível, endereço divergente ou descumprimento deste termo. O locador pode pedir a revisão apresentando o documento correto.

10. Privacidade dos documentos
Os arquivos servem à análise do anúncio. Não são exibidos publicamente aos locatários. O locador declara que tem autorização para enviar os documentos de familiares ou de terceiros que constem como proprietários.

11. Aceite
O botão de conclusão só é habilitado depois da leitura deste texto até o fim e da marcação do aceite. Esse gesto registra que o locador leu as condições acima e confirma o direito de anunciar o espaço.

12. Foro e atualização
Este texto pode ser atualizado. Um novo anúncio passa a valer pela versão exibida na tela no momento do aceite. Dúvidas sobre um documento recusado são tratadas pelo retorno da análise, com o motivo informado ao locador.
`.trim();

export default function EtapaDocumentos({
    editando,
    erros,
    documento,
    setDocumento,
    segurancaAberta,
    abrirSeguranca,
    seguranca,
    setSeguranca,
    contratoLido,
    marcarContratoLido,
    termosAceitos,
    setTermosAceitos,
    rejeitado,
    motivoRejeicao,
    respostaLocador,
    setRespostaLocador,
}) {
    const caixaRef = useRef(null);

    const chegouAoFim = (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 8;

    useEffect(() => {
        const el = caixaRef.current;
        if (el && chegouAoFim(el)) marcarContratoLido();
    }, [marcarContratoLido]);

    return (
        <>
            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Comprovante de vínculo</h2>
                    <p>
                        O documento mostra que você pode alugar este imóvel. Não precisa ser alvará.
                        {editando ? " Na edição, enviar de novo é opcional." : ""}
                    </p>
                </div>
                <div className="ne-grid">
                    <Campo
                        id="ne-documento-tipo"
                        label="Tipo de documento"
                        opcional={editando}
                        erro={erros.documentoTipo}
                    >
                        <GlideSelect
                            id="ne-documento-tipo"
                            className="glide-select--bloco"
                            ariaLabel="Tipo de documento"
                            size="lg"
                            menuWidth={420}
                            placeholder="Selecione o comprovante"
                            value={documento.tipo}
                            options={TIPOS_VINCULO.map((tipo) => ({ value: tipo.valor, label: tipo.rotulo }))}
                            onChange={(valor) => setDocumento((prev) => ({ ...prev, tipo: valor }))}
                        />
                    </Campo>
                    <Campo
                        id="ne-documento-arquivo"
                        label="Arquivo"
                        opcional={editando}
                        erro={erros.documentoArquivo}
                        dica="PDF ou imagem. O envio ao Cloudinary acontece ao concluir."
                    >
                        <input
                            id="ne-documento-arquivo"
                            type="file"
                            className="ne-input"
                            accept="image/*,.pdf,application/pdf"
                            aria-invalid={erros.documentoArquivo ? "true" : undefined}
                            onChange={(e) => {
                                const arquivo = e.target.files?.[0] || null;
                                setDocumento((prev) => ({
                                    ...prev,
                                    arquivo,
                                    nomeArquivo: arquivo?.name || "",
                                }));
                            }}
                        />
                        {documento.nomeArquivo && <small className="ne-dica">{documento.nomeArquivo}</small>}
                    </Campo>
                </div>

                {!segurancaAberta ? (
                    <button type="button" className="ne-btn ne-btn--ghost" onClick={abrirSeguranca}>
                        + Adicionar documento de segurança
                    </button>
                ) : (
                    <div className="ne-grid ne-seguranca">
                        <p className="ne-dica ne-span-6">
                            Opcional. Alvará e AVCB não bloqueiam o cadastro. Quem envia o AVCB pode ser destacado depois como Espaço certificado.
                        </p>
                        <Campo id="ne-seguranca-tipo" label="Documento de segurança" opcional erro={erros.segurancaTipo} span={6}>
                            <GlideSelect
                                id="ne-seguranca-tipo"
                                className="glide-select--bloco"
                                ariaLabel="Documento de segurança"
                                size="lg"
                                menuWidth={420}
                                placeholder="Selecione"
                                value={seguranca.tipo}
                                options={TIPOS_SEGURANCA.map((tipo) => ({ value: tipo.valor, label: tipo.rotulo }))}
                                onChange={(valor) => setSeguranca((prev) => ({ ...prev, tipo: valor }))}
                            />
                        </Campo>
                        <Campo id="ne-seguranca-arquivo" label="Arquivo de segurança" opcional erro={erros.segurancaArquivo}>
                            <input
                                id="ne-seguranca-arquivo"
                                type="file"
                                className="ne-input"
                                accept="image/*,.pdf,application/pdf"
                                aria-invalid={erros.segurancaArquivo ? "true" : undefined}
                                onChange={(e) => {
                                    const arquivo = e.target.files?.[0] || null;
                                    setSeguranca((prev) => ({
                                        ...prev,
                                        arquivo,
                                        nomeArquivo: arquivo?.name || "",
                                    }));
                                }}
                            />
                            {seguranca.nomeArquivo && <small className="ne-dica">{seguranca.nomeArquivo}</small>}
                        </Campo>
                    </div>
                )}
            </section>

            <section className="ne-secao">
                <div className="ne-secao-cab">
                    <h2>Termos de aceite</h2>
                    <p>Leia até o final. O aceite e a conclusão só liberam depois disso.</p>
                </div>
                <div
                    className={`ne-contrato${erros.contrato ? " ne-contrato--erro" : ""}`}
                    ref={caixaRef}
                    tabIndex={0}
                    data-erro={erros.contrato ? "true" : undefined}
                    onScroll={(e) => {
                        if (chegouAoFim(e.currentTarget)) marcarContratoLido();
                    }}
                >
                    {CONTRATO.split("\n").map((linha, i) => (
                        linha.trim() ? <p key={i}>{linha}</p> : <br key={i} />
                    ))}
                </div>
                {erros.contrato && <small className="ne-erro">{erros.contrato}</small>}
                <label
                    className={`ne-opcao ne-opcao--linha ne-termos${contratoLido ? "" : " ne-termos--bloqueado"}`}
                    data-erro={erros.termos ? "true" : undefined}
                >
                    <input
                        type="checkbox"
                        checked={termosAceitos}
                        disabled={!contratoLido}
                        onChange={(e) => setTermosAceitos(e.target.checked)}
                    />
                    <span className="ne-opcao-titulo">Li e aceito os Termos de Uso e o Contrato de Locação</span>
                </label>
                {!contratoLido && <small className="ne-dica">Role o texto até o final para habilitar o aceite.</small>}
                {erros.termos && <small className="ne-erro">{erros.termos}</small>}
            </section>

            {editando && rejeitado && (
                <section className="ne-secao">
                    <div className="ne-secao-cab">
                        <h2>Mensagem para a análise</h2>
                        <p>{motivoRejeicao ? `Motivo da rejeição: ${motivoRejeicao}` : "Conte o que você ajustou."}</p>
                    </div>
                    <Campo id="ne-respostaLocador" label="Sua resposta" opcional>
                        <textarea
                            id="ne-respostaLocador"
                            className="ne-textarea"
                            rows={3}
                            maxLength={500}
                            value={respostaLocador}
                            onChange={(e) => setRespostaLocador(e.target.value)}
                        />
                    </Campo>
                </section>
            )}
        </>
    );
}
