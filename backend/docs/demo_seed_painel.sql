-- Seed opcional (MySQL) — preferir DemoPainelInicializador com locafesta.demo-seed=true.
-- Ajuste os IDs abaixo conforme a base local (Locador A / Local A / Locatário A).
-- Nunca execute em produção.

-- Exemplo: limpar demos anteriores
-- DELETE FROM reservas WHERE observacao LIKE '[DEMO]%';

-- INSERT de exemplo (substitua :espaco_id e :locatario_id):
-- INSERT INTO reservas (espaco_id, locatario_id, data_evento, hora_inicio, hora_fim, valor_total, status, pagamento_liberado, observacao)
-- VALUES
-- (:espaco_id, :locatario_id, DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '10:00:00', '18:00:00', 980.00, 'APROVADA', 1, '[DEMO] sql #1'),
-- (:espaco_id, :locatario_id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', '18:00:00', 1200.00, 'PENDENTE', 0, '[DEMO] sql #2');

-- Remoção:
DELETE FROM reservas WHERE observacao LIKE '[DEMO]%';
