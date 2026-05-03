param(
    [string]$AsarPath = '',
    [string]$ExtractDir = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
if ([string]::IsNullOrWhiteSpace($AsarPath)) {
    $AsarPath = Join-Path $repoRoot 'apps/desktop/dist/win-unpacked/resources/app.asar'
}
if ([string]::IsNullOrWhiteSpace($ExtractDir)) {
    $ExtractDir = Join-Path $repoRoot 'tmp/asar-check'
}

if (-not (Test-Path -LiteralPath $AsarPath)) {
    throw "app.asar was not found: $AsarPath"
}

$asarCli = Join-Path $repoRoot 'node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar/bin/asar.js'
if (-not (Test-Path -LiteralPath $asarCli)) {
    throw "asar CLI was not found: $asarCli"
}

$resolvedRepoTmp = Join-Path $repoRoot 'tmp'
$existingExtractDir = Resolve-Path $ExtractDir -ErrorAction SilentlyContinue
if ($existingExtractDir -and $existingExtractDir.Path.StartsWith($resolvedRepoTmp)) {
    Remove-Item -LiteralPath $existingExtractDir.Path -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $ExtractDir | Out-Null
node $asarCli extract $AsarPath $ExtractDir
if ($LASTEXITCODE -ne 0) {
    throw "Failed to extract app.asar with exit code $LASTEXITCODE"
}

$nodeModulesDir = Join-Path $ExtractDir 'node_modules'
if (-not (Test-Path -LiteralPath $nodeModulesDir)) {
    throw "Packaged app does not contain node_modules: $nodeModulesDir"
}

$packageDirs = [System.Collections.Generic.List[string]]::new()
Get-ChildItem -LiteralPath $nodeModulesDir -Directory | ForEach-Object {
    if ($_.Name.StartsWith('@')) {
        Get-ChildItem -LiteralPath $_.FullName -Directory | ForEach-Object {
            $packageDirs.Add($_.FullName)
        }
    }
    else {
        $packageDirs.Add($_.FullName)
    }
}

function Test-PackagedPackageExists {
    param([string]$PackageName)

    if ($PackageName.StartsWith('@')) {
        $parts = $PackageName.Split('/')
        return Test-Path -LiteralPath (Join-Path $nodeModulesDir (Join-Path $parts[0] (Join-Path $parts[1] 'package.json')))
    }

    return Test-Path -LiteralPath (Join-Path $nodeModulesDir (Join-Path $PackageName 'package.json'))
}

$missingDependencies = [System.Collections.Generic.List[string]]::new()
foreach ($packageDir in $packageDirs) {
    $packageJsonPath = Join-Path $packageDir 'package.json'
    if (-not (Test-Path -LiteralPath $packageJsonPath)) {
        continue
    }

    $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
    if (-not ($packageJson.PSObject.Properties.Name -contains 'dependencies')) {
        continue
    }

    foreach ($dependency in $packageJson.dependencies.PSObject.Properties) {
        if (-not (Test-PackagedPackageExists -PackageName $dependency.Name)) {
            $missingDependencies.Add("$($packageJson.name)@$($packageJson.version) -> $($dependency.Name)@$($dependency.Value)")
        }
    }
}

$uniqueMissingDependencies = $missingDependencies | Sort-Object -Unique
if ($uniqueMissingDependencies) {
    $uniqueMissingDependencies | ForEach-Object { Write-Error $_ }
    throw 'Packaged node_modules dependency check failed.'
}

Write-Host 'Packaged node_modules dependency check passed.'
