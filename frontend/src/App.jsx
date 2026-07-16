import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./routes";

/**
 * Ponto de entrada do Frontend do LocaFesta.
 * O AuthProvider envolve todo o sistema de rotas para que todas as páginas
 * tenham acesso ao estado de login do usuário.
 */
export default function App() {
    return (
        <AuthProvider>
            <Routes/>
        </AuthProvider>
    );
}