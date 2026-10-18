-- Backup antes! Confirme o nome da tabela (a entity usa "reservas").
-- Se o projeto roda com spring.jpa.hibernate.ddl-auto=update, o Hibernate cria as
-- colunas sozinho; o índice abaixo ele NÃO cria.
ALTER TABLE reservas
    ADD COLUMN hora_inicio TIME NULL,
    ADD COLUMN hora_fim TIME NULL;

CREATE INDEX idx_reservas_espaco_data_status
    ON reservas (espaco_id, data_evento, status);

-- Reservas antigas ficam com hora_inicio/hora_fim NULL e o sistema as trata como
-- "dia inteiro" (bloqueiam a data toda), então nada antigo vira conflito silencioso.
