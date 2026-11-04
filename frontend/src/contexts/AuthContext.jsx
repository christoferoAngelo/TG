import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { userService } from "../config/api";
import TermosModal from "../components/apresentacao/TermosModal";
import {
    registrarAceiteTermos,
    sincronizarAceitesPendentesDoStorage,
    termoService,
} from "../services/termoService";

export const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [termosPendentes, setTermosPendentes] = useState([]);
    const [avisoTermosAberto, setAvisoTermosAberto] = useState(false);

    const verificarTermosPendentes = useCallback(async () => {
        if (!auth.currentUser) {
            setTermosPendentes([]);
            setAvisoTermosAberto(false);
            return;
        }
        try {
            await sincronizarAceitesPendentesDoStorage();
            const resp = await termoService.pendente();
            const lista = resp?.termosPendentes || [];
            setTermosPendentes(lista);
            setAvisoTermosAberto(Boolean(resp?.precisaAceitar && lista.length));
        } catch (e) {
            console.error("Erro ao verificar termos pendentes:", e);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    await firebaseUser.reload();

                    if (!firebaseUser.emailVerified) {
                        setUsuarioLogado(null);
                        setLoading(false);
                        return;
                    }

                    const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
                    if (perfilLocal) {
                        setUsuarioLogado(perfilLocal);
                        await verificarTermosPendentes();
                    }
                } catch (error) {
                    console.error("Erro ao recuperar dados do usuário após recarregar a página:", error);
                }
            } else {
                setUsuarioLogado(null);
                setTermosPendentes([]);
                setAvisoTermosAberto(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [verificarTermosPendentes]);

    const atualizarUsuario = useCallback(async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return null;

        const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
        if (perfilLocal) {
            setUsuarioLogado(perfilLocal);
            await verificarTermosPendentes();
        }
        return perfilLocal;
    }, [verificarTermosPendentes]);

    const logout = async () => {
        try {
            await signOut(auth);
            setUsuarioLogado(null);
            localStorage.removeItem("usuario");
            localStorage.removeItem("token");
            setTermosPendentes([]);
            setAvisoTermosAberto(false);
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    };

    const aceitarTermosPendentes = async (termoIds) => {
        try {
            await registrarAceiteTermos(termoIds?.length ? termoIds : termosPendentes.map((t) => t.id));
            setAvisoTermosAberto(false);
            setTermosPendentes([]);
        } catch (e) {
            console.error(e);
        }
    };

    const value = {
        usuarioLogado,
        setUsuarioLogado,
        atualizarUsuario,
        logout,
        loading,
        carregando: loading,
        verificarTermosPendentes,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            <TermosModal
                aberto={avisoTermosAberto}
                termosForcados={termosPendentes}
                onAceitar={aceitarTermosPendentes}
                onFechar={() => setAvisoTermosAberto(false)}
                titulo="Atualização dos Termos de Uso"
                textoConfirmar="Aceitar nova versão"
            />
        </AuthContext.Provider>
    );
}
