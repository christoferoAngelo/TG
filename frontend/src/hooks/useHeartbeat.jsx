import { useEffect } from 'react';
import { userService } from  '../config/api'; // Ajuste o caminho conforme necessário 

export function useHeartbeat(usuarioId) {
    useEffect(() => {
        // Se não tiver ID (usuário deslogado), não faz nada
        if (!usuarioId) return;

        const enviarPing = async () => {
            // Só dispara se o usuário estiver com a aba do LocaFesta aberta e visível
            if (document.visibilityState === 'visible') {
                await userService.atualizarDataAtivo(usuarioId);
            }
        };

        // 1. Dispara o primeiro ping assim que o hook é montado
        enviarPing();

        // 2. Define o intervalo para rodar a cada 10 minutos (600.000 ms)
        const intervalo = setInterval(enviarPing, 3 * 60 * 1000);

        // 3. Limpeza automática se o usuário deslogar ou fechar o app
        return () => clearInterval(intervalo);
    }, [usuarioId]);
}