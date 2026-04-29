Param(
    [string]$cover
)

$repoRoot = (Get-Location).Path
$serverRoot = Join-Path $repoRoot "services/papers-server"

Push-Location $serverRoot

try {
    if (Test-Path "cover") {
        Remove-Item "cover" -Recurse -Force
    }
    New-Item -ItemType Directory -Path . -Name "cover" | Out-Null
    $coverageDir = Join-Path (Get-Location) "cover"

    $getCover = $cover -ne $null -and $cover -eq "cover"

    if ($getCover) {
        $coverFile = Join-Path $coverageDir "coverage.out"
        $htmlFile = Join-Path $coverageDir "coverage.html"

        go test ./... -covermode=atomic -coverprofile="$coverFile"
        go tool cover -html="$coverFile" -o "$htmlFile"
    }
    else {
        go test ./...
    }
}
finally {
    Pop-Location
}