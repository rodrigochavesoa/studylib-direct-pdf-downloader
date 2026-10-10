$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$firefoxOutput = Join-Path $projectRoot "dist\firefox"

New-Item -ItemType Directory -Path $firefoxOutput -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot "firefox\manifest.json") -Destination (Join-Path $firefoxOutput "manifest.json") -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "content.js") -Destination (Join-Path $firefoxOutput "content.js") -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "background.js") -Destination (Join-Path $firefoxOutput "background.js") -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "icons") -Destination $firefoxOutput -Recurse -Force

Write-Output "Pacote do Firefox preparado em: $firefoxOutput"
