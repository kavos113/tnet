$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$serverRoot = Join-Path $repoRoot "services/papers-server"

Push-Location $serverRoot
try {
  go run go.uber.org/mock/mockgen@v0.6.0 `
    -source internal/server/health_handler.go `
    -destination internal/server/mock_health_checker_test.go `
    -package server
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
