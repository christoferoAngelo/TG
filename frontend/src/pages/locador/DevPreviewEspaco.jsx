import { useEffect, useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import DetalhesEspaco from "../detalhes espaco/DetalhesEspaco";

const LOCADOR_A_UID = "dZ1lkQfXTZXfiio36x1Vg2s8nGi1";
const API = "http://localhost:8080/api";

/** Preview DEV: página do espaço como locatário (?preview=1), sem Firebase. */
export default function DevPreviewEspaco() {
    const [usuario, setUsuario] = useState(null);
    const [espacoId, setEspacoId] = useState(null);
    const [erro, setErro] = useState("");
    const mobile = new URLSearchParams(window.location.search).get("mobile") !== "0";

    useEffect(() => {
        (async () => {
            try {
                const uRes = await fetch(`${API}/users/${LOCADOR_A_UID}`);
                if (!uRes.ok) throw new Error("Locador A não encontrado");
                const u = await uRes.json();
                const eRes = await fetch(`${API}/locadores/${u.id}/espacos`);
                const lista = eRes.ok ? await eRes.json() : [];
                if (!lista.length) throw new Error("Nenhum espaço do Locador A");
                setUsuario({ ...u, locador: true, isLocador: true, locatario: true, isLocatario: true });
                setEspacoId(lista[0].id);
            } catch (e) {
                setErro(e.message);
            }
        })();
    }, []);

    if (erro) return <main style={{ padding: 32 }}>{erro}</main>;
    if (!usuario || !espacoId) return <main style={{ padding: 32 }}>Carregando prévia…</main>;

    const valor = {
        usuarioLogado: usuario,
        carregando: false,
        setUsuarioLogado: () => {},
        atualizarUsuario: async () => usuario,
        logout: async () => {},
    };

    const entrada = `/espaco/${espacoId}?preview=1${mobile ? "&vp=mobile" : ""}`;

    return (
        <AuthContext.Provider value={valor}>
            <MemoryRouter initialEntries={[entrada]}>
                <Routes>
                    <Route
                        path="/espaco/:id"
                        element={<DetalhesEspaco />}
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}
