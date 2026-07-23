/**
 * Serviço de integração com o Backend Spring Boot (MySQL).
 * Aqui centralizamos todas as requisições HTTP do projeto LocaFesta.
 */

const BASE_URL = "http://localhost:8080/api";

export const userService = {
    /**
     * Envia os dados do usuário recém-criado no Firebase para serem salvos no MySQL.
     * @param {Object} userData - Dados do usuário (firebaseUid, nome, email, telefone)
     */
    cadastrarNoBancoLocal: async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const erroMensagem = await response.text();
                throw new Error(erroMensagem || "Erro ao cadastrar usuário no servidor local.");
            }

            return await response.json();
        } catch (error) {
            console.error("Erro no cadastro local:", error.message);
            throw error;
        }
    },

    /**
     * Busca o perfil do usuário no MySQL usando o UID único do Firebase.
     * @param {string} firebaseUid - UID gerado pelo Firebase
     */
    buscarPerfilPorUid: async (firebaseUid) => {
        try {
            const response = await fetch(`${BASE_URL}/users/${firebaseUid}`);
            
            if (response.status === 404) {
                return null; // Usuário autenticado no Firebase mas ainda não salvo no MySQL
            }

            if (!response.ok) {
                throw new Error("Erro ao buscar perfil do usuário no banco local.");
            }

            return await response.json();
        } catch (error) {
            console.error("Erro ao carregar perfil:", error.message);
            throw error;
        }
    },
    /**
     * Atualiza o campo dataAtivo do usuário no banco para o momento atual.
     * @param {number} usuarioId - ID numérico do MySQL
     */
    atualizarDataAtivo: async (usuarioId) => {
        try {
            // Nota: Confirme se o seu Controller no Spring está mapeado assim
            const response = await fetch(`${BASE_URL}/users/${usuarioId}/ativo`, {
                method: "PATCH",
            });
            
            if (!response.ok) {
                throw new Error("Erro silencioso: Não foi possível atualizar a atividade.");
            }
        } catch (error) {
            // Como é um ping de background, não precisamos estourar o erro na tela
            console.error("Erro no ping ativo:", error.message);
        }
    }
};