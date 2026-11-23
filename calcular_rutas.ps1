# Calcula rutas a pie reales entre los puntos de interes de "Viajando por Sofia" y descarga de
# OpenStreetMap lo que hay alrededor (monumentos, estatuas, iglesias, fuentes...).
# Lo lanza 2_Calcular_rutas.bat. Solo DESCARGA datos en bruto a datos_rutas\; la seleccion de
# rutas sin cruces y los textos "por el camino" se preparan despues.
#   Rutas:   servidor publico OSRM de FOSSGIS (perfil a pie), routing.openstreetmap.de
#   Entorno: Overpass API (OpenStreetMap)
# Se puede relanzar: las rutas ya descargadas no se vuelven a pedir.

$ErrorActionPreference = 'Stop'
# TLS 1.2 y, si este Windows lo conoce, TLS 1.3 (12288)
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]12288 }
catch { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 }
$raiz = $PSScriptRoot
$salida = Join-Path $raiz 'datos_rutas'
$dirRutas = Join-Path $salida 'osrm'
New-Item -ItemType Directory -Force -Path $dirRutas | Out-Null
$utf8 = New-Object System.Text.UTF8Encoding($false)
$ua = 'visorgis-sofia/1.0 (github.com/joverig/visorgis-sofia)'

# El servidor de rutas solo acepta cifrados TLS modernos que el HTTPS de Windows (.NET y el
# curl.exe del sistema, ambos con "schannel") no siempre ofrece. Si falla, se prueban en orden:
#   1. curl de Git para Windows forzando OpenSSL   2. PHP portable de ..\VisorGIS (OpenSSL)
#   3. Python (OpenSSL)   4. curl.exe del sistema
# y se sigue con el primero que funcione.
$script:metodo = $null
$curlSistema = Join-Path $env:SystemRoot 'System32\curl.exe'
$curlGit = @("$env:ProgramFiles\Git\mingw64\bin\curl.exe", "${env:ProgramFiles(x86)}\Git\mingw64\bin\curl.exe",
             "$env:LOCALAPPDATA\Programs\Git\mingw64\bin\curl.exe") | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
$caGit = if ($curlGit) { @('mingw64\etc\ssl\certs\ca-bundle.crt', 'mingw64\ssl\certs\ca-bundle.crt') | ForEach-Object { Join-Path (Split-Path (Split-Path (Split-Path $curlGit))) $_ } | Where-Object { Test-Path $_ } | Select-Object -First 1 }
$php = Join-Path $raiz '..\VisorGIS\php\php.exe'
$phpDescarga = Join-Path $env:TEMP 'visorgis_sofia_descarga.php'
[System.IO.File]::WriteAllText($phpDescarga, @'
<?php
[$s, $url, $salida, $ua] = $argv; $cuerpo = $argv[4] ?? '';
$http = ['header' => "User-Agent: $ua\r\n", 'timeout' => 180, 'ignore_errors' => false];
if ($cuerpo !== '') { $http['method'] = 'POST'; $http['header'] .= "Content-Type: application/x-www-form-urlencoded\r\n"; $http['content'] = file_get_contents($cuerpo); }
$r = @file_get_contents($url, false, stream_context_create(['http' => $http]));
if ($r === false) { $e = error_get_last(); fwrite(STDERR, $e ? $e['message'] : 'fallo'); exit(1); }
file_put_contents($salida, $r);
'@, $utf8)
$python = Get-Command python, py -ErrorAction SilentlyContinue | Where-Object { $_.Source -notmatch 'WindowsApps' } | Select-Object -First 1
$pyDescarga = Join-Path $env:TEMP 'visorgis_sofia_descarga.py'
[System.IO.File]::WriteAllText($pyDescarga, @'
import sys, urllib.request
url, salida, ua, cuerpo = sys.argv[1], sys.argv[2], sys.argv[3], (sys.argv[4] if len(sys.argv) > 4 else '')
datos = open(cuerpo, 'rb').read() if cuerpo else None
req = urllib.request.Request(url, data=datos, headers={'User-Agent': ua})
if datos: req.add_header('Content-Type', 'application/x-www-form-urlencoded')
with urllib.request.urlopen(req, timeout=180) as r:
    open(salida, 'wb').write(r.read())
'@, $utf8)

function PedirExterno([string]$metodo, [string]$url, [string]$cuerpo) {
    $tmp = [System.IO.Path]::GetTempFileName()
    $tmpErr = [System.IO.Path]::GetTempFileName()
    $tmpCuerpo = $null
    # Los mensajes van a fichero: en Windows PowerShell 5.1 cualquier linea por stderr de un
    # programa externo se convierte en error y corta el script.
    $prefAnterior = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($cuerpo) { $tmpCuerpo = [System.IO.Path]::GetTempFileName(); [System.IO.File]::WriteAllText($tmpCuerpo, $cuerpo, $utf8) }
        if ($metodo -eq 'php') {
            if (-not (Test-Path $php)) { throw "No hay PHP en $php" }
            $pa = @('-d', ('extension_dir=' + (Join-Path (Split-Path $php) 'ext')), '-d', 'extension=openssl')
            if ($caGit) { $pa += @('-d', "openssl.cafile=$caGit") }
            $pa += @($phpDescarga, $url, $tmp, $ua); if ($tmpCuerpo) { $pa += $tmpCuerpo }
            & $php @pa 2> $tmpErr | Out-Null
        } elseif ($metodo -eq 'python') {
            if (-not $python) { throw 'Python no instalado' }
            $pa = @($pyDescarga, $url, $tmp, $ua); if ($tmpCuerpo) { $pa += $tmpCuerpo }
            & $python.Source @pa 2> $tmpErr | Out-Null
        } else {
            $exe = if ($metodo -eq 'curlgit') { $curlGit } else { $curlSistema }
            if (-not $exe -or -not (Test-Path $exe)) { throw "No disponible: $metodo" }
            $pa = @('-s', '-S', '-f', '-L', '--max-time', '180', '-A', $ua, '-o', $tmp, '--stderr', $tmpErr)
            if ($metodo -eq 'curlsistema') { $pa = @('--ssl-no-revoke') + $pa }
            if ($metodo -eq 'curlgit') { $env:CURL_SSL_BACKEND = 'openssl'; if ($caGit) { $pa = @('--cacert', $caGit) + $pa } }
            else { Remove-Item Env:\CURL_SSL_BACKEND -ErrorAction SilentlyContinue }
            if ($tmpCuerpo) { $pa += @('-H', 'Content-Type: application/x-www-form-urlencoded', '--data-binary', "@$tmpCuerpo") }
            & $exe @pa $url | Out-Null
        }
        if ($LASTEXITCODE -ne 0) {
            $msg = ([System.IO.File]::ReadAllText($tmpErr)).Trim()
            if ($msg.Length -gt 300) { $msg = $msg.Substring($msg.Length - 300) }
            throw "$metodo codigo ${LASTEXITCODE}: $msg"
        }
        return [System.IO.File]::ReadAllText($tmp, $utf8)
    } finally {
        $ErrorActionPreference = $prefAnterior
        Remove-Item $tmp, $tmpErr -ErrorAction SilentlyContinue
        if ($tmpCuerpo) { Remove-Item $tmpCuerpo -ErrorAction SilentlyContinue }
    }
}
function PedirAlternativo([string]$url, [string]$cuerpo) {
    if ($script:metodo) { return PedirExterno $script:metodo $url $cuerpo }
    $fallos = @()
    foreach ($m in @('curlgit', 'php', 'python', 'curlsistema')) {
        try {
            $r = PedirExterno $m $url $cuerpo
            $script:metodo = $m
            Write-Host "  (descargando con $m)" -ForegroundColor Yellow
            return $r
        } catch { $fallos += "$m -> $($_.Exception.Message)" }
    }
    Write-Host ("Ningun metodo HTTPS funciona con $url en este PC:`r`n    " + ($fallos -join "`r`n    ")) -ForegroundColor Red
    Write-Host 'Copia estas lineas y pasaselas a Claude.'
    exit 1
}
function Pedir([string]$url, [string]$cuerpo) {
    if ($script:metodo) { return PedirExterno $script:metodo $url $cuerpo }
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add('User-Agent', $ua)
    $wc.Encoding = $utf8
    $wc.Proxy = [System.Net.WebRequest]::GetSystemWebProxy()
    $wc.Proxy.Credentials = [System.Net.CredentialCache]::DefaultCredentials
    try {
        if ($cuerpo) { $wc.Headers.Add('Content-Type', 'application/x-www-form-urlencoded'); return $wc.UploadString($url, $cuerpo) }
        return $wc.DownloadString($url)
    } catch [System.Net.WebException] {
        if ($_.Exception.Status -eq [System.Net.WebExceptionStatus]::SecureChannelFailure -or $_.Exception.Status -eq [System.Net.WebExceptionStatus]::TrustFailure) {
            return PedirAlternativo $url $cuerpo
        }
        throw
    } finally { $wc.Dispose() }
}
function Dist($a, $b) {   # metros (haversine)
    $r = 6371000.0; $f1 = $a.lat * [math]::PI / 180; $f2 = $b.lat * [math]::PI / 180
    $df = ($b.lat - $a.lat) * [math]::PI / 180; $dl = ($b.lon - $a.lon) * [math]::PI / 180
    $h = [math]::Sin($df / 2) * [math]::Sin($df / 2) + [math]::Cos($f1) * [math]::Cos($f2) * [math]::Sin($dl / 2) * [math]::Sin($dl / 2)
    return 2 * $r * [math]::Asin([math]::Sqrt($h))
}

$gj = [System.IO.File]::ReadAllText((Join-Path $raiz 'www\viajando\datos\puntos.geojson'), $utf8) | ConvertFrom-Json
$pts = @($gj.features | ForEach-Object { [pscustomobject]@{ id = $_.properties.id; nombre = $_.properties.nombre; lon = [double]$_.geometry.coordinates[0]; lat = [double]$_.geometry.coordinates[1] } })
Write-Host "Puntos de interes: $($pts.Count)"

# Pares candidatos: los 7 vecinos mas cercanos a menos de 3 km; si no hay ninguno, los 2 mas cercanos
$pares = @{}
foreach ($a in $pts) {
    $vec = @($pts | Where-Object { $_.id -ne $a.id } | ForEach-Object { [pscustomobject]@{ p = $_; d = (Dist $a $_) } } | Sort-Object d)
    $elegidos = @($vec | Where-Object { $_.d -le 3000 } | Select-Object -First 7)
    if ($elegidos.Count -eq 0) { $elegidos = @($vec | Select-Object -First 2) }
    foreach ($v in $elegidos) {
        $k = @($a.id, $v.p.id) | Sort-Object
        $pares[($k -join '__')] = @($a, $v.p)
    }
}
Write-Host "Pares candidatos: $($pares.Count) (unos segundos por ruta, no cierres la ventana)"

$i = 0; $nuevas = 0; $errores = 0
foreach ($k in ($pares.Keys | Sort-Object)) {
    $i++
    $fich = Join-Path $dirRutas "$k.json"
    if (Test-Path $fich) { continue }
    $a = $pares[$k][0]; $b = $pares[$k][1]
    $coords = [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0:F6},{1:F6};{2:F6},{3:F6}', $a.lon, $a.lat, $b.lon, $b.lat)
    $url = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/$coords`?overview=full&geometries=geojson&steps=false"
    try {
        $json = Pedir $url $null
        [System.IO.File]::WriteAllText($fich, $json, $utf8)
        $nuevas++
        Write-Host ("  [{0}/{1}] {2} -> {3}" -f $i, $pares.Count, $a.nombre, $b.nombre)
    } catch { $errores++; Write-Host ("  [{0}/{1}] ERROR {2}: {3}" -f $i, $pares.Count, $k, $_.Exception.Message) -ForegroundColor Red }
    Start-Sleep -Milliseconds 1100   # uso respetuoso del servidor publico
}
Write-Host "Rutas nuevas: $nuevas, errores: $errores"

# Entorno de OpenStreetMap: elementos con nombre interesantes en la zona de los puntos
$minLat = ($pts | Measure-Object lat -Minimum).Minimum - 0.005; $maxLat = ($pts | Measure-Object lat -Maximum).Maximum + 0.005
$minLon = ($pts | Measure-Object lon -Minimum).Minimum - 0.005; $maxLon = ($pts | Measure-Object lon -Maximum).Maximum + 0.005
$bbox = [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0:F5},{1:F5},{2:F5},{3:F5}', $minLat, $minLon, $maxLat, $maxLon)
$q = "[out:json][timeout:90];(" +
     "nwr[historic][name]($bbox);" +
     "nwr[tourism~""^(artwork|attraction|museum|viewpoint|gallery)$""][name]($bbox);" +
     "nwr[amenity~""^(fountain|place_of_worship|theatre|drinking_water)$""][name]($bbox);" +
     "nwr[memorial][name]($bbox);" +
     "nwr[leisure=park][name]($bbox);" +
     ");out center tags;"
Write-Host 'OpenStreetMap: elementos alrededor de las rutas...'
try {
    $osm = Pedir 'https://overpass-api.de/api/interpreter' ('data=' + [uri]::EscapeDataString($q))
    [System.IO.File]::WriteAllText((Join-Path $salida 'osm_entorno.json'), $osm, $utf8)
    Write-Host '  OK osm_entorno.json'
} catch { Write-Host "  ERROR Overpass: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`nListo. Datos en datos_rutas\  (avisa a Claude para preparar las rutas)" -ForegroundColor Green
