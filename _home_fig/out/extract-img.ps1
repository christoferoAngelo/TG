
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:/Users/Andrea/Downloads/Monografia_LocaFesta_ABNT_home_rf7.docx')
$e = $zip.GetEntry('word/media/image20.png')
$fs = [IO.File]::Create('C:/Users/Andrea/Desktop/TG/_home_fig/out/image20-check.png')
$es = $e.Open(); $es.CopyTo($fs); $es.Close(); $fs.Close(); $zip.Dispose()
