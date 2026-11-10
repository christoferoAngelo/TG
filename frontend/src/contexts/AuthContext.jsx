import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { userService } from "../config/api";
import {
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
    const [precisaAceitarTermos, setPrecisaAceitarTermos] = useState(false);

    const verificarTermosPendentes = useCallback(async () => {
        if (!auth.currentUser) {
            setTermosPendentes([]);
            setPrecisaAceitarTermos(false);
            return false;
        }
        try {
            await sincronizarAceitesPendentesDoStorage();
            const resp = await termoService.pendente();
            const lista = resp?.termosPendentes || [];
            const precisa = Boolean(resp?.precisaAceitar && lista.length);
            setTermosPendentes(lista);
            setPrecisaAceitarTermos(precisa);
            return precisa;
        } catch (e) {
            console.error("Erro ao verificar termos pendentes:", e);
            return false;
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    await firebaseUser.reload();

                    if (!firebaseUser.emailVerified) {
                        setUsuarioLogado(null);
                        setPrecisaAceitarTermos(false);
                        setLoading(false);
                        return;
                    }

                    const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
                    if (perfilLocal) {
                        setUsuarioLogado(perfilLocal);
                        const admin = perfilLocal.admin || perfilLocal.isAdmin;
                        if (!admin) {
                            await verificarTermosPendentes();
                        } else {
                            setPrecisaAceitarTermos(false);
                            setTermosPendentes([]);
                        }
                    }
                } catch (error) {
                    console.error("Erro ao recuperar dados do usuário após recarregar a página:", error);
                }
            } else {
                setUsuarioLogado(null);
                setTermosPendentes([]);
                setPrecisaAceitarTermos(false);
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
            if (!(perfilLocal.admin || perfilLocal.isAdmin)) {
                await verificarTermosPendentes();
            }
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
            setPrecisaAceitarTermos(false);
        } catch (error) {
            console.error("Erro ao deslogar:", error);
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
        termosPendentes,
        precisaAceitarTermos,
        setPrecisaAceitarTermos,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
