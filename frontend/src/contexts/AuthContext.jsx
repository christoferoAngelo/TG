import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { userService } from "../config/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [carregando, setCarregando] = useState(true);

    // Monitora o estado de autenticação do Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Sincroniza com as informações locais do MySQL
                    const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
                    if (perfilLocal) {
                        setUsuarioLogado(perfilLocal);
                    }
                } catch (error) {
                    console.error("Erro ao carregar perfil do banco MySQL:", error);
                }
            } else {
                setUsuarioLogado(null);
            }
            setCarregando(false);
        });

        return () => unsubscribe();
    }, []);

    // Função de logout compartilhada
    const logout = async () => {
        await signOut(auth);
        setUsuarioLogado(null);
    };

    return (
        <AuthContext.Provider value={{ usuarioLogado, setUsuarioLogado, carregando, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para consumir o contexto de forma mais simples
export const useAuth = () => useContext(AuthContext);