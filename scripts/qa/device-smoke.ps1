<#
.SYNOPSIS
  On-device smoke check for the SANRO mobile app (Android, USB debugging).

.DESCRIPTION
  Connects the physical device to the local dev servers, launches the installed
  app and captures screenshots. Requires:
    - app "com.sanro.ai" installed (debuggable build)
    - API running on :4000 and Metro on :8081 (for dev-client builds)
    - adb on PATH or in $env:LOCALAPPDATA\Android\Sdk\platform-tools

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/qa/device-smoke.ps1 -Label ar-check
#>
[CmdletBinding()]
param(
  [string]$Label = 'device',
  [int]$WaitSeconds = 12,
  [string]$Package = 'com.sanro.ai',
  [string]$Activity = '.MainActivity'
)

$ErrorActionPreference = 'Continue'  # native adb writes progress to stderr; real failures are thrown explicitly below

$adbCmd = Get-Command adb -ErrorAction SilentlyContinue
$adb = $null
if ($adbCmd) { $adb = $adbCmd.Source }
if (-not $adb) {
  $candidate = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
  if (Test-Path $candidate) { $adb = $candidate }
}
if (-not $adb) { throw 'adb not found (install Android platform-tools or set PATH)' }

$stamp = Get-Date -Format 'yyyy-MM-dd'
$outDir = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "artifacts\qa\$stamp\screenshots"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Output "[device-smoke] adb        : $adb"
Write-Output "[device-smoke] package    : $Package"
Write-Output "[device-smoke] output dir : $outDir"

$devices = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' }
if (-not $devices) { throw 'no device in "device" state (adb devices)' }
Write-Output "[device-smoke] device     : $($devices -join ', ')"

foreach ($port in @(4000, 8081)) {
  & $adb reverse "tcp:$port" "tcp:$port" | Out-Null
  Write-Output "[device-smoke] reverse    : device localhost:$port -> host localhost:$port"
}

& $adb shell am start -n "$Package/$Activity" | Out-Null
Write-Output "[device-smoke] launched, waiting ${WaitSeconds}s for the UI to settle"
Start-Sleep -Seconds $WaitSeconds

$file = Join-Path $outDir "$Label.png"
# NOTE: PowerShell redirection mangles binary streams, so capture on-device and pull.
$remote = "/sdcard/$Label.png"
& $adb shell screencap -p $remote | Out-Null
& $adb pull $remote $file 2>&1 | Out-Null
& $adb shell rm $remote | Out-Null
if (-not (Test-Path $file) -or (Get-Item $file).Length -lt 1024) {
  throw "screenshot capture failed ($file)"
}
$sig = [System.IO.File]::ReadAllBytes($file)[0..3] -join ','
if ($sig -ne '137,80,78,71') { throw "not a valid PNG (signature $sig) - capture was corrupted" }
Write-Output "[device-smoke] screenshot  : $file ($((Get-Item $file).Length) bytes, PNG ok)"

$focus = & $adb shell dumpsys window 2>$null | Select-String -Pattern 'mCurrentFocus|mFocusedApp' | Select-Object -First 2
if ($focus) { Write-Output "[device-smoke] focus      : $($focus -join ' | ')" }
