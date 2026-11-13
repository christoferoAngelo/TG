$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = 'C:\Users\Andrea\Downloads\Monografia_LocaFesta_atualizada_com_telas.docx'
$bak = 'C:\Users\Andrea\Downloads\Monografia_LocaFesta_atualizada_com_telas_BACKUP.docx'
$dest = 'C:\Users\Andrea\Downloads\Monografia_LocaFesta_ABNT_home_rf7.docx'
$out = 'C:\Users\Andrea\Desktop\TG\_home_fig\out'
$homePng = 'C:\Users\Andrea\Desktop\TG\_home_fig\home-atual-1280x900.png'

if (-not (Test-Path -LiteralPath $bak)) {
  Copy-Item -LiteralPath $src -Destination $bak
}
if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Force }

$replace = @{
  'word/document.xml' = (Join-Path $out 'document.xml')
  'word/_rels/document.xml.rels' = (Join-Path $out 'document.xml.rels')
  'word/media/image20.png' = $homePng
}
$media = Get-Content -LiteralPath (Join-Path $out 'media.json') -Raw | ConvertFrom-Json

$srcZip = [System.IO.Compression.ZipFile]::OpenRead($src)
$dstZip = [System.IO.Compression.ZipFile]::Open($dest, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($entry in $srcZip.Entries) {
    if ($entry.FullName.EndsWith('/')) { continue }
    $created = $dstZip.CreateEntry($entry.FullName, [System.IO.Compression.CompressionLevel]::Optimal)
    $outStream = $created.Open()
    try {
      if ($replace.ContainsKey($entry.FullName)) {
        $inStream = [System.IO.File]::OpenRead($replace[$entry.FullName])
        try { $inStream.CopyTo($outStream) } finally { $inStream.Close() }
      } else {
        $inStream = $entry.Open()
        try { $inStream.CopyTo($outStream) } finally { $inStream.Close() }
      }
    } finally { $outStream.Close() }
  }
  foreach ($item in $media) {
    $created = $dstZip.CreateEntry('word/media/' + $item.name, [System.IO.Compression.CompressionLevel]::Optimal)
    $outStream = $created.Open()
    $inStream = [System.IO.File]::OpenRead($item.file)
    try { $inStream.CopyTo($outStream) } finally { $outStream.Close(); $inStream.Close() }
  }
} finally {
  $dstZip.Dispose()
  $srcZip.Dispose()
}

$origHash = (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash
$bakHash = (Get-FileHash -LiteralPath $bak -Algorithm SHA256).Hash
if ($origHash -ne $bakHash) { throw 'backup does not match the original' }
Write-Output ("packed " + (Get-Item -LiteralPath $dest).Length)
Write-Output 'original hash matches backup'
