import { useEffect, useState } from "react";

const API = "http://localhost:8080/api";

const moeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RelatorioLocador({ usuarioId }) {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (!usuarioId) return undefined;
        let ativo = true;
        fetch(`${API}/locadores/${usuarioId}/relatorio`)
            .then((res) => {
                if (!res.ok) throw new Error("Não foi possível carregar o relatório.");
                return res.json();
            })
            .then((json) => {
                if (ativo) setDados(json);
            })
            .catch((falha) => {
                if (ativo) setErro(falha.message);
            });
        return () => {
            ativo = false;
        };
    }, [usuarioId]);

    return (
        <section className="lc-card lc-relatorio" aria-label="Relatórios">
            <div className="lc-card-cab">
                <h2 className="lc-card-titulo">Relatórios</h2>
            </div>
            {erro && <p className="lc-vazio">{erro}</p>}
            {!dados && !erro && <p className="lc-vazio">Carregando relatório…</p>}
            {dados && (
                <>
                    <p className="lc-relatorio-faturamento">
                        Faturamento das reservas confirmadas
                        <strong>{moeda(dados.faturamento)}</strong>
                        <span>{dados.reservasConfirmadas === 1 ? "1 reserva" : `${dados.reservasConfirmadas} reservas`}</span>
                    </p>
                    <div className="lc-relatorio-cols">
                        <div>
                            <h3>Espaços mais alugados</h3>
                            {(dados.espacos || []).length === 0 ? (
                                <p className="lc-vazio">Nenhuma reserva confirmada ainda.</p>
                            ) : (
                                <ol>
                                    {dados.espacos.map((espaco) => (
                                        <li key={espaco.espacoId}>
                                            <strong>{espaco.titulo}</strong>
                                            <span>{espaco.reservas === 1 ? "1 reserva" : `${espaco.reservas} reservas`} · {moeda(espaco.faturamento)}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                        <div>
                            <h3>Períodos de maior procura</h3>
                            {(dados.periodos || []).length === 0 ? (
                                <p className="lc-vazio">Ainda não há pedidos para comparar os meses.</p>
                            ) : (
                                <ol>
                                    {dados.periodos.map((periodo) => (
                                        <li key={periodo.periodo}>
                                            <strong>{periodo.periodo}</strong>
                                            <span>{periodo.reservas === 1 ? "1 pedido" : `${periodo.reservas} pedidos`}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
