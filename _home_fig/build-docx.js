const fs = require("fs");
const path = require("path");

const SRC_XML = "C:/Users/Andrea/Desktop/TG/_home_fig/document.xml";
const SRC_RELS = "C:/Users/Andrea/Desktop/TG/_home_fig/document.xml.rels";
const OUT_DIR = "C:/Users/Andrea/Desktop/TG/_home_fig/out";

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("not png: " + file);
  }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), buf };
}

function paraStartAt(xml, index) {
  let i = index;
  while (i > 0) {
    const found = xml.lastIndexOf("<w:p", i);
    if (found < 0) break;
    const next = xml[found + 4];
    if (next === " " || next === ">") return found;
    i = found - 1;
  }
  throw new Error("paragraph start not found");
}

function paraContaining(xml, needle) {
  const i = xml.indexOf(needle);
  if (i < 0) throw new Error("missing paragraph: " + needle);
  const start = paraStartAt(xml, i);
  const end = xml.indexOf("</w:p>", i) + 6;
  const chunk = xml.slice(start, end);
  if (!chunk.startsWith("<w:p ") && !chunk.startsWith("<w:p>")) {
    throw new Error("paragraph slice is not a paragraph: " + needle);
  }
  return { start, end, xml: chunk };
}

function stripParaId(p) {
  return p.replace(/\s*w14:paraId="[^"]*"/g, "");
}

function textPara(template, text) {
  let p = stripParaId(template);
  const replaced = p.replace(
    /<w:t[^>]*>[^<]*<\/w:t>/,
    `<w:t xml:space="preserve">${esc(text)}</w:t>`
  );
  if (replaced === p) throw new Error("text paragraph has no w:t");
  return replaced;
}

function drawingPara(template, spec) {
  let p = stripParaId(template);
  if (!/<wp:docPr id="\d+"/.test(p)) throw new Error("drawing template has no docPr");
  p = p.replace(
    /<wp:docPr id="\d+" name="[^"]*"/,
    `<wp:docPr id="${spec.docPr}" name="Figura ${spec.docPr}"`
  );
  p = p.replace(
    /<pic:cNvPr id="\d+" name="[^"]*"/,
    `<pic:cNvPr id="${spec.docPr}" name="${esc(spec.name)}"`
  );
  p = p.replace(/r:embed="rId\d+"/, `r:embed="${spec.rId}"`);
  p = p.replace(/cx="\d+"/g, `cx="${spec.cx}"`);
  p = p.replace(/cy="\d+"/g, `cy="${spec.cy}"`);
  return p;
}

function mustOnce(xml, needle) {
  const n = xml.split(needle).length - 1;
  if (n !== 1) throw new Error(`expected 1 of [${needle}] got ${n}`);
}

let xml = fs.readFileSync(SRC_XML, "utf8").replace(/^\uFEFF/, "");
let rels = fs.readFileSync(SRC_RELS, "utf8").replace(/^\uFEFF/, "");

if (!rels.includes('Id="rId27"') || !rels.includes("media/image20.png")) {
  throw new Error("rId27/image20 relationship not found");
}
if (!xml.includes("Exibir, na tela inicial, espaços em destaque.")) {
  throw new Error("RF7 wording missing before edit");
}

const capTpl = paraContaining(
  xml,
  "Figura 12 – Página inicial do LocaFesta na visão do visitante"
).xml;
const drawTpl = paraContaining(xml, 'r:embed="rId27"').xml;
const bodyTpl = paraContaining(
  xml,
  "A página inicial permite que o visitante conheça os espaços anunciados sem precisar entrar em uma conta."
).xml;
const fonteNeedle = "Fonte: Elaborada pelos autores (2026).";
const homeDraw = paraContaining(xml, 'r:embed="rId27"');
const fonteTpl = paraContaining(xml.slice(homeDraw.end), fonteNeedle).xml;
const listaTpl = paraContaining(
  xml,
  "Figura 12 – Tela Meus espaços do locador"
).xml;

for (const [name, tpl] of [
  ["cap", capTpl],
  ["draw", drawTpl],
  ["body", bodyTpl],
  ["fonte", fonteTpl],
  ["lista", listaTpl],
]) {
  if (!tpl.startsWith("<w:p ") && !tpl.startsWith("<w:p>")) {
    throw new Error(name + " template does not start a paragraph: " + tpl.slice(0, 80));
  }
}

const CX = 5394960;
const docPrStart = Math.max(...[...xml.matchAll(/<wp:docPr id="(\d+)"/g)].map((m) => Number(m[1]))) + 1;
let docPr = docPrStart;
let rIdN = 60;

const media = [];

function addImage(file) {
  const size = pngSize(file);
  const cy = Math.round((CX * size.h) / size.w);
  const id = rIdN++;
  const rId = "rId" + id;
  const name = "extra-" + id + ".png";
  media.push({ rId, name, file, cx: CX, cy, w: size.w, h: size.h });
  return { rId, name, cx: CX, cy };
}

function figureBlock(item) {
  const img = addImage(item.file);
  const token = item.token;
  return (
    textPara(bodyTpl, item.text) +
    textPara(capTpl, `Figura ${token} – ${item.caption}`) +
    drawingPara(drawTpl, {
      rId: img.rId,
      docPr: docPr++,
      name: path.basename(item.file),
      cx: img.cx,
      cy: img.cy,
    }) +
    textPara(fonteTpl, "Fonte: Elaborada pelos autores (2026).")
  );
}

function lead(text) {
  return textPara(bodyTpl, text);
}

const base2 = "C:/Users/Andrea/Desktop/TG/prints_monografia_segunda_rodada";
const base1 = "C:/Users/Andrea/Desktop/TG/prints_monografia_restantes";
const pay = "C:/Users/Andrea/Desktop/TG/_home_fig";

const beforeLocador = [
  lead(
    "Com a conta autenticada, o locatário consulta o perfil, as próprias reservas, os favoritos e a solicitação de um espaço."
  ),
  figureBlock({
    token: "T01",
    file: base2 + "/02-perfil-dados.png",
    text: "O perfil do locatário reúne nome, e-mail de demonstração, telefone e CPF mascarado (RF9 e RF10). A captura mostra os dados já preenchidos; não registra o envio do documento de identidade.",
    caption: "Perfil do locatário com dados pessoais de demonstração",
  }),
  figureBlock({
    token: "T02",
    file: base2 + "/04-minhas-reservas.png",
    text: "A lista Minhas reservas apresenta os pedidos do locatário, com data, horário, valor e situação (RF22).",
    caption: "Reservas do locatário",
  }),
  figureBlock({
    token: "T03",
    file: base2 + "/05-cancelamento-reembolso.png",
    text: "Ao iniciar um cancelamento, a interface informa o reembolso parcial de 50% e que a data voltaria a ficar disponível (RF23). A mensagem é a evidência visual desse requisito. O botão de confirmar não foi acionado, então a captura não registra um cancelamento concluído nem a liberação da data (RF25).",
    caption: "Mensagem de reembolso parcial no cancelamento da reserva",
  }),
  figureBlock({
    token: "T04",
    file: base2 + "/06-favoritos.png",
    text: "A tela de favoritos existe para o locatário organizar espaços salvos (RF30). Nesta captura a lista está vazia, então a imagem não mostra um espaço já guardado.",
    caption: "Tela de favoritos do locatário, sem espaços salvos",
  }),
  figureBlock({
    token: "T05",
    file: base1 + "/10-data-indisponivel.png",
    text: "Na página do anúncio, uma data já reservada aparece como indisponível e o período não pode ser escolhido (RF17). A captura mostra o bloqueio na interface; não cria uma nova reserva.",
    caption: "Data indisponível na consulta do espaço",
  }),
  figureBlock({
    token: "T06",
    file: base2 + "/18-confirmacao-reserva.png",
    text: "Depois da escolha da data, o sistema pede confirmação antes de seguir ao pagamento (RF19). O diálogo foi apenas exibido; o botão Confirmar e pagar não foi acionado.",
    caption: "Confirmação da solicitação de reserva antes do pagamento",
  }),
  lead(
    "A etapa seguinte é o pagamento. As duas capturas mostram o resumo no LocaFesta e a escolha da forma no Mercado Pago. Nenhuma delas é um pagamento concluído (RF20)."
  ),
  figureBlock({
    token: "T07",
    file: pay + "/pag-finalizar.png",
    text: "A tela Finalizar pagamento apresenta o espaço e o valor total, com o botão para seguir ao Mercado Pago (RF20).",
    caption: "Tela de finalizar pagamento no LocaFesta",
  }),
  figureBlock({
    token: "T08",
    file: pay + "/pag-checkout-salao.png",
    text: "O checkout de testes lista as formas de pagamento do pedido do Salão Horizonte Corporativo, no valor de R$ 1.800. A captura para antes da confirmação e não contém dados de cartão.",
    caption: "Escolha da forma de pagamento no checkout de testes",
  }),
].join("");

const beforeAdmin = [
  lead(
    "O cadastro do anúncio, a edição de ambientes com fotos e o calendário das reservas recebidas complementam a área do locador."
  ),
  figureBlock({
    token: "T09",
    file: base2 + "/08-cadastrar-espaco.png",
    text: "O cadastro do espaço começa pela apresentação do anúncio, com nome e descrição, em um assistente de quatro etapas (RF14). A captura mostra só a primeira etapa, não o envio do anúncio.",
    caption: "Primeira etapa do cadastro de espaço",
  }),
  figureBlock({
    token: "T10",
    file: base2 + "/15-editar-ambientes-fotos.png",
    text: "Na edição do anúncio, cada ambiente recebe nome, descrição e fotos, com escolha da imagem de capa (RF14).",
    caption: "Edição de ambientes e fotos do espaço",
  }),
  figureBlock({
    token: "T11",
    file: base1 + "/20-calendario-reservas.png",
    text: "O calendário do locador reúne, por dia, as reservas recebidas nos espaços (RF21). A captura mostra a agenda; não registra aprovação nem recusa de um pedido.",
    caption: "Calendário de reservas recebidas pelo locador",
  }),
].join("");

const beforeLimits = [
  lead(
    "O painel administrativo acrescenta a visão geral, a fila de documentos, os espaços já aprovados e o catálogo de características."
  ),
  figureBlock({
    token: "T12",
    file: base2 + "/21-admin-visao-geral.png",
    text: "A visão geral do administrador resume a quantidade de contas no período. Os números são de demonstração.",
    caption: "Painel administrativo com a visão geral das contas",
  }),
  figureBlock({
    token: "T13",
    file: base2 + "/22-admin-documentos.png",
    text: "A fila de documentos lista os arquivos enviados e a situação da análise (RF29). A captura não registra um clique de aprovar ou rejeitar.",
    caption: "Fila de documentos na área administrativa",
  }),
  figureBlock({
    token: "T14",
    file: base2 + "/27-admin-espacos-aprovados.png",
    text: "A lista de espaços aprovados mostra anúncios já liberados, com valor e capacidade. O botão Recusar aparece na interface e não foi acionado.",
    caption: "Espaços aprovados na área administrativa",
  }),
  figureBlock({
    token: "T15",
    file: base2 + "/29-admin-caracteristicas.png",
    text: "O catálogo de características reúne itens que o locador pode marcar no anúncio, como piscina e churrasqueira.",
    caption: "Catálogo de características dos anúncios",
  }),
].join("");

function insertBefore(xml, heading, block) {
  const i = xml.indexOf(heading);
  if (i < 0) throw new Error("heading missing: " + heading);
  if (xml.indexOf(heading, i + heading.length) !== -1) {
    throw new Error("heading not unique: " + heading);
  }
  const start = paraStartAt(xml, i);
  return xml.slice(0, start) + block + xml.slice(start);
}

xml = insertBefore(xml, "5.6.4 Área do locador", beforeLocador);
xml = insertBefore(xml, "5.6.5 Recursos administrativos e interface responsiva", beforeAdmin);
xml = insertBefore(xml, "5.6.6 Limites da validação", beforeLimits);

const replacements = [
  [
    "A página inicial permite que o visitante conheça os espaços anunciados sem precisar entrar em uma conta. A tela reúne imagens dos anúncios e opções de navegação para iniciar a busca (Figura 12).",
    "A página inicial permite que o visitante conheça os espaços anunciados sem entrar em uma conta. A primeira faixa, “Espaços mais bem avaliados”, reúne quatro anúncios com foto, nome, nota, quantidade de avaliações, local e preço, e oferece o atalho “Ver mais” (RF7). Abaixo, “Espaços para o seu evento” lista outros anúncios. A captura mostra a interface dessa seção; ela não prova, sozinha, a regra de ordenação pela nota média nem o desempate pela quantidade de avaliações (Figura 12).",
  ],
  [
    "Figura 12 – Página inicial do LocaFesta na visão do visitante",
    "Figura 12 – Página inicial do LocaFesta, com os espaços mais bem avaliados",
  ],
  [
    "A apresentação segue o percurso dos usuários: acesso à plataforma, busca e consulta de espaços, área do locador e recursos administrativos.",
    "A apresentação segue o percurso dos usuários: página inicial e busca, área do locatário, pagamento, área do locador e administração.",
  ],
  [
    "5.6.1 Acesso, página inicial e busca",
    "5.6.1 Apresentação e busca",
  ],
  [
    "5.6.3 Cadastro e acesso à conta",
    "5.6.3 Área do locatário",
  ],
  [
    "5.6.5 Recursos administrativos e interface responsiva",
    "5.6.5 Administração",
  ],
  [
    "A tentativa de abertura do checkout não resultou em uma confirmação de pagamento; portanto, a captura dessa tentativa não foi incluída como evidência de pagamento concluído.",
    "As figuras de finalizar pagamento e de checkout, nesta seção, mostram a tela de pagamento e a escolha da forma. Elas não registram um pagamento concluído, e a tentativa não alterou o status da reserva para pago.",
  ],
];

for (const [from, to] of replacements) {
  mustOnce(xml, from);
  xml = xml.replace(from, to);
}

const sliceStart = xml.indexOf("5.6.1 Apresentação e busca");
const sliceEnd = xml.indexOf("6 CONSIDERAÇÕES FINAIS", sliceStart);
if (sliceStart < 0 || sliceEnd < 0) throw new Error("body slice not found");
let slice = xml.slice(sliceStart, sliceEnd);

const capRe = /Figura (T\d+|\d+) –/g;
const labels = [];
let cm;
while ((cm = capRe.exec(slice))) labels.push(cm[1]);
if (labels[0] !== "12") throw new Error("first screen caption is " + labels[0]);
if (labels.length !== 19 + 15) {
  throw new Error("expected 34 screen captions, got " + labels.length + " " + labels.join(","));
}

const map = {};
labels.forEach((label, i) => {
  map[label] = String(12 + i);
});

slice = slice.replace(/Figuras\s+(\d+)\s+e\s+(\d+)/g, (m, a, b) => {
  if (!map[a] || !map[b]) throw new Error("unmapped pair " + m);
  return `Figuras ${map[a]} e ${map[b]}`;
});
slice = slice.replace(/Figura\s+(T\d+|\d+)/g, (m, label) => {
  if (!map[label]) return m;
  return `Figura ${map[label]}`;
});

if (/Figura T\d+/.test(slice)) throw new Error("token left in section 5.6");

const bodyCaps = [...slice.matchAll(/Figura (\d+) – [^<]*/g)].map((m) => m[0]);
const nums = bodyCaps.map((c) => Number(c.match(/\d+/)[0]));
for (let i = 0; i < nums.length; i++) {
  if (nums[i] !== 12 + i) throw new Error("caption sequence broken at " + nums[i]);
}

xml = xml.slice(0, sliceStart) + slice + xml.slice(sliceEnd);

const evidence = [
  "A correspondência abaixo liga os requisitos funcionais às figuras desta seção. Ela registra evidência visual da interface. Não afirma que cada requisito tenha sido executado por completo.",
  `RF1: Figura ${map["19"]}, formulário de cadastro. RF3: Figura ${map["18"]}, tela de login. RF5: Figuras ${map["12"]}, ${map["13"]} e ${map["15"]}, página inicial, filtros e busca sem resultado. RF6: Figura ${map["14"]}, resultados no mapa.`,
  `RF7: Figura ${map["12"]}, parcial. A tela mostra a seção “Espaços mais bem avaliados”, com quatro anúncios, nota, quantidade de avaliações, local, preço e o atalho “Ver mais”. A imagem não demonstra a regra de ordenação pela nota média nem o desempate pela quantidade de avaliações.`,
  `RF9 e RF10: Figura ${map["T01"]}. Os dados pessoais aparecem preenchidos; o envio do documento de identidade não. RF11 e RF12: Figura ${map["26"]}, documentação do espaço. RF14: Figuras ${map["23"]}, ${map["T09"]} e ${map["T10"]}, lista de anúncios, primeira etapa do cadastro e edição de ambientes e fotos.`,
  `RF17: Figura ${map["T05"]}, data já reservada marcada como indisponível. RF18: Figura ${map["16"]}, página do anúncio. RF19: Figuras ${map["17"]} e ${map["T06"]}, simulação de preço e diálogo de confirmação, sem envio do pedido. RF20: Figuras ${map["T07"]} e ${map["T08"]}, finalizar pagamento e checkout de testes, sem pagamento concluído.`,
  `RF21: Figuras ${map["22"]} e ${map["T11"]}. Os controles de aprovar ou recusar e o calendário aparecem; as ações não foram confirmadas. RF22: Figura ${map["T02"]}, reservas do locatário. RF23: Figura ${map["T03"]}. A mensagem de reembolso parcial de 50% está na tela; o cancelamento não foi confirmado. RF28: Figuras ${map["21"]}, ${map["24"]} e ${map["25"]}, painel e financeiro do locador, com valores de demonstração.`,
  `RF29: Figura ${map["T13"]}, fila de documentos, sem clique de aprovar ou rejeitar. RF30: Figura ${map["T04"]}, tela de favoritos vazia, sem um espaço salvo. RF31: Figuras ${map["20"]}, ${map["27"]} e ${map["28"]}, aceite, histórico e edição dos termos. A edição não comprova a publicação de uma nova versão.`,
  "Nesta seleção, 21 dos 31 requisitos têm ao menos uma captura relacionada: RF1, RF3, RF5, RF6, RF7, RF9, RF10, RF11, RF12, RF14, RF17, RF18, RF19, RF20, RF21, RF22, RF23, RF28, RF29, RF30 e RF31.",
  "Sem captura relacionada nesta seção: RF2, RF4, RF8, RF13, RF15, RF16, RF24, RF25, RF26 e RF27. A falta da imagem não significa que o requisito esteja ausente no sistema.",
]
  .map((t) => textPara(bodyTpl, t))
  .join("");

const limitsAt = xml.indexOf("5.6.6 Limites da validação");
const limitsParaEnd = xml.indexOf("</w:p>", limitsAt) + 6;
xml = xml.slice(0, limitsParaEnd) + evidence + xml.slice(limitsParaEnd);

const listaStartPara = paraContaining(xml, "Figura 12 – Tela Meus espaços do locador");
const listaEndPara = paraContaining(
  xml,
  "Figura 18 – Tela de aceite da versão vigente dos Termos de Uso"
);
if (listaEndPara.start < listaStartPara.start) throw new Error("lista range inverted");
if (listaStartPara.start > sliceStart) throw new Error("lista marker fell into the body");

function listaItem(caption) {
  let p = stripParaId(listaTpl);
  let n = 0;
  p = p.replace(/<w:t[^>]*>[^<]*<\/w:t>/g, (m) => {
    n++;
    if (n === 1) return `<w:t xml:space="preserve">${esc(caption)}</w:t>`;
    if (n === 2) return `<w:t xml:space="preserve">—</w:t>`;
    return m;
  });
  if (n < 2) throw new Error("lista template missing caption or page");
  return p;
}

const freshCaps = [...xml.slice(xml.indexOf("5.6.1 Apresentação e busca")).matchAll(/<w:t[^>]*>(Figura \d+ – [^<]*)<\/w:t>/g)].map((m) => m[1]);
if (freshCaps.length !== 34) throw new Error("fresh caption count " + freshCaps.length);
const listaXml = freshCaps.map(listaItem).join("");
xml = xml.slice(0, listaStartPara.start) + listaXml + xml.slice(listaEndPara.end);

for (const item of media) {
  rels = rels.replace(
    "</Relationships>",
    `<Relationship Id="${item.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${item.name}"/></Relationships>`
  );
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "document.xml"), xml, "utf8");
fs.writeFileSync(path.join(OUT_DIR, "document.xml.rels"), rels, "utf8");
fs.writeFileSync(
  path.join(OUT_DIR, "media.json"),
  JSON.stringify(
    media.map((m) => ({ rId: m.rId, name: m.name, file: m.file, w: m.w, h: m.h, cy: m.cy })),
    null,
    2
  )
);

const home = pngSize("C:/Users/Andrea/Desktop/TG/_home_fig/home-atual-1280x900.png");
if (home.w !== 1280 || home.h !== 900) throw new Error("home png size " + home.w + "x" + home.h);

console.log("captions", freshCaps.length);
console.log(freshCaps.join("\n"));
console.log("media", media.length, "docPr", docPrStart, "to", docPr - 1);
console.log("OK build xml");
