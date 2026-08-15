$ErrorActionPreference = "Stop"

$env:TCC_BACKEND_URL = if ($env:TCC_BACKEND_URL) { $env:TCC_BACKEND_URL } else { "http://localhost:8080" }
$env:TCC_SERIAL_PORT = if ($env:TCC_SERIAL_PORT) { $env:TCC_SERIAL_PORT } else { "COM5" }
$env:TCC_MICRO_PORT = if ($env:TCC_MICRO_PORT) { $env:TCC_MICRO_PORT } else { "8000" }

$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = "python"
}

Write-Host "Starting microservice on $($env:TCC_MICRO_PORT)"
Write-Host "Backend: $($env:TCC_BACKEND_URL)"
Write-Host "Serial: $($env:TCC_SERIAL_PORT)"
& $python (Join-Path $PSScriptRoot "tcc-micro\api.py")
