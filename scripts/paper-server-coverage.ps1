$repoRoot = (Get-Location).Path
$serverRoot = Join-Path $repoRoot "services/papers-server"

Push-Location $serverRoot

try {
    if (Test-Path "cover") {
        Remove-Item "cover" -Recurse -Force
    }
    New-Item -ItemType Directory -Path . -Name "cover" | Out-Null
    $coverageDir = Join-Path (Get-Location) "cover"
    $coverFile = Join-Path $coverageDir "coverage.filtered.out"
    $htmlFile = Join-Path $coverageDir "coverage.filtered.html"

    $packages = go list ./... | Where-Object {
        $_ -notmatch "/internal/gen/" -and
        $_ -notmatch "/internal/.*/mock$" -and
        $_ -notmatch "/cmd/" -and
        $_ -notmatch "/migrations$"
    }

    go test $packages -covermode=atomic -coverprofile="$coverFile"
    go tool cover -html="$coverFile" -o "$htmlFile"
    go tool cover -func="$coverFile"
}
finally {
    Pop-Location
}
