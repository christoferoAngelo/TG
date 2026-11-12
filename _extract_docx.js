const fs = require("fs");
const xml = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_mono_docx/unzipped/word/document.xml", "utf8");
let t = xml
  .replace(/<w:tab[^>]*\/>/g, "\t")
  .replace(/<w:br[^>]*\/>/g, "\n")
  .replace(/<\/w:p>/g, "\n")
  .replace(/<[^>]+>/g, "");
t = t
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
fs.writeFileSync("C:/Users/Andrea/Desktop/TG/_mono_extract.txt", t);
console.log("lines", t.split(/\n/).length, "chars", t.length);
