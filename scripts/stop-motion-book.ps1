$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$statePath = Join-Path $rootDir '.motion-book-server.json'
$stdoutLogPath = Join-Path $rootDir '.motion-book-server.out.log'
$stderrLogPath = Join-Path $rootDir '.motion-book-server.err.log'

Set-Location -LiteralPath $rootDir

if (-not (Test-Path -LiteralPath $statePath)) {
  Write-Host 'motion-book server is not running.'
  exit 0
}

$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json

if ($state.pid) {
  Stop-Process -Id $state.pid -Force -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $stdoutLogPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $stderrLogPath -Force -ErrorAction SilentlyContinue

Write-Host 'motion-book server stopped.'
