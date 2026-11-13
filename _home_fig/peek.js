const fs = require("fs");
const xml = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/document.xml", "utf8");
function around(needle, span) {
  const i = xml.indexOf(needle);
  console.log("\n==== " + needle + " @ " + i);
  if (i < 0) return;
  const slice = xml.slice(i, i + span);
  const texts = [...slice.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  console.log(texts.join(" | "));
}
around("5.6.6 Limites da validação", 8000);
around("Esta seção apresenta as principais telas", 2500);
around("Espaços em destaque", 1500);
const rels = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/document.xml.rels", "utf8");
const ids = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
console.log("max rId", Math.max(...ids));
console.log(rels.slice(-400));
const docPr = [...xml.matchAll(/<wp:docPr id="(\d+)"/g)].map((m) => Number(m[1]));
console.log("max docPr", Math.max(...docPr), "count", docPr.length);
