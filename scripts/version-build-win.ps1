param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'

$semverPattern = '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$'
if ($Version -notmatch $semverPattern) {
    throw "Version must be a valid semver value. Received: $Version"
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

$packageJsonPaths = [System.Collections.Generic.List[string]]::new()
$packageJsonPaths.Add((Join-Path $repoRoot 'package.json'))

foreach ($workspaceDirName in @('apps', 'packages')) {
    $workspaceDir = Join-Path $repoRoot $workspaceDirName
    if (-not (Test-Path -LiteralPath $workspaceDir)) {
        continue
    }

    Get-ChildItem -LiteralPath $workspaceDir -Directory | ForEach-Object {
        $packageJsonPath = Join-Path $_.FullName 'package.json'
        if (Test-Path -LiteralPath $packageJsonPath) {
            $packageJsonPaths.Add($packageJsonPath)
        }
    }
}

foreach ($packageJsonPath in $packageJsonPaths) {
    $content = Get-Content -LiteralPath $packageJsonPath -Raw
    $packageJson = $content | ConvertFrom-Json

    if (-not ($packageJson.PSObject.Properties.Name -contains 'version')) {
        throw "Missing version field: $packageJsonPath"
    }

    $updatedContent = [regex]::Replace(
        $content,
        '(?m)^(\s*"version"\s*:\s*")[^"]+(")',
        "`${1}$Version`${2}",
        1
    )

    if ($updatedContent -eq $content -and $packageJson.version -ne $Version) {
        throw "Failed to update version field: $packageJsonPath"
    }

    if ($updatedContent -eq $content) {
        Write-Host "Already $Version`: $packageJsonPath"
    }
    else {
        Set-Content -LiteralPath $packageJsonPath -Value $updatedContent -NoNewline
        Write-Host "Updated $packageJsonPath to $Version"
    }
}

Push-Location $repoRoot
try {
    pnpm build:win
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm build:win failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
