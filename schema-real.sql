-- Schema real de bdlocafesta (MariaDB / XAMPP) em 2026-11-11
-- Comandos: SHOW TABLES e SHOW CREATE TABLE de cada tabela

-- SHOW TABLES
-- aceites_termos
-- ambiente_imagens
-- caracteristicas
-- documentos
-- enderecos
-- espaco_ambientes
-- espaco_caracteristicas
-- espacos
-- lista_favorito_espacos
-- listas_favoritos
-- notificacoes
-- perfis_locador
-- perfis_locatario
-- reservas
-- tb_log_auditoria
-- termos_uso
-- users

CREATE TABLE `aceites_termos` (
  `versao` int(11) NOT NULL,
  `aceito_em` datetime(6) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `termo_id` bigint(20) NOT NULL,
  `usuario_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ambiente_imagens` (
  `ambiente_id` bigint(20) NOT NULL,
  `url_imagem` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `caracteristicas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `icone` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `documentos` (
  `data_analise` datetime(6) DEFAULT NULL,
  `data_envio` datetime(6) NOT NULL,
  `espaco_id` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) DEFAULT NULL,
  `categoria` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `tipo_documento` varchar(50) NOT NULL,
  `arquivo_url` text DEFAULT NULL,
  `motivo_rejeicao` text DEFAULT NULL,
  `nome_arquivo` varchar(255) DEFAULT NULL,
  `observacao` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `enderecos` (
  `estado` varchar(2) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cep` varchar(9) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `logradouro` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `espaco_ambientes` (
  `espaco_id` bigint(20) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `espaco_caracteristicas` (
  `caracteristica_id` bigint(20) NOT NULL,
  `espaco_id` bigint(20) NOT NULL,
  PRIMARY KEY (`caracteristica_id`,`espaco_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `espacos` (
  `antecedencia_minima_dias` int(11) NOT NULL,
  `aprovacao_instantanea` bit(1) NOT NULL,
  `ativo` bit(1) NOT NULL,
  `capacidade_pessoas` int(11) NOT NULL,
  `duracao_max_horas` decimal(4,2) DEFAULT NULL,
  `horario_abertura` time DEFAULT NULL,
  `horario_fechamento` time DEFAULT NULL,
  `intervalo_limpeza_min` int(11) NOT NULL,
  `nota_media` double DEFAULT NULL,
  `permite_horario_personalizado` bit(1) NOT NULL,
  `permite_meio_periodo` bit(1) NOT NULL,
  `permite_periodo_integral` bit(1) NOT NULL,
  `prazo_cancelamento_dias` int(11) NOT NULL,
  `quantidade_avaliacoes` int(11) DEFAULT NULL,
  `valor_diaria` decimal(12,2) DEFAULT NULL,
  `valor_hora` decimal(12,2) DEFAULT NULL,
  `valor_meio_periodo` decimal(12,2) DEFAULT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `endereco_id` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `locador_id` bigint(20) NOT NULL,
  `status_aprovacao` varchar(20) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `foto_capa_url` varchar(500) DEFAULT NULL,
  `descricao` text NOT NULL,
  `motivo_rejeicao` text DEFAULT NULL,
  `resposta_locador` text DEFAULT NULL,
  `restricoes_horario` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `lista_favorito_espacos` (
  `posicao` int(11) NOT NULL CHECK (`posicao` >= 0),
  `espaco_id` bigint(20) NOT NULL,
  `lista_id` bigint(20) NOT NULL,
  PRIMARY KEY (`posicao`,`lista_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `listas_favoritos` (
  `criada_em` datetime(6) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `nome` varchar(80) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `notificacoes` (
  `lida` bit(1) NOT NULL,
  `criada_em` datetime(6) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reserva_id` bigint(20) DEFAULT NULL,
  `usuario_id` bigint(20) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `mensagem` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `perfis_locador` (
  `data_ativo` datetime(6) DEFAULT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `nome_fantasia` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `perfis_locatario` (
  `data_ativo` datetime(6) DEFAULT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reservas` (
  `data_evento` date DEFAULT NULL,
  `hora_fim` time DEFAULT NULL,
  `hora_inicio` time DEFAULT NULL,
  `nota` int(11) DEFAULT NULL,
  `pagamento_liberado` bit(1) NOT NULL,
  `pago` bit(1) NOT NULL DEFAULT b'0',
  `valor_total` decimal(38,2) DEFAULT NULL,
  `cancelado_em` datetime(6) DEFAULT NULL,
  `data_avaliacao` datetime(6) DEFAULT NULL,
  `espaco_id` bigint(20) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `locatario_id` bigint(20) NOT NULL,
  `cancelado_por` varchar(20) DEFAULT NULL,
  `condicao_reembolso` varchar(40) DEFAULT NULL,
  `comentario_avaliacao` varchar(500) DEFAULT NULL,
  `observacao` varchar(500) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `tb_log_auditoria` (
  `admin_id` bigint(20) NOT NULL,
  `data_hora` datetime(6) NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `acao` varchar(255) NOT NULL,
  `admin_nome` varchar(255) DEFAULT NULL,
  `detalhes` text DEFAULT NULL,
  `id_entidade` varchar(255) DEFAULT NULL,
  `tipo_entidade` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `termos_uso` (
  `versao` int(11) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `criado_por` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `publicado_em` datetime(6) DEFAULT NULL,
  `titulo` varchar(200) NOT NULL,
  `conteudo` longtext NOT NULL,
  `status` enum('ARQUIVADO','PUBLICADO','RASCUNHO') NOT NULL,
  `tipo` enum('LOCADOR','LOCATARIO') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `is_admin` tinyint(1) NOT NULL,
  `nota_geral` int(11) DEFAULT NULL,
  `data_ativo` datetime(6) DEFAULT NULL,
  `data_cadastro` datetime(6) NOT NULL,
  `endereco_id` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `foto_url` varchar(500) DEFAULT NULL,
  `firebase_uid` varchar(255) NOT NULL,
  `status_conta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
