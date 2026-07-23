import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Certifique-se de importar o useAuth
import Routes from "./routes";
import { useHeartbeat } from "./hooks/useHeartbeat"; // Importe o novo hook

/**
 * Componente invisível. O único trabalho dele é escutar o 
 * usuário logado do Context e rodar o ping de atividade.
 */
function HeartbeatRunner() {
    // Pegue o usuário logado do seu AuthContext (ajuste o nome da variável se necessário)
    const { usuario } = useAuth(); 
    
    // Roda o hook passando o ID do banco (não o uid do firebase)
    useHeartbeat(usuario?.id); 
    
    return null; // Não renderiza nada na tela
}

/**
 * Ponto de entrada do Frontend do LocaFesta.
 */
export default function App() {
    return (
        <AuthProvider>
            <HeartbeatRunner />
            <Routes/>
        </AuthProvider>
    );
}