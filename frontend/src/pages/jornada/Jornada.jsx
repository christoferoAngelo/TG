import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DepthCarousel from "../../components/bits/DepthCarousel";
import { CHAVE_JORNADA } from "../../components/apresentacao/termos";
import "./Jornada.css";

const PASSOS = [
    {
        titulo: "Complete seu perfil",
        texto: "Depois do login, finalize seu cadastro. Isso traz mais segurança ao locador quando você enviar uma solicitação de reserva.",
        alt: "Complete seu perfil"
    },
    {
        titulo: "Explore e favorite",
        texto: "Pesquise por localização, data, quantidade de pessoas e estilo de espaço. Favorite locais e monte sua lista.",
        alt: "Explore e favorite"
    },
    {
        titulo: "Reserve e fique atento",
        texto: "Reserve com o pagamento da plataforma. Confira as datas de cancelamento e as regras de reembolso de cada espaço.",
        alt: "Reserve e fique atento"
    },
    {
        titulo: "Avalie e aproveite",
        texto: "Depois do evento, avalie a reserva. Sua opinião ajuda o próximo locatário. Aproveite o LocaFesta.",
        alt: "Avalie e aproveite"
    }
];

export default function Jornada() {
    const navigate = useNavigate();
    const [vistos, setVistos] = useState(() => new Set([0]));
    const completo = vistos.size >= PASSOS.length;

    const registrar = (indice) => {
        setVistos((atual) => {
            if (atual.has(indice)) return atual;
            const proximo = new Set(atual);
            proximo.add(indice);
            return proximo;
        });
    };

    const comecar = () => {
        localStorage.setItem(CHAVE_JORNADA, "true");
        navigate("/home");
    };

    return (
        <main className="jornada">
            <div className="jornada-palco">
                <DepthCarousel
                    items={PASSOS}
                    depth={250}
                    spread={80}
                    tilt={22}
                    tiltDirection="right"
                    perspective={950}
                    visibleCards={4}
                    falloff={0.2}
                    blur={6}
                    autoplay={false}
                    loop
                    cardWidth={300}
                    cardHeight={350}
                    radius={18}
                    tint="#05060a"
                    duration={700}
                    ease="power3.out"
                    autoplayDelay={3200}
                    showControls
                    showIndicators
                    onChange={registrar}
                />
            </div>
            {completo && (
                <button type="button" className="jornada-comecar" onClick={comecar}>
                    Começar a jornada
                </button>
            )}
        </main>
    );
}
