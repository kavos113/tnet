param(
    [Parameter(Mandatory = $true)]
    [string]$UserDataDir,

    [Parameter(Mandatory = $true)]
    [string]$AccessLogPath,

    [string]$Addr = "127.0.0.1:38911"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$serverRoot = Join-Path $repoRoot "services/papers-server"
$outputDir = Join-Path $UserDataDir "dev-server"

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

& $outputPath --addr $Addr --user-data-dir $UserDataDir --access-log-path $AccessLogPath
exit $LASTEXITCODE
