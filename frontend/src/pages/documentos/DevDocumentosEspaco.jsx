import { useEffect, useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import AppShell from "../../components/layout/AppShell";
import DocumentosEspaco from "./DocumentosEspaco";

const LOCADOR_A_UID = "dZ1lkQfXTZXfiio36x1Vg2s8nGi1";
const API = "http://localhost:8080/api";

/** Preview local da documentação do espaço (sem Firebase). Só DEV / captura. */
export default function DevDocumentosEspaco() {
    const params = new URLSearchParams(window.location.search);
    const espacoId = params.get("id") || "1";

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
            <MemoryRouter initialEntries={[`/documentos/espaco/${espacoId}`]}>
                <Routes>
                    <Route element={<AppShell />}>
                        <Route path="/documentos/espaco/:id" element={<DocumentosEspaco />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}
