import { useEffect, useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import AppShell from "../../components/layout/AppShell";
import LocadorLayout from "./LocadorLayout";
import LocadorPainel from "./LocadorPainel";
import LocadorReservas from "./LocadorReservas";
import LocadorEspacos from "./LocadorEspacos";
import LocadorFinanceiro from "./LocadorFinanceiro";

const LOCADOR_A_UID = "dZ1lkQfXTZXfiio36x1Vg2s8nGi1";
const API = "http://localhost:8080/api";

/** Preview local da área do locador (sem Firebase). Só DEV / captura. ?secao=painel|reservas|espacos|financeiro */
export default function DevPainelPreview() {
    const params = new URLSearchParams(window.location.search);
    const secao = params.get("secao") || "painel";
    const inicial =
        secao === "reservas"
            ? "/locador/reservas"
            : secao === "espacos"
              ? "/locador/espacos"
              : secao === "financeiro"
                ? "/locador/financeiro"
                : "/locador";

    const [usuario, setUsuario] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        fetch(`${API}/users/${LOCADOR_A_UID}`)
            .then(async (res) => {
                if (!res.ok) throw new Error((await res.text()) || "Locador A não encontrado.");
                return res.json();
            })
            .then((u) =>
                setUsuario({
                    ...u,
                    locador: true,
                    isLocador: true,
                    locatario: true,
                    isLocatario: true,
                })
            )
            .catch((e) => setErro(e.message));
    }, []);

    if (erro) {
        return (
            <main style={{ padding: 32, fontFamily: "sans-serif" }}>
                <p>Preview indisponível: {erro}</p>
                <p>Reinicie o backend com locafesta.demo-seed=true e os seeds de usuários/espaços.</p>
            </main>
        );
    }

    if (!usuario) {
        return (
            <main style={{ padding: 32, fontFamily: "sans-serif" }}>
                <p>Carregando Locador A…</p>
            </main>
        );
    }

    const valor = {
        usuarioLogado: usuario,
        carregando: false,
        setUsuarioLogado: () => {},
        atualizarUsuario: async () => usuario,
        logout: async () => {},
    };

    return (
        <AuthContext.Provider value={valor}>
            <MemoryRouter initialEntries={[inicial]}>
                <Routes>
                    <Route element={<AppShell />}>
                        <Route path="/locador" element={<LocadorLayout />}>
                            <Route index element={<LocadorPainel />} />
                            <Route path="reservas" element={<LocadorReservas />} />
                            <Route path="espacos" element={<LocadorEspacos />} />
                            <Route path="financeiro" element={<LocadorFinanceiro />} />
                        </Route>
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}
