# Funciones comunes para la voz de Azure (las usan muestras_voz.ps1 y generar_audios.ps1).
# La clave NUNCA va en el codigo ni se sube a GitHub: se lee de voz\azure.txt (excluido en .gitignore).
$ErrorActionPreference = 'Stop'
# TLS 1.2 y, si este Windows lo conoce, TLS 1.3 (12288)
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]12288 }
catch { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 }
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Leer-Azure([string]$raiz) {
    $f = Join-Path $raiz 'voz\azure.txt'
    if (-not (Test-Path $f)) {
        [System.IO.File]::WriteAllText($f, "clave=PEGA_AQUI_TU_CLAVE`r`nregion=auto`r`n", $utf8)
        Write-Host "He creado voz\azure.txt. Abrelo, pega tu clave de Azure Speech y la region, guarda y vuelve a lanzar." -ForegroundColor Yellow
        Start-Process notepad.exe $f
        exit 1
    }
    $cfg = @{}
    foreach ($l in [System.IO.File]::ReadAllLines($f)) { if ($l -match '^\s*([^=#]+?)\s*=\s*(.+?)\s*$') { $cfg[$matches[1]] = $matches[2] } }
    if (-not $cfg.clave -or $cfg.clave -like 'PEGA_AQUI*') { Write-Host 'Falta la clave en voz\azure.txt' -ForegroundColor Red; exit 1 }
    if (-not $cfg.region -or $cfg.region -eq 'auto' -or -not (Probar-Region $cfg.clave $cfg.region)) {
        Write-Host 'Buscando la region del recurso de Azure...'
        $cfg.region = $null
        foreach ($r in @('westeurope', 'northeurope', 'spaincentral', 'francecentral', 'germanywestcentral', 'swedencentral',
                         'uksouth', 'italynorth', 'switzerlandnorth', 'eastus', 'eastus2', 'westus', 'westus2', 'westus3',
                         'centralus', 'southcentralus', 'northcentralus', 'canadacentral', 'brazilsouth', 'centralindia',
                         'eastasia', 'southeastasia', 'japaneast', 'koreacentral', 'australiaeast', 'uaenorth', 'southafricanorth')) {
            if (Probar-Region $cfg.clave $r) { $cfg.region = $r; break }
        }
        if (-not $cfg.region) { Write-Host 'La clave no funciona en ninguna region: revisa que este bien copiada en voz\azure.txt' -ForegroundColor Red; exit 1 }
        Write-Host "Region: $($cfg.region) (guardada en voz\azure.txt)" -ForegroundColor Green
        [System.IO.File]::WriteAllText($f, "clave=$($cfg.clave)`r`nregion=$($cfg.region)`r`n", $utf8)
    }
    return $cfg
}
function Probar-Region([string]$clave, [string]$region) {
    try {
        Invoke-WebRequest -Uri "https://$region.api.cognitive.microsoft.com/sts/v1.0/issueToken" -Method Post -Headers @{ 'Ocp-Apim-Subscription-Key' = $clave } -Body '' -UseBasicParsing -TimeoutSec 15 | Out-Null
        return $true
    } catch { return $false }
}
function Escapar-Xml([string]$t) { return [System.Security.SecurityElement]::Escape($t) }
function Ssml([string]$voz, [string]$texto, [string]$estilo, [string]$rate, [string]$pitch) {
    $cuerpo = "<prosody rate='$rate' pitch='$pitch'>" + (Escapar-Xml $texto) + "</prosody>"
    if ($estilo) { $cuerpo = "<mstts:express-as style='$estilo'>$cuerpo</mstts:express-as>" }
    return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='es-ES'><voice name='$voz'>$cuerpo</voice></speak>"
}
function Sintetizar($cfg, [string]$ssml, [string]$destino) {
    $url = "https://$($cfg.region).tts.speech.microsoft.com/cognitiveservices/v1"
    $h = @{ 'Ocp-Apim-Subscription-Key' = $cfg.clave; 'X-Microsoft-OutputFormat' = 'audio-24khz-96kbitrate-mono-mp3'; 'User-Agent' = 'visorgis-sofia' }
    Invoke-WebRequest -Uri $url -Method Post -Headers $h -ContentType 'application/ssml+xml; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($ssml)) -OutFile $destino -UseBasicParsing | Out-Null
}
function Voces($cfg) {
    $url = "https://$($cfg.region).tts.speech.microsoft.com/cognitiveservices/voices/list"
    return Invoke-RestMethod -Uri $url -Headers @{ 'Ocp-Apim-Subscription-Key' = $cfg.clave } -UseBasicParsing
}
