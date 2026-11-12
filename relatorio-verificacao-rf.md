# Relatório de verificação dos requisitos — LocaFesta

Fonte do texto: `C:\Users\Andrea\Downloads\Monografia_LocaFesta_ABNT_revisada_25.docx` (Tabela 1, RNF, seções 4.8 e 6.1, Apêndices B e C).

Data da verificação: 11/11/2026.

## Como foi verificado

- Leitura do texto extraído do `.docx`.
- Conferência de rotas, componentes e regras no código (`frontend/src`, `backend/src/main/java`).
- Rodada 2, com a API em `localhost:8080` e o front em `localhost:5173`. O Chromium do Playwright percorreu as telas públicas e as prévias de desenvolvimento do locador (`/dev/painel-locador`, `/dev/documentos-espaco`, `/dev/termos`), que entram como Locador A sem Firebase.

“Presente e funcionando” só foi usado quando a tela abriu e o resultado bateu com o texto. Teste de unidade, sem a tela correspondente, ficou em Parcial. Login, cadastro, e-mail e o que depende de sessão real do Firebase continuam Não testado. A monografia não foi alterada.

## Tabela 1 — Requisitos funcionais

| RF | O que a monografia diz | Situação | Evidência | O que ajustar |
|---|---|---|---|---|
| RF1 | Conta com e-mail/senha ou Google, com aceite da versão vigente dos Termos (data e hora). | Não testado | Código: `frontend/src/pages/login/Auth.jsx` (`signInWithPopup`, cadastro); `AceitarTermos.jsx`, `TermoService.aceitar`, tabela `aceites_termos`. Fluxo de cadastro + aceite não executado. | Testar com Firebase real antes de afirmar na banca. |
| RF2 | E-mail de confirmação via Firebase. | Não testado | `Auth.jsx` chama `sendEmailVerification` e bloqueia login se `emailVerified` for falso (por volta da linha 111). Envio real do e-mail não observado. | Testar a caixa de entrada de uma conta de demonstração. |
| RF3 | Entrar e sair da conta. | Não testado | Login em `Auth.jsx`; sair no menu do perfil. Não clicado nesta sessão. | Testar locatário, locador e admin. |
| RF4 | “Esqueci a senha” por e-mail. | Não testado | `sendPasswordResetEmail` em `Auth.jsx`; rota `/redefinir-senha`. E-mail não disparado. | Testar o e-mail de redefinição. |
| RF5 | Visitante pesquisa por nome, características, faixa de valor, data e horário e simula o valor, sem login. | Presente e funcionando | Sem login: busca “Campina Grande”, data 30/11/2026, 50 pessoas, modal Filtros com faixa de preço (`r2-02-busca-filtros.png`). No Local A, 30/11/2026 mostra “Dia inteiro, R$ 1.200,00, 08:00 às 23:00” (`r2-04b-simulacao-preco.png`). | — |
| RF6 | Exibir espaços com horários disponíveis. | Parcial | Dia livre 30/11/2026 aparece selecionável e oferece “Dia inteiro”. A API `GET /api/reservas/espaco/1/disponibilidade?data=2026-11-20` devolve o período integral indisponível (reserva aprovada das 10:00 às 18:00). O dia ocupado não foi clicado na tela. | Clicar 20/11 no calendário do Local A e ver o período desabilitado. |
| RF7 | Espaços em destaque na tela inicial. | Diferente do texto | Não há campo nem seção “destaque”. A home ordena “os mais bem avaliados aparecem primeiro” (`Home.jsx`). Existe `notaMedia` em `Espaco.java`, não uma vitrine destacada. | Ou criar a seção, ou trocar o RF7 para “ordenar a home pela nota média”. |
| RF8 | Perfil mostra etapas do cadastro feitas e pendentes. | Não testado | Modais e atalhos em `pages/dashboard` (`ModalCompletarCadastro.jsx`, `AtalhosPerfil.jsx`). Não aberto. | Abrir o perfil de um usuário incompleto e de um completo. |
| RF9 | CPF, telefone, endereço, identidade e comprovante; locatário fica pendente até completar; login só para fechar reserva. | Não testado | Upload em `DocumentoUpload.jsx` / `ModalCompletarCadastro.jsx`. A rota `/espaco/:id` é pública; reserva fica atrás de `RouteProtegida`. Pendência de validação existe no fluxo de documentos, mas não foi percorrida. | Testar visitante na página do espaço e o bloqueio ao enviar o pedido sem cadastro completo. |
| RF10 | Ver e editar dados pessoais. | Não testado | Modais de perfil (`ModalLocatario.jsx`, `ModalEndereco.jsx`). Não aberto. | Editar um campo e recarregar. |
| RF11 | Documentos enviados e situação (pendente, aprovado, rejeitado). | Parcial | `/dev/documentos-espaco?id=1` lista a capa do IPTU do Local A como APROVADO (`r2-13-documentos-espaco.png`). Pendente e rejeitado não apareceram, e nenhum arquivo novo foi enviado. | Enviar um documento e rejeitar outro no admin, com motivo. |
| RF12 | Envio de documento com descrição ou observação. | Não testado | `DocumentoUpload.jsx` tem campo de envio. Não foi feito upload. | Enviar um arquivo de teste e ver a observação gravada. |
| RF13 | Perfil de locador só depois do cadastro completo; aí libera anúncios, reservas e relatórios. | Não testado | `ModalLocador.jsx`, rotas `/locador`, `/locador/espacos`, `/locador/reservas`, `/locador/financeiro`. A trava de “cadastro completo” não foi exercitada. | Tentar abrir `/locador` com perfil incompleto. |
| RF14 | Vários espaços: estilo, capacidade, valores, regras de som, infraestrutura e fotos. | Não testado | `NovoEspaco.jsx` e `EspacoService`. Não foi criado anúncio. | Criar um segundo espaço com o Locador A. |
| RF15 | Abertura, fechamento, intervalo de limpeza, duração máxima, períodos gerados, valor adicional em horários, opção só integral, vários períodos sem limpeza entre eles. | Parcial | Períodos, integral/meio período, limpeza e antecedência estão em `AgendaEspaco` / `ReservaService` / `EtapaHorarios.jsx`. O acréscimo de horário é um texto serializado (`regrasTexto.js` → `restricoesHorario`), não a tabela `periodo_espaco` citada no modelo lógico. Não testado na tela. | Alinhar o modelo lógico ao armazenamento real, ou persistir os adicionais em tabela. Testar dois períodos seguidos. |
| RF16 | Locador escolhe aprovação manual ou ir direto ao pagamento. Com aprovação, paga só depois do aceite. Sem aprovação, não há pedido e a reserva só confirma quando o pagamento é aprovado. | Diferente do texto | O locador marca `aprovacaoInstantanea` (`EspacoService`, `EtapaHorarios.jsx`). No manual, `aprovarReserva` põe `APROVADA` e `pagamentoLiberado=true`. No instantâneo, `criarReserva` já grava `status=APROVADA` **antes** de qualquer pagamento (`ReservaService` ~linha 105) e **não** liga `pagamentoLiberado`. A tela manda o usuário pagar em seguida, mas a reserva já nasce confirmada. | Ou confirmar a reserva instantânea só depois do pagamento aprovado, ou reescrever o RF16 para “a reserva instantânea já nasce aprovada e o pagamento é o passo seguinte”. |
| RF17 | Antecedência mínima desabilita datas na agenda. | Presente e funcionando | Local A tem antecedência de 1 dia. Em 11/11/2026 o calendário deixa os dias anteriores a 12/11 bloqueados e informa “Mínimo de 1 dia” (`r2-04b-simulacao-preco.png`). | — |
| RF18 | Página do espaço com informações e avaliações. | Presente e funcionando | `/espaco/1`: Local A, nota 3,8, 5 avaliações, endereço, três fotos e preço (`r2-04-espaco-galeria-preco.png`). A lista completa de comentários não foi rolada até o fim. | — |
| RF19 | Locatário logado e com cadastro completo escolhe data e período e envia o pedido, com valor simulado, conforme RF16. | Não testado | Formulário em `DetalhesEspaco.jsx` → `POST /api/reservas`. Não enviado. | Fazer um pedido manual e um instantâneo com o Locatário A. |
| RF20 | Pagamento pela API do Mercado Pago em ambiente de testes. Com aprovação prévia, o pagamento só libera após o aceite (RF21). | Parcial | `PagamentoController.criarPreferencia` gera preferência e devolve `initPoint`. O pagamento de teste já chegou a abrir o checkout e gerar comprovante numa sessão anterior, mas a confirmação **não entra sozinha**: não há webhook em operação. Existe `POST /api/v1/pagamentos/sincronizar`, que consulta a API do MP e marca `pago` — isso não está descrito na monografia. `pagamentoLiberado` só vira verdadeiro em `aprovarReserva`. Pix não é um meio implementado à parte; o checkout é o do Mercado Pago. | No texto: manter a seção 4.8 (webhook e Pix em produção são futuro) e não descrever o sync como webhook. No sistema: não tratar o sync como confirmação oficial sem avisar que é consulta ativa, útil só em localhost. |
| RF21 | Locador vê reservas em ordem de chegada e, no modo manual, aprova ou recusa. Aprovar libera pagamento; recusar libera a data, sem cobrança, e notifica o locatário. | Parcial | A lista do Locador A mostra 19 reservas (16 aprovadas, 1 pendente, 1 rejeitada, 1 cancelada) e os botões Aprovar e Recusar no pedido de 17/11 (`r2-12-reservas-locador.png`). Os botões não foram clicados. | Aprovar o pedido de 17/11 e recusar outro, e ler o aviso do locatário. |
| RF22 | Locatário cancela pendente ou aprovada se o evento ainda não começou. | Não testado | `podeCancelarLocatario` em `frontend/src/pages/reserva/cancelamento.js` e `ReservaService.cancelarReserva`. Não cancelado nesta sessão. | Cancelar uma PENDENTE e uma APROVADA futura. |
| RF23 | Mensagem de reembolso total (≥15 dias), parcial 50% (14 a 7) ou nenhum (<7). Sem estorno real. | Parcial | `ReservaServiceCancelamentoTest` (3 testes) e `ReservaControllerPrevisaoCancelamentoTest` (2) passaram nesta rodada. As frases são “Será feito reembolso total.”, “Será feito reembolso parcial de 50%.” e “Sem reembolso.”. Nenhuma das três foi vista no modal de Minhas reservas. | Abrir Minhas reservas com uma conta de locatário e cancelar três reservas nessas faixas. |
| RF24 | Locador cancela reserva confirmada até um prazo anterior ao evento; locatário é informado de reembolso total; a data libera; as partes são notificadas. | Não testado | `podeCancelarLocador` usa `prazoCancelamentoDias` (padrão 2). `cancelarPeloLocador` em `ReservaService` e `avisarCancelamento`. Não executado. | Cancelar como locador dentro e fora do prazo. |
| RF25 | Depois do cancelamento a data volta a aparecer nas buscas. | Não testado | O cancelamento muda o status e a disponibilidade ignora reservas que não ocupam mais o horário (`intervalosOcupados` / conflito em `ReservaService`). Não conferido na busca. | Cancelar e pesquisar a mesma data. |
| RF26 | Notificar locador e locatário: quem cancelou e a condição de reembolso. | Não testado | `avisarCancelamento` grava aviso para locatário e, se houver, locador, com texto de autoria e condição. Sino em `CaixaAvisos.jsx`. Não aberto. | Cancelar e ler o aviso dos dois lados. |
| RF27 | Locatário avalia espaço depois de reserva aprovada. | Parcial | O modal continua em `MinhasReservas.jsx`. O WhatsApp de exemplo foi removido; ficou só `locafesta.suporte@gmail.com`. Nenhuma nota foi enviada: a tela exige o locatário logado. | Entrar como Locatário A, abrir uma reserva já encerrada e enviar a nota. |
| RF28 | Painel (pedidos, faturamento do mês, a receber, próximo evento) e Financeiro (bruto, comissão 10%, líquido, a receber, por período e espaço, mais alugados e horários mais procurados). Valores estimados, sem repasse. | Presente e funcionando | Mesmo recorte, Locador A, novembro/2026 inteiro: faturamento R$ 2.350,00 e a receber R$ 990,00 no Painel e no Financeiro em “Este mês” (`r2-08-painel.png`, `r2-10-financeiro-mes.png`). Seis meses: 16 aprovadas, bruto R$ 19.050,00, comissão R$ 1.905,00, líquido R$ 17.145,00; novembro marcado `nov./26*` (`r2-11-financeiro-6-meses.png`). O aviso da tela diz que o repasse automático não existe. | — |
| RF29 | Admin confere documentos de usuário e de espaço, aprova ou rejeita com motivo. | Não testado | `DocumentosAdmin.jsx`, `DocumentoService.aprovarDocumento` / `rejeitarDocumento`. Rotas `/dashboard-admin` e `/documentos-admin`. Não operado. | Aprovar um e rejeitar outro com motivo, nos dois tipos. |
| RF30 | Listas de favoritos com nome livre; incluir e tirar espaços. | Não testado | `Favoritos.jsx`, `SalvarLista.jsx`, `favoritosApi.js` → `/api/favoritos`. Não criado. | Criar “Aniversários da Duda”, salvar e remover um espaço. |
| RF31 | Admin edita e publica versões para locador e locatário. Aceite obrigatório para funções com conta. Pesquisa e simulação seguem abertas. Registro de usuário, versão, data e hora. | Não testado | `TermosAdminTab.jsx`, `TermoAdminController.publicar`, `TermoService.aceitar`, `TermosAceiteFilter`, `AceitarTermos.jsx`. Home e `/espaco/:id` ficam fora de `RouteProtegida`. Não publicado nem aceito nesta sessão. | Publicar uma versão de teste e ver o bloqueio em `/minhas-reservas` com a home ainda aberta. |

## Requisitos não funcionais

| ID | Texto | Situação | Nota |
|---|---|---|---|
| RNF1 | Consultas rápidas e capacidade de crescer. | Não testado | Não houve medição. O próprio texto (seção 4.4) admite que o XAMPP/dev server não foi feito para carga. |
| RNF2 | Comunicação protegida, acesso por perfil, senha criptografada. | Parcial | Senha fica no Firebase (o texto diz isso). Rotas de admin usam `RouteAdmin`. Várias APIs ainda identificam o usuário pelo cabeçalho `Usuario-Id`, e a seção 6 reconhece isso como provisório. Não há HTTPS local. |
| RNF3 | Interface responsiva em computador e celular. | Parcial | Rodapé da home e página do espaço foram abertos em 1280×900 e em 390×844 (`r2-01`, `r2-16`, `r2-05`). O restante das telas não foi medido em celular. |

## Seção 4.8 e seção 6.1

A seção 4.8 está alinhada ao que o código faz de fato: inicia o pagamento com credencial de teste e **não** opera webhook, retenção nem repasse. A frase “o Pix e o cartão de crédito em produção ficam como propostas futuras” também evita prometer Pix.

A seção 6.1 lista como futuro, e o código confirma a ausência: chat, canal de denúncias, estorno no Mercado Pago, encerramento automático da reserva, webhook, retenção/repasse, bloqueio de datas pelo locador (`indisponibilidade` citada como tabela futura), publicação em nuvem.

Divergência pontual: o sistema já tem `POST /api/v1/pagamentos/sincronizar` e o campo `reservas.pago`. Isso não é o webhook da seção 6.1, mas também não está descrito na 4.8. Quem ler só a monografia não sabe que a reserva pode ser marcada como paga por uma consulta ativa à API do Mercado Pago.

## Apêndices B e C

A versão 1 publicada no banco (locador e locatário) e o arquivo `termos.js` foram reescritos: saiu “por Pix”; os itens 4.3 e 5.2 passaram a valer “quando o pagamento estiver em operação”. A versão continua 1. O Apêndice B do `.docx` ainda não foi atualizado, porque a monografia não entrou nesta rodada.

O Apêndice C diz que o Termo de Reserva é exibido antes do pagamento, preenchido com os dados da reserva, e que o locatário precisa aceitá-lo. Não há tela nem registro desse aceite. As regras de reembolso aparecem só na mensagem de cancelamento (`PoliticaReembolso`), não num termo aceito no checkout.

O apêndice também afirma que, sem aprovação prévia, “a reserva é confirmada assim que o pagamento é aprovado”. O código confirma no momento do pedido (RF16).

## (a) No sistema e fora da Tabela 1

- Modo claro/escuro.
- Página Sobre (`/sobre`) e rodapé da home com links.
- Tutorial “Como usar o sistema” (`/jornada`).
- Sino de avisos com atalho “Ir ao pagamento”.
- Modal “Por que pedimos seus documentos?”.
- Atalho de suporte no modal de avaliação, só com o e-mail `locafesta.suporte@gmail.com`.
- Consulta ativa ao Mercado Pago para marcar `pago` (`/api/v1/pagamentos/sincronizar`), além de telas `/pagamento/sucesso`, `/falha` e `/pendente`.
- Bloqueio “você não pode reservar o seu próprio espaço” (`ReservaService` e `DetalhesEspaco.jsx`) — regra real, não está na Tabela 1.
- Mapa / lista / grade na home.
- Confirmação em modal antes de aprovar, recusar ou cancelar reserva (locador) e antes de enviar o pedido (locatário).

## (b) Frases que prometem o que o sistema não faz

- RF7: “espaços em destaque” como bloco próprio.
- RF16 e Apêndice C item 6.1: reserva sem aprovação só confirmada quando o pagamento é aprovado.
- Apêndice C: Termo de Reserva exibido e aceito antes do pagamento, com data e hora desse aceite.
- Modelo lógico (seção 4.7): tabela `periodo_espaco` para valor adicional. O acréscimo de horário vai no texto de regras do anúncio (`espacos.restricoes_horario`). A tabela não existe no banco.

## Contagem

| Situação | Quantidade (RF1–RF31) |
|---|---|
| Presente e funcionando | 4 (RF5, RF17, RF18, RF28) |
| Parcial | 7 (RF6, RF11, RF15, RF20, RF21, RF23, RF27) |
| Ausente | 0 por completo |
| Diferente do texto | 2 (RF7, RF16) |
| Não testado | 18 |

## Esquema real e Apêndice A

`TG/schema-real.sql` guarda `SHOW TABLES` e `SHOW CREATE TABLE` das 17 tabelas de `bdlocafesta`.

Não existem no banco: `periodo_espaco`, `indisponibilidade_espaco`, `pagamentos`. O valor adicional de horário fica em `espacos.restricoes_horario` (text). O pagamento fica em `reservas.pagamento_liberado` e `reservas.pago`.

`listas_favoritos`: `id`, `usuario_id`, `nome` varchar(80), `criada_em` datetime(6). O apêndice cita `nome` varchar(100) e `data_criacao`. Não há chave estrangeira.

`lista_favorito_espacos`: `lista_id`, `espaco_id`, `posicao`. A chave primária real é (`posicao`, `lista_id`), não (`lista_id`, `espaco_id`). Sem chave estrangeira.

`termos_uso`: `titulo` varchar(200), `conteudo` longtext, `tipo` enum('LOCADOR','LOCATARIO'), `status` enum('ARQUIVADO','PUBLICADO','RASCUNHO'), `versao` int(11), `criado_em` e `publicado_em` datetime(6), `criado_por` bigint. O apêndice descreve esses campos como varchar/text genéricos. Não há unique (tipo, versao) nem chave estrangeira.

`aceites_termos`: `id`, `usuario_id`, `termo_id`, `versao` int(11), `aceito_em` datetime(6). Sem unique (usuario, termo) e sem chave estrangeira.

## Prints desta rodada

Salvos em `TG/prints/`, 1280×900, e 390×844 onde o nome diz celular. E-mails mascarados. A monografia não foi alterada.

- `r2-01-rodape-home.png` — rodapé da home em 1280×900.
- `r2-02-busca-filtros.png` — busca Campina Grande, 30/11/2026, 50 pessoas, modal de filtros com a faixa de preço.
- `r2-03-mapa.png` — mapa com os marcadores de Campina Grande enquadrados.
- `r2-04-espaco-galeria-preco.png` — Local A com as três fotos, sem vazio ao lado e sem esmaecimento.
- `r2-04b-simulacao-preco.png` — mesma página, data 30/11/2026 e “Dia inteiro, R$ 1.200,00”.
- `r2-05-espaco-celular.png` — página do espaço em 390×844.
- `r2-06-cadastro.png` — formulário Criar conta, sem documentos (eles vêm depois do login).
- `r2-07-aceitar-termos.png` — `/aceitar-termos?tipo=LOCATARIO`, versão 1, botão “Aceitar e continuar” visível em 1280×900 sem rolar a página.
- `r2-08-painel.png` — Painel do Locador A: faturamento do mês R$ 2.350,00 e a receber R$ 990,00.
- `r2-09-notificacoes.png` — sino aberto, sem avisos.
- `r2-10-financeiro-mes.png` — Financeiro em “Este mês”, os mesmos R$ 2.350,00 e R$ 990,00.
- `r2-11-financeiro-6-meses.png` — seis meses, 16 aprovadas, novembro marcado com asterisco.
- `r2-12-reservas-locador.png` — 19 reservas, com Aprovar e Recusar no pedido pendente.
- `r2-13-documentos-espaco.png` — documentação do Local A, IPTU aprovado e formulário de envio.
- `r2-14-admin-termos.png` — prévia do admin, versão 1 publicada em 10/11/2026. Não é uma sessão de administrador logado.
- `r2-15-estado-vazio.png` — busca “Cidade Inexistente XYZ”, 0 espaços.
- `r2-16-rodape-celular.png` — rodapé em 390×844.
- `r2-17-checkout-teste.png` — a preferência do Mercado Pago foi criada (HTTP 200), mas o Chromium headless caiu na página de erro do Mercado Livre. Não é o formulário de pagamento.

## O que o Firebase impediu

Não marcar como funcionando. Passo a passo, com as contas de demonstração já cadastradas:

1. Cadastro e aceite. Em `/login`, “Cadastre-se”, preencher nome, telefone, e-mail e senha. Confirmar o e-mail que o Firebase enviar. Entrar de novo. Se `/aceitar-termos` abrir, rolar o texto, marcar o aceite e clicar “Aceitar e continuar”.
2. Documentos do locatário. No perfil, completar CPF, telefone, endereço, identidade (frente e verso) e comprovante. Conferir pendente, e depois aprovado ou rejeitado no admin.
3. Reserva manual. Entrar como locatário, abrir um espaço sem aprovação instantânea (Local A), escolher data e período e enviar o pedido. Entrar como Locador A, aprovar um e recusar outro.
4. Reserva instantânea. Repetir no Local B, que tem aprovação instantânea. A reserva nasce aprovada antes do pagamento.
5. Pagamento. Na reserva com pagamento liberado, clicar Pagar e usar o checkout de teste do Mercado Pago, sem cartão real de uso cotidiano. Voltar ao LocaFesta e ver se Minhas reservas marca pago.
6. Cancelamento pelo locatário. Em Minhas reservas, cancelar uma pendente (mensagem “sem cobrança”), uma aprovada com 15 dias ou mais (“reembolso total”), uma entre 7 e 14 dias (“parcial de 50%”) e uma com menos de 7 dias (“sem reembolso”).
7. Cancelamento pelo locador. Cancelar uma aprovada com mais de 2 dias de antecedência e tentar cancelar outra dentro desses 2 dias. A segunda deve avisar que o prazo passou.
8. Data liberada. Depois de um cancelamento, buscar a mesma data e ver o horário livre.
9. Avaliação. Numa reserva aprovada já encerrada, dar a nota. O texto de suporte deve mostrar só o e-mail.
10. Favoritos. Criar uma lista, incluir um espaço e tirá-lo.
11. Admin. Entrar como administrador, abrir documentos e aprovar um e rejeitar outro com motivo. Em Termos, publicar a versão 2, ver o bloqueio numa conta que aceitou só a v1, aceitar de novo e confirmar que a home segue aberta sem login.
