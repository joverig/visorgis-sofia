# Publica VisorGIS Sofia:
#  1. Sube la version (AAAAMMDDhhmm) en www\version.txt y en los ?v= de los html de www
#  2. Commit y push a main (proyecto completo)
#  3. Rama gh-pages = copia exacta de www (la de ese commit) + .nojekyll; commit y push
# Uso: publicar.bat ["mensaje del commit"]
param([string]$Mensaje = '')

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$ver = "versi$([char]0x00F3)n"
$atribucion = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'

function Ejecutar-Git {
    & git.exe @args
    if ($LASTEXITCODE -ne 0) { throw "Ha fallado: git $($args -join ' ')" }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'No se encuentra git.' }
if (-not (Test-Path '.git')) { throw 'Esta carpeta no es un repositorio git.' }
$rama = (& git.exe rev-parse --abbrev-ref HEAD).Trim()
if ($rama -ne 'main') { throw "Estas en la rama '$rama'; publica desde main." }

Write-Host '== Trayendo cambios de GitHub'
Ejecutar-Git fetch origin
$detras = [int](& git.exe rev-list --count HEAD..origin/main)
if ($detras -gt 0) {
    Write-Host "main en GitHub tiene $detras commit(s) que no tienes; los integro."
    Ejecutar-Git pull --ff-only origin main
}

# 1. Version
$archVersion = Join-Path $PSScriptRoot 'www\version.txt'
$antigua = ([IO.File]::ReadAllText($archVersion)).Trim()
$nueva = Get-Date -Format 'yyyyMMddHHmm'
if ($nueva -eq $antigua) { throw "La $ver $nueva ya esta publicada; espera un minuto." }
Write-Host "== $ver $antigua -> $nueva"
$cambiados = 0
Get-ChildItem -Path (Join-Path $PSScriptRoot 'www') -Recurse -File -Include *.html | ForEach-Object {
    $texto = [IO.File]::ReadAllText($_.FullName, $utf8)
    if ($texto.Contains("?v=$antigua")) {
        [IO.File]::WriteAllText($_.FullName, $texto.Replace("?v=$antigua", "?v=$nueva"), $utf8)
        $cambiados++
    }
}
[IO.File]::WriteAllText($archVersion, "$nueva`n", $utf8)
Write-Host "   $cambiados html actualizados"

# 2. Commit y push a main
if ($Mensaje -eq '') { $Mensaje = "Publica $ver $nueva" } else { $Mensaje = "$Mensaje ($ver $nueva)" }
Write-Host '== Commit y push a main'
Ejecutar-Git add -A
& git.exe status --short
Ejecutar-Git commit -q -m $Mensaje -m $atribucion
Ejecutar-Git push origin main

# 3. gh-pages = www + .nojekyll, construido sin tocar la carpeta de trabajo
Write-Host '== Actualizando gh-pages'
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("visorgis_" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $tmp | Out-Null
try {
    $vacio = Join-Path $tmp 'nojekyll'
    [IO.File]::WriteAllText($vacio, '')
    $blob = (& git.exe hash-object -w $vacio).Trim()
    $env:GIT_INDEX_FILE = Join-Path $tmp 'index'
    Ejecutar-Git read-tree 'HEAD:www'
    Ejecutar-Git update-index --add --cacheinfo "100644,$blob,.nojekyll"
    $arbol = (& git.exe write-tree).Trim()
} finally {
    Remove-Item Env:GIT_INDEX_FILE -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
& git.exe rev-parse -q --verify origin/gh-pages *> $null
$hayPages = ($LASTEXITCODE -eq 0)
if ($hayPages -and ((& git.exe rev-parse 'origin/gh-pages^{tree}').Trim() -eq $arbol)) {
    Write-Host '   gh-pages ya estaba al dia.'
} else {
    $padre = @(); if ($hayPages) { $padre = @('-p', 'origin/gh-pages') }
    $commit = (& git.exe commit-tree $arbol @padre -m "Publica $ver $nueva" -m $atribucion).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'Ha fallado git commit-tree' }
    Ejecutar-Git push origin "${commit}:refs/heads/gh-pages"
    Ejecutar-Git fetch -q origin gh-pages
}

Write-Host ''
Write-Host "Publicada la $ver $nueva en https://joverig.github.io/visorgis-sofia/"
Write-Host '(GitHub Pages tarda uno o dos minutos en actualizarse)'
