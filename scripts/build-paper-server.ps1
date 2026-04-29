$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$serverRoot = Join-Path $repoRoot "services/papers-server"
$outputDir = Join-Path $repoRoot "dist/papers-server"

$goos = if ($env:GOOS) { $env:GOOS } else { (go env GOOS) }
$extension = if ($goos -eq "windows") { ".exe" } else { "" }
$outputPath = Join-Path $outputDir "papers-server$extension"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Push-Location $serverRoot
try {
  go build -o $outputPath ./cmd/papers-server
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}

Write-Host "Built papers server: $outputPath"
