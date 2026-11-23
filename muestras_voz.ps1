# Genera muestras MP3 con las voces neuronales de Azure en espanol de Espana para elegir narrador.
# Resultado: voz\muestras\*.mp3 y voz\muestras\muestras.html (abrir con doble clic para escucharlas).
. (Join-Path $PSScriptRoot 'voz_comun.ps1')
$raiz = $PSScriptRoot
$cfg = Leer-Azure $raiz
$dir = Join-Path $raiz 'voz\muestras'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$texto = [System.IO.File]::ReadAllText((Join-Path $raiz 'voz\texto_muestra.txt'), $utf8).Trim()

Write-Host 'Voces de Azure en espanol de Espana...'
$voces = @(Voces $cfg | Where-Object { $_.Locale -eq 'es-ES' } | Sort-Object { if ($_.ShortName -match ':') { 0 } else { 1 } }, Gender, ShortName)
Write-Host "  $($voces.Count) voces"
$filas = @()
foreach ($v in $voces) {
    $variantes = @(@{ suf = 'natural'; estilo = ''; rate = '0%'; pitch = '0%'; desc = 'Natural' },
                   @{ suf = 'historiador'; estilo = ''; rate = '-10%'; pitch = '-6%'; desc = 'Historiador (pausado y algo grave)' })
    $estilos = @($v.StyleList)
    foreach ($e in @('narration-professional', 'documentary-narration', 'narration-relaxed')) {
        if ($estilos -contains $e) { $variantes += @{ suf = $e; estilo = $e; rate = '-6%'; pitch = '-4%'; desc = "Estilo $e" } }
    }
    foreach ($va in $variantes) {
        $nombre = "$($v.ShortName -replace '[:\\/*?"<>|]', '-')_$($va.suf).mp3"   # ':' no vale en nombres de fichero de Windows
        $dest = Join-Path $dir $nombre
        try {
            Sintetizar $cfg (Ssml $v.ShortName $texto $va.estilo $va.rate $va.pitch) $dest
            $filas += "<tr><td><b>$($v.DisplayName)</b> <small>$($v.ShortName) &middot; $($v.Gender) &middot; $($v.VoiceType)</small></td><td>$($va.desc)</td><td><audio controls preload='none' src='$nombre'></audio></td></tr>"
            Write-Host "  OK $nombre"
        } catch { Write-Host "  ERROR $nombre : $($_.Exception.Message)" -ForegroundColor Red }
    }
}
$html = "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><title>Muestras de voz Azure</title>" +
        "<style>body{font-family:Segoe UI,sans-serif;background:#f6f1e7;color:#22262c;padding:20px}td{padding:6px 10px;border-bottom:1px solid #ddd3c2}small{color:#6b6458}</style></head><body>" +
        "<h1>Muestras de voz (Azure)</h1><p>$([System.Security.SecurityElement]::Escape($texto))</p><table>" + ($filas -join '') + "</table></body></html>"
[System.IO.File]::WriteAllText((Join-Path $dir 'muestras.html'), $html, $utf8)
Write-Host "`nListo. Abre voz\muestras\muestras.html para escucharlas." -ForegroundColor Green
Start-Process (Join-Path $dir 'muestras.html')
