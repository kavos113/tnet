param(
    [Parameter(Mandatory = $true)]
    [string]$Task
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $repoRoot "apps/mobile"
$gradle = Join-Path $mobileRoot "gradlew.bat"

if (-not (Test-Path $gradle)) {
    throw "Gradle wrapper was not found: $gradle"
}

Push-Location $mobileRoot
try {
    & $gradle $Task
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
