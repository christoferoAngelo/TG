import React, { createContext, useContext, useState, useEffect } from "react";
// Importe o auth da sua configuração do Firebase
import { auth } from "../config/firebaseConfig"; 
// Importe as funções nativas de sessão do Firebase
import { signOut, onAuthStateChanged } from "firebase/auth"; 
import { userService } from "../config/api"; // Ajuste o caminho se necessário

// 1. Criação do Contexto
const AuthContext = createContext();

// 2. Hook customizado para facilitar o uso nos componentes
export function useAuth() {
    return useContext(AuthContext);
}

// 3. Provider que vai envolver a sua aplicação
export function AuthProvider({ children }) {
    // Estado que guarda os dados do usuário vindos do MySQL/Spring Boot
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Escuta as mudanças de estado da sessão nativa do Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Caso o usuário recarregue a página (F5), o Firebase ainda tem a sessão.
                // Aqui podemos buscar os dados no backend novamente para não perder o estado.
                try {
                    const perfilLocal = await userService.buscarPerfilPorUid(firebaseUser.uid);
                    if (perfilLocal) {
                        setUsuarioLogado(perfilLocal);
                    }
                } catch (error) {
                    console.error("Erro ao recuperar dados do usuário após recarregar a página:", error);
                }
            } else {
                // Se não houver usuário no Firebase, garante que o estado local está limpo
                setUsuarioLogado(null);
            }
            setLoading(false); // Libera a renderização da tela
        });

        // Limpa o listener quando o componente for desmontado
        return () => unsubscribe();
    }, []);

    // 4. Função de Logout Corrigida
    const logout = async () => {
        try {
            // A. Quebra a sessão persistente do Firebase (Isso resolve o bug de voltar logado)
            await signOut(auth);
            
            // B. Zera o estado global do React
            setUsuarioLogado(null);
            
            // C. Limpa qualquer armazenamento local que você possa estar usando para tokens ou cache
            localStorage.removeItem("usuario");
            localStorage.removeItem("token"); 
            
        } catch (error) {
            console.error("Erro ao deslogar:", error);
        }
    };

    // Objeto com os dados e funções que serão distribuídos para o sistema
    const value = {
        usuarioLogado,
        setUsuarioLogado,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Só renderiza as rotas da plataforma de eventos depois de checar a sessão */}
            {!loading && children} 
        </AuthContext.Provider>
    );
}