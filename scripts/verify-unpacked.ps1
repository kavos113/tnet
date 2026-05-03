param(
    [int]$WaitSeconds = 12,
    [int]$StartupTimeoutSeconds = 20,
    [string]$ExecutablePath = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
if ([string]::IsNullOrWhiteSpace($ExecutablePath)) {
    $ExecutablePath = Join-Path $repoRoot 'apps/desktop/dist/win-unpacked/tnet.exe'
}

if (-not (Test-Path -LiteralPath $ExecutablePath)) {
    throw "Unpacked executable was not found: $ExecutablePath"
}

$outLog = Join-Path ([System.IO.Path]::GetTempPath()) 'tnet-unpacked.out.log'
$errLog = Join-Path ([System.IO.Path]::GetTempPath()) 'tnet-unpacked.err.log'
$profileRoot = Join-Path $repoRoot 'tmp'
$userDataDir = Join-Path $profileRoot "tnet-unpacked-profile-$PID"

Remove-Item -LiteralPath $outLog, $errLog -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null

$process = Start-Process `
    -FilePath $ExecutablePath `
    -ArgumentList "--user-data-dir=$userDataDir", '--no-sandbox' `
    -WorkingDirectory (Split-Path -Parent $ExecutablePath) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

function Stop-ProcessTree {
    param([int]$RootProcessId)

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        taskkill.exe /PID $RootProcessId /T /F 1>$null 2>$null
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

try {
    $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500
        if ($process.HasExited) {
            throw "Unpacked app exited early with code $($process.ExitCode)."
        }
    }

    Start-Sleep -Seconds $WaitSeconds

    $stdout = if (Test-Path $outLog) { Get-Content -LiteralPath $outLog -Raw } else { '' }
    $stderr = if (Test-Path $errLog) { Get-Content -LiteralPath $errLog -Raw } else { '' }
    $combinedLog = "$stdout`n$stderr"

    $missingModuleMatches = [regex]::Matches($combinedLog, "Cannot find module '([^']+)'")
    foreach ($match in $missingModuleMatches) {
        $moduleName = $match.Groups[1].Value
        if ($moduleName -ne '@napi-rs/canvas') {
            throw "Unpacked app reported a missing module: $moduleName"
        }
    }

    if (($combinedLog -match 'MODULE_NOT_FOUND' -and $combinedLog -notmatch '@napi-rs/canvas') -or
        $combinedLog -match 'App threw an error' -or
        $combinedLog -match 'UnhandledPromiseRejectionWarning' -or
        $combinedLog -match 'ERR_DLOPEN_FAILED' -or
        $combinedLog -match 'Error occurred in handler') {
        throw 'Unpacked app started but Electron reported a startup error.'
    }

    Write-Host 'Unpacked app startup verified.'
    if (Test-Path $outLog) {
        Get-Content -LiteralPath $outLog
    }
    if (Test-Path $errLog) {
        Get-Content -LiteralPath $errLog
    }
}
finally {
    Stop-ProcessTree -RootProcessId $process.Id
    $resolvedProfileRoot = Resolve-Path $profileRoot
    if ((Test-Path -LiteralPath $userDataDir) -and
        $userDataDir.StartsWith($resolvedProfileRoot.Path) -and
        (Split-Path -Leaf $userDataDir).StartsWith('tnet-unpacked-profile-')) {
        Remove-Item -LiteralPath $userDataDir -Recurse -Force
    }
}
