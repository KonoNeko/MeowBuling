$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDirectory

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodeExecutable = if ($nodeCommand) { $nodeCommand.Source } else { $null }
$bundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if ((-not $nodeExecutable -or (& $nodeExecutable -p 'process.versions.node.split(".")[0]') -ne '24') -and (Test-Path -LiteralPath $bundledNode)) { $nodeExecutable = $bundledNode }
if (-not $nodeExecutable) { throw 'Please install Node.js 24 first.' }

$logDirectory = Join-Path $projectDirectory 'logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

$appRunning = $false
try { $appStatus = Invoke-RestMethod http://127.0.0.1:5173/api/status -TimeoutSec 5; $appRunning = [bool]$appStatus.model }
catch { }
if (-not $appRunning) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'dist/index.html'))) {
    & $nodeExecutable node_modules/vite/bin/vite.js build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed. Check Node.js 24 and npm install.' }
  }
  Start-Process -FilePath $nodeExecutable -ArgumentList '--import','tsx','server/index.ts' -WorkingDirectory $projectDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'app.log') -RedirectStandardError (Join-Path $logDirectory 'app-error.log') | Out-Null
}
for ($attempt = 0; $attempt -lt 15; $attempt++) {
  try { $null = Invoke-RestMethod http://127.0.0.1:5173/api/status -TimeoutSec 2; break }
  catch { Start-Sleep -Seconds 1 }
}
Start-Process 'http://127.0.0.1:5173/'
