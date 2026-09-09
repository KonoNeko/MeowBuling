$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
$bundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (Test-Path -LiteralPath $bundledNode) { $nodeExecutable = $bundledNode }

# Node needs an explicit proxy option; Windows browser proxy settings alone do not apply.
if (-not $env:HTTPS_PROXY -and -not $env:https_proxy) {
  $settings = Get-ItemProperty 'HKCU:/Software/Microsoft/Windows/CurrentVersion/Internet Settings' -ErrorAction SilentlyContinue
  if ($settings.ProxyEnable -eq 1 -and $settings.ProxyServer) {
    $proxyAddress = [string]$settings.ProxyServer
    if ($proxyAddress.Contains('=')) {
      $entry = $proxyAddress.Split(';') | Where-Object { $_ -match '^https=' } | Select-Object -First 1
      if (-not $entry) { $entry = $proxyAddress.Split(';') | Where-Object { $_ -match '^http=' } | Select-Object -First 1 }
      $proxyAddress = if ($entry) { $entry.Substring($entry.IndexOf('=') + 1) } else { '' }
    }
    if ($proxyAddress) {
      $env:HTTPS_PROXY = if ($proxyAddress -match '^https?://') { $proxyAddress } else { "http://$proxyAddress" }
      Write-Host 'Using the configured Windows proxy for this test.'
    }
  }
}
& $nodeExecutable --use-env-proxy test-gemini.js @args
exit $LASTEXITCODE
