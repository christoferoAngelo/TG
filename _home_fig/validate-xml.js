const fs = require("fs");
const xml = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/document.xml", "utf8");
const rels = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/document.xml.rels", "utf8");

function textsAround(needle) {
  const i = xml.indexOf(needle);
  const slice = xml.slice(i - 400, i + 200);
  return [...slice.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" | ");
}

const checks = [];
function ok(name, cond) {
  checks.push((cond ? "OK " : "FAIL ") + name);
}

ok("rf7 wording", xml.includes("Exibir, na tela inicial, espaços em destaque."));
ok("rf7 name", xml.includes("Espaços em destaque"));
for (let n = 1; n <= 31; n++) ok("RF" + n, xml.includes("RF" + n));
ok("no token", !/Figura T\d+/.test(xml));
ok("no test test", !xml.includes("Test Test"));
const emails = ["andreamoraes12@gmail.com", "angelu.angelo@gmail.com", "christoferoangelo@gmail.com", "telaskoavara903@gmail.com", "locafesta.suporte@gmail.com", "jeehbeatrizaraujo", "xongx26", "presencify"];
for (const e of emails) ok("no " + e, !xml.toLowerCase().includes(e.toLowerCase()));

const bodyStart = xml.indexOf("5.6.1 Apresentação e busca");
const bodyEnd = xml.indexOf("6 CONSIDERAÇÕES FINAIS", bodyStart);
const body = xml.slice(bodyStart, bodyEnd);
const caps = [...body.matchAll(/<w:t[^>]*>(Figura \d+ – [^<]*)<\/w:t>/g)];
ok("34 captions", caps.length === 34);

let missingImg = 0;
let missingFonte = 0;
for (let i = 0; i < caps.length; i++) {
  const from = caps[i].index;
  const to = i + 1 < caps.length ? caps[i + 1].index : body.length;
  const chunk = body.slice(from, to);
  if (!chunk.includes("<w:drawing>")) missingImg++;
  if (!chunk.includes("Fonte: Elaborada pelos autores (2026).")) missingFonte++;
}
ok("captions have drawing", missingImg === 0);
ok("captions have fonte", missingFonte === 0);
if (missingImg || missingFonte) console.log("missing", missingImg, missingFonte);

const listaStart = xml.indexOf("Figura 12 – Página inicial do LocaFesta, com os espaços mais bem avaliados");
const listaSlice = xml.slice(listaStart, bodyStart);
const listaCaps = [...listaSlice.matchAll(/<w:t[^>]*>(Figura \d+ – [^<]*)<\/w:t>/g)].map((m) => m[1]);
const bodyCaps = caps.map((m) => m[1]);
ok("lista count", listaCaps.length === bodyCaps.length);
let listaMismatch = 0;
for (let i = 0; i < Math.max(listaCaps.length, bodyCaps.length); i++) {
  if (listaCaps[i] !== bodyCaps[i]) listaMismatch++;
}
ok("lista matches body", listaMismatch === 0);
if (listaMismatch) {
  for (let i = 0; i < bodyCaps.length; i++) {
    if (listaCaps[i] !== bodyCaps[i]) console.log("DIFF", i, listaCaps[i], "||", bodyCaps[i]);
  }
}

const embeds = [...body.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
ok("34 embeds in section", embeds.length === 34);
const relIds = new Set([...rels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]));
const dangling = embeds.filter((id) => !relIds.has(id));
ok("embeds resolve", dangling.length === 0);
if (dangling.length) console.log(dangling);

ok("home extent", xml.includes('r:embed="rId27"') && xml.includes('cy="3793331"'));
ok("rId27 image20", /Id="rId27"[^>]*media\/image20\.png/.test(rels));

const early = xml.slice(0, listaStart);
ok("fig 1 still", early.includes("Figura 1 – Diagrama de casos de uso: autenticação e gestão de perfil"));
ok("fig 11 still", early.includes("Figura 11 – Diagrama de atividades do fluxo de reserva"));

console.log(checks.join("\n"));
console.log("--- painel ref ---");
console.log(textsAround("Painel inicial do locador"));
console.log("--- mobile ref ---");
console.log(textsAround("versão móvel"));
console.log("--- rf7 evidence ---");
console.log(textsAround("evidência é parcial") || textsAround("A imagem não demonstra"));
