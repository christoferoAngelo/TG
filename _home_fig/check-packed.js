const fs = require("fs");
const { execFileSync } = require("child_process");
const dest = "C:/Users/Andrea/Downloads/Monografia_LocaFesta_ABNT_home_rf7.docx";
const tmp = "C:/Users/Andrea/Desktop/TG/_home_fig/out/image20-check.png";
const ps = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${dest}')
$e = $zip.GetEntry('word/media/image20.png')
$fs = [IO.File]::Create('${tmp}')
$es = $e.Open(); $es.CopyTo($fs); $es.Close(); $fs.Close(); $zip.Dispose()
`;
fs.writeFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/extract-img.ps1", ps);
execFileSync("powershell", ["-NoProfile", "-File", "C:/Users/Andrea/Desktop/TG/_home_fig/out/extract-img.ps1"], { stdio: "inherit" });
const buf = fs.readFileSync(tmp);
console.log("png", buf.toString("ascii", 1, 4), buf.readUInt32BE(16), buf.readUInt32BE(20), "bytes", buf.length);
const xmlDoc = fs.readFileSync("C:/Users/Andrea/Desktop/TG/_home_fig/out/document.xml");
console.log("xml starts", xmlDoc.slice(0, 5).toString());
