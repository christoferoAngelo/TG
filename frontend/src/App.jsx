import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // Certifique-se de importar o useAuth
import Routes from "./routes";
import { useHeartbeat } from "./hooks/useHeartbeat"; // Importe o novo hook
import DevPainelPreview from "./pages/locador/DevPainelPreview";
import DevPreviewEspaco from "./pages/locador/DevPreviewEspaco";
import DevDocumentosEspaco from "./pages/documentos/DevDocumentosEspaco";
import DevTermosPreview from "./pages/admin/DevTermosPreview";

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
    // Previews DEV sem Firebase (captura de tela)
    // /dev/painel-locador?secao=painel|reservas|espacos|financeiro
    // /dev/preview-espaco?mobile=1
    if (import.meta.env.DEV && window.location.pathname.startsWith("/dev/painel-locador")) {
        return <DevPainelPreview />;
    }
    if (import.meta.env.DEV && window.location.pathname.startsWith("/dev/preview-espaco")) {
        return <DevPreviewEspaco />;
    }
    if (import.meta.env.DEV && window.location.pathname.startsWith("/dev/documentos-espaco")) {
        return <DevDocumentosEspaco />;
    }
    if (import.meta.env.DEV && window.location.pathname.startsWith("/dev/termos")) {
        return <DevTermosPreview />;
    }

    return (
        <AuthProvider>
            <HeartbeatRunner />
            <Routes/>
        </AuthProvider>
    );
}