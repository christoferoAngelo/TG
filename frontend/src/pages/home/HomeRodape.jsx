import { useState } from "react";
import { Link } from "react-router-dom";
import TermosModal from "../../components/apresentacao/TermosModal";
import { EMAIL_SUPORTE, SOBRE } from "../../components/apresentacao/sobre";

/**
 * Rodapé público da home: LocaFesta, Ajuda, Legal e copyright.
 */
export default function HomeRodape() {
    const [termosAbertos, setTermosAbertos] = useState(false);
    const [tituloTermos, setTituloTermos] = useState("Termos de Uso e Política de Privacidade");

    const abrirTermos = (titulo) => {
        setTituloTermos(titulo);
        setTermosAbertos(true);
    };

    const fecharTermos = () => setTermosAbertos(false);

    return (
        <>
            <footer className="hm-rodape" aria-label="Rodapé do LocaFesta">
                <div className="hm-rodape-grade">
                    <div className="hm-rodape-col">
                        <p className="hm-rodape-marca">LocaFesta</p>
                        <p className="hm-rodape-texto">{SOBRE.missaoCurta}</p>
                        <Link className="hm-rodape-link" to="/sobre">
                            Clique aqui para saber mais sobre o site
                        </Link>
                    </div>

                    <div className="hm-rodape-col">
                        <p className="hm-rodape-titulo">Ajuda</p>
                        <a className="hm-rodape-link" href={`mailto:${EMAIL_SUPORTE}`}>
                            Contato
                        </a>
                    </div>

                    <div className="hm-rodape-col">
                        <p className="hm-rodape-titulo">Legal</p>
                        <button
                            type="button"
                            className="hm-rodape-link hm-rodape-link--botao"
                            onClick={() => abrirTermos("Termos de Uso")}
                        >
                            Termos de Uso
                        </button>
                        <button
                            type="button"
                            className="hm-rodape-link hm-rodape-link--botao"
                            onClick={() => abrirTermos("Política de Privacidade")}
                        >
                            Política de Privacidade
                        </button>
                    </div>
                </div>

                <p className="hm-rodape-copy">{SOBRE.copyright}</p>
            </footer>

            <TermosModal
                aberto={termosAbertos}
                titulo={tituloTermos}
                tipoAudiencia="LOCATARIO"
                somenteLeitura
                exigirLeitura={false}
                onFechar={fecharTermos}
                onRecusar={fecharTermos}
            />
        </>
    );
}
