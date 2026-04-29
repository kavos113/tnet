param(
    [int]$WaitSeconds = 12,
    [int]$StartupTimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'

$rootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$outLog = Join-Path ([System.IO.Path]::GetTempPath()) 'tnet-pnpm-dev.out.log'
$errLog = Join-Path ([System.IO.Path]::GetTempPath()) 'tnet-pnpm-dev.err.log'

Remove-Item -LiteralPath $outLog, $errLog -Force -ErrorAction SilentlyContinue

$process = Start-Process `
    -FilePath 'pnpm' `
    -ArgumentList 'dev' `
    -WorkingDirectory $rootDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

function Stop-DevProcessTree {
    param([int]$RootProcessId)

    taskkill.exe /PID $RootProcessId /T /F 1>$null 2>$null
}

try {
    $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
    $started = $false

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 500

        if ($process.HasExited) {
            throw "pnpm dev exited early with code $($process.ExitCode)."
        }

        $stdout = if (Test-Path $outLog) { Get-Content -LiteralPath $outLog -Raw } else { '' }
        if ($stdout -match 'dev server running for the electron renderer process' -and
            $stdout -match 'starting electron app') {
            $started = $true
            break
        }
    }

    if (-not $started) {
        throw "pnpm dev did not report a successful startup within $StartupTimeoutSeconds seconds."
    }

    Start-Sleep -Seconds $WaitSeconds

    Write-Host 'pnpm dev startup verified.'
    if (Test-Path $outLog) {
        Get-Content -LiteralPath $outLog
    }
    if (Test-Path $errLog) {
        Get-Content -LiteralPath $errLog
    }
}
finally {
    Stop-DevProcessTree -RootProcessId $process.Id
}
