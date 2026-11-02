# Seed de demonstração — Painel do locador

Gera reservas de exemplo (`observacao` começando com `[DEMO]`) para o **Locador A** / **Local A**, cobrindo vários meses e status (`PENDENTE`, `APROVADA`, `REJEITADA`, `CANCELADA`) para preencher os gráficos do painel.

## Como ativar

1. Em `src/main/resources/application.properties` (ou profile `dev`):

```properties
locafesta.demo-seed=true
```

2. Garanta que o seed de usuários/espaços já rodou (`UsuariosTesteInicializador` + `EspacosTesteInicializador`).
3. Reinicie o backend.
4. Entre como Locador A e abra `/locador`.

## Como desativar / limpar

1. Volte a flag para `false` (ou remova a propriedade).
2. Remova as reservas demo no MySQL:

```sql
DELETE FROM reservas WHERE observacao LIKE '[DEMO]%';
```

Ou, com `ddl-auto=create`, basta reiniciar sem a flag (base recriada).

## Segurança

A classe `DemoPainelInicializador` só sobe com `@ConditionalOnProperty(name = "locafesta.demo-seed", havingValue = "true")`. **Não ative em produção.**
