const fs = require("fs");
const xml = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/document.xml", "utf8");
const all = [...xml.matchAll(/<w:t[^>]*>(Figura \d+ – [^<]*)<\/w:t>/g)].map((m) => m[1]);
console.log("total caption nodes", all.length);
const screens = all.filter((c) => /^Figura (1[2-9]|[2-9]\d) /.test(c) || /^Figura [1-9]\d\d /.test(c));
console.log("screen-like", screens.length);
console.log("--- first 20 ---");
console.log(all.slice(0, 20).join("\n"));
console.log("--- around 45 ---");
console.log(all.slice(40, 60).join("\n"));
const body = all.filter((c, i) => i > 40);
console.log("lista12", all[11]);
console.log("lista45", all[44]);
console.log("after lista", all[45]);
console.log("body12", all[11 + 34 + 11]);
console.log("body45", all[11 + 34 + 11 + 33]);
let mismatch = 0;
for (let i = 0; i < 34; i++) {
  const lista = all[11 + i];
  const bodyCap = all[11 + 34 + 11 + i];
  if (lista !== bodyCap) {
    mismatch++;
    console.log("MIS", i + 12, lista, "||", bodyCap);
  }
}
console.log("mismatches", mismatch);

const homeDraw = xml.indexOf('r:embed="rId27"');
const homeChunk = xml.slice(homeDraw - 800, homeDraw + 200);
const cy = [...homeChunk.matchAll(/cy="(\d+)"/g)].map((m) => m[1]);
console.log("home cy", cy.join(","));
