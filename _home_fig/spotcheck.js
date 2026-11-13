const fs = require("fs");
const xml = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/document.xml", "utf8");
const texts = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
const want = [
  "Depois de acessar a área do locador",
  "As capturas mostram a consulta mensal",
  "A Figura 41 mostra",
  "A plataforma disponibiliza telas de entrada",
  "Nesta seleção, 21 dos 31",
  "Sem captura relacionada",
  "5.6.1 Apresentação e busca",
  "5.6.3 Área do locatário",
  "5.6.5 Administração",
];
for (const w of want) {
  const hit = texts.find((t) => t.includes(w));
  console.log("\n>>", w);
  console.log(hit || "MISSING");
}
const rels = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/document.xml.rels", "utf8");
const ids = [...rels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log("dup rels", dup);
const targets = [...rels.matchAll(/Target="media\/([^"]+)"/g)].map((m) => m[1]);
const dupT = targets.filter((id, i) => targets.indexOf(id) !== i);
console.log("dup targets", dupT);
console.log("image rels", targets.length);
