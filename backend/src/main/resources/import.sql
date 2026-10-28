-- Administrador master
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
    'Vcn5kwl0vCZVI2Fcu2itwo73eOv2',
    'Suporte Locafesta',
    'locafesta.suporte@gmail.com',
    NULL,
    NOW(),
    NOW(),
    'ATIVO',
    NULL,
    NULL,
    1
);

-- Características iniciais
INSERT INTO caracteristicas (nome, icone) VALUES
('Piscina', '/icones/caracteristicas/piscina.png'),
('Churrasqueira', '/icones/caracteristicas/churrasqueira.png'),
('Buffet', '/icones/caracteristicas/buffet.png'),
('Palco', '/icones/caracteristicas/palco.png'),
('Permitido pets', '/icones/caracteristicas/pets.png'),
('Estrutura para show', '/icones/caracteristicas/show.png'),
('Decoração', '/icones/caracteristicas/decoracao.png');
