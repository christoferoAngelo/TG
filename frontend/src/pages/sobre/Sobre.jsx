import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { EMAIL_SUPORTE, SOBRE } from "../../components/apresentacao/sobre";
import "./Sobre.css";

function IconeValor({ id }) {
    const props = {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };
    if (id === "transparencia") {
        return (
            <svg {...props}>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4.5M12 16h.01" />
            </svg>
        );
    }
    if (id === "seguranca") {
        return (
            <svg {...props}>
                <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
                <path d="m9.5 12 1.8 1.8L15 10" />
            </svg>
        );
    }
    if (id === "simplicidade") {
        return (
            <svg {...props}>
                <path d="M4 12h16M12 4v16" />
                <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
            </svg>
        );
    }
    return (
        <svg {...props}>
            <path d="M4 19V9l8-5 8 5v10" />
            <path d="M9 19v-6h6v6" />
        </svg>
    );
}

export default function Sobre() {
    const { hash } = useLocation();

    useEffect(() => {
        if (!hash) return;
        const id = hash.replace("#", "");
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [hash]);

    return (
        <main className="sb-page">
            <header className="sb-hero">
                <h1>{SOBRE.titulo}</h1>
                <p className="sb-lead">{SOBRE.missaoCurta}</p>
            </header>

            <section className="sb-secao" aria-labelledby="sb-quem">
                <h2 id="sb-quem">Quem somos</h2>
                <p>{SOBRE.quemSomos}</p>
            </section>

            <section className="sb-secao" id="missao" aria-labelledby="sb-missao-visao">
                <h2 id="sb-missao-visao" className="sb-visually-hidden">
                    Missão e visão
                </h2>
                <div className="sb-duo">
                    <article className="sb-card">
                        <h3>Missão</h3>
                        <p>{SOBRE.missao}</p>
                    </article>
                    <article className="sb-card">
                        <h3>Visão</h3>
                        <p>{SOBRE.visao}</p>
                    </article>
                </div>
            </section>

            <section className="sb-secao" id="valores" aria-labelledby="sb-valores">
                <h2 id="sb-valores">Valores</h2>
                <ul className="sb-valores">
                    {SOBRE.valores.map((valor) => (
                        <li key={valor.id} className="sb-valor">
                            <span className="sb-valor-icone">
                                <IconeValor id={valor.id} />
                            </span>
                            <div>
                                <h3>{valor.titulo}</h3>
                                <p>{valor.texto}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="sb-secao sb-contato" id="contato" aria-labelledby="sb-contato">
                <h2 id="sb-contato">Contato</h2>
                <p>{SOBRE.contatoIntro}</p>
                <p className="sb-email">
                    <a href={`mailto:${EMAIL_SUPORTE}`}>{EMAIL_SUPORTE}</a>
                </p>
                <a className="sb-btn" href={`mailto:${EMAIL_SUPORTE}`}>
                    Enviar e-mail
                </a>
            </section>
        </main>
    );
}
