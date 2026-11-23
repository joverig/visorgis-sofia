# Genera EN CASCADA la narracion de todas las fichas de las apps con la voz elegida.
#   Voz:    voz\config.json  { "voz": "es-ES-...Neural", "estilo": "", "rate": "-10%", "pitch": "-6%" }
#   Textos: voz\textos\*.json  ([{ "app": "viajando", "id": "nevski", "texto": "..." }, ...])
#   Salida: www\<app>\audio\<id>.mp3  y  www\<app>\audio\manifest.json (lista de ids con audio)
# Solo regenera los textos nuevos o cambiados (o todos si cambias de voz).
. (Join-Path $PSScriptRoot 'voz_comun.ps1')
$raiz = $PSScriptRoot
$cfg = Leer-Azure $raiz
$voz = [System.IO.File]::ReadAllText((Join-Path $raiz 'voz\config.json'), $utf8) | ConvertFrom-Json
if (-not $voz.voz) { Write-Host 'Elige la voz en voz\config.json' -ForegroundColor Red; exit 1 }
$fHechos = Join-Path $raiz 'voz\generados.json'
$hechos = @{}
if (Test-Path $fHechos) { ([System.IO.File]::ReadAllText($fHechos, $utf8) | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $hechos[$_.Name] = $_.Value } }
$sha = [System.Security.Cryptography.SHA1]::Create()
function Huella([string]$t) { return [BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($t))).Replace('-', '').Substring(0, 16) }

$items = @()
foreach ($f in Get-ChildItem (Join-Path $raiz 'voz\textos') -Filter *.json) {
    $lista = ConvertFrom-Json ([System.IO.File]::ReadAllText($f.FullName, $utf8))
    foreach ($x in $lista) { $items += $x }   # en PowerShell 5.1 el array JSON llega como un unico objeto
}
Write-Host "Textos: $($items.Count) - voz $($voz.voz) $($voz.estilo) $($voz.rate) $($voz.pitch)"
$n = 0; $err = 0
foreach ($it in $items) {
    $dirApp = Join-Path $raiz "www\$($it.app)\audio"
    New-Item -ItemType Directory -Force -Path $dirApp | Out-Null
    $dest = Join-Path $dirApp "$($it.id).mp3"
    $clave = "$($it.app)/$($it.id)"
    # «Viajando por Sofía» pasó a llamarse «Explora Sofía»: se aprovechan los audios ya generados
    if (-not $hechos[$clave] -and $it.app -eq 'explora' -and $hechos["viajando/$($it.id)"]) { $hechos[$clave] = $hechos["viajando/$($it.id)"] }
    $h = Huella ($voz.voz + '|' + $voz.estilo + '|' + $voz.rate + '|' + $voz.pitch + '|' + $it.texto)
    if ((Test-Path $dest) -and $hechos[$clave] -eq $h) { continue }
    $ok = $false
    for ($intento = 1; $intento -le 4 -and -not $ok; $intento++) {
        try {
            Sintetizar $cfg (Ssml $voz.voz $it.texto $voz.estilo $voz.rate $voz.pitch) $dest
            $hechos[$clave] = $h; $n++; $ok = $true
            Write-Host "  OK $clave"
        } catch {
            $msg = $_.Exception.Message
            if ($msg -match '429' -and $intento -lt 4) { Write-Host "  (limite de la capa gratuita, espero 30 s)" -ForegroundColor Yellow; Start-Sleep -Seconds 30 }
            else { $err++; Write-Host "  ERROR $clave : $msg" -ForegroundColor Red; break }
        }
    }
    Start-Sleep -Milliseconds 3500   # la capa gratuita admite unas 20 peticiones por minuto
}
# manifest.json de cada app: ids que tienen audio
$items | Group-Object app | ForEach-Object {
    $dirApp = Join-Path $raiz "www\$($_.Name)\audio"
    $ids = @($_.Group | Where-Object { Test-Path (Join-Path $dirApp "$($_.id).mp3") } | ForEach-Object { $_.id })
    [System.IO.File]::WriteAllText((Join-Path $dirApp 'manifest.json'), (ConvertTo-Json -InputObject $ids -Compress), $utf8)
}
[System.IO.File]::WriteAllText($fHechos, ($hechos | ConvertTo-Json), $utf8)
Write-Host "`nListo: $n audios nuevos, $err errores. Avisa a Claude para publicarlos." -ForegroundColor Green
