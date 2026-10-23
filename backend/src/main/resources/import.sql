-- Inserção do Usuário Administrador
INSERT INTO users (
    firebase_uid, 
    nome, 
    email, 
    telefone, 
    data_cadastro, 
    data_ativo, 
    status_conta, 
    nota_geral, 
    endereco_id, 
    is_admin
) VALUES (
    'admin_firebase_uid_123', 
    'Administrador', 
    'admin@locafesta.com', 
    '11999999999', 
    NOW(), 
    NOW(), 
    'ATIVO', 
    5, 
    NULL, 
    true
);