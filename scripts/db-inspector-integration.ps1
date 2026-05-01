param(
  [string]$PostgresUrl = $env:DB_INSPECTOR_POSTGRES_URL,
  [string]$MysqlUrl = $env:DB_INSPECTOR_MYSQL_URL
)

$ErrorActionPreference = "Stop"

if (-not $PostgresUrl -and -not $MysqlUrl) {
  Write-Host "DB Inspector integration tests are opt-in."
  Write-Host "Set DB_INSPECTOR_POSTGRES_URL and/or DB_INSPECTOR_MYSQL_URL, then add matching *.integration.test.ts files."
  exit 0
}

pnpm sqlite:node
pnpm vitest run "packages/app-db-inspector/src/**/*.integration.test.ts"
