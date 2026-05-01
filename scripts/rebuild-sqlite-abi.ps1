param(
    [ValidateSet('node', 'electron')]
    [string]$Target
)

$ErrorActionPreference = 'Stop'

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$betterSqliteDir = Join-Path $rootDir 'node_modules\.pnpm\better-sqlite3@12.9.0\node_modules\better-sqlite3'

if (-not (Test-Path $betterSqliteDir)) {
    throw "better-sqlite3 package directory was not found: $betterSqliteDir"
}

function Invoke-NodeRebuild {
    Push-Location $betterSqliteDir
    try {
        pnpm exec prebuild-install
        if ($LASTEXITCODE -ne 0) {
            throw "prebuild-install failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Get-ElectronVersion {
    $electronPackageJsonPath = Join-Path $rootDir 'node_modules\electron\package.json'
    if (-not (Test-Path $electronPackageJsonPath)) {
        throw "Electron package.json was not found: $electronPackageJsonPath"
    }

    $electronPackage = Get-Content -LiteralPath $electronPackageJsonPath -Raw | ConvertFrom-Json
    return $electronPackage.version
}

function Get-ElectronRebuildCommand {
    $electronRebuildRoot = Join-Path $rootDir 'node_modules\.pnpm'
    $command = Get-ChildItem `
        -LiteralPath $electronRebuildRoot `
        -Recurse `
        -Filter 'electron-rebuild.cmd' `
        -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -like '*@electron+rebuild*' } |
        Select-Object -First 1

    if (-not $command) {
        throw 'electron-rebuild.cmd was not found under node_modules\.pnpm.'
    }

    return $command.FullName
}

function Invoke-ElectronRebuild {
    $electronVersion = Get-ElectronVersion
    $electronRebuildCommand = Get-ElectronRebuildCommand
    & $electronRebuildCommand -f -w better-sqlite3 -v $electronVersion
    if ($LASTEXITCODE -ne 0) {
        throw "electron-rebuild failed with exit code $LASTEXITCODE."
    }
}

if ($Target -eq 'node') {
    Invoke-NodeRebuild
    Write-Host 'better-sqlite3 rebuilt for Node.js.'
}
else {
    Invoke-ElectronRebuild
    Write-Host 'better-sqlite3 rebuilt for Electron.'
}
