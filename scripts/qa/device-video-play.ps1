<#
  On-device video playback check.

  Bug: the concept page's Learn tab showed "Video player configuration error /
  Error 153" and no video ever played. An Android WebView sends no Origin/Referer
  for a top-level navigation, so YouTube could not build a player configuration.

  This script drives the real device: opens a concept that has a video lesson,
  taps the player, waits, screenshots the result and looks for the failure text.
  It FAILS (exit 1) when the player still reports a configuration error.

    powershell -ExecutionPolicy Bypass -File scripts/qa/device-video-play.ps1 -Label video-play
#>
param(
  [string]$Adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
  [string]$Package = 'com.sanro.ai',
  [string]$Activity = 'com.sanro.ai.MainActivity',
  [string]$Scheme = 'sanro-ai',
  [string]$ConceptId = '0a375db4-4f29-4d26-89e6-2d8850d75b58',
  [int]$WaitSeconds = 12,
  [int]$PlayWaitSeconds = 10,
  [string]$Label = 'video-play',
  [string]$OutDir = ''
)

$ErrorActionPreference = 'Continue'
if (-not $OutDir) {
  $OutDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path "artifacts\qa\$(Get-Date -Format yyyy-MM-dd)\screenshots"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Get-Ui {
  & $Adb shell uiautomator dump /sdcard/ui.xml 2>&1 | Out-Null
  & $Adb pull /sdcard/ui.xml "$env:TEMP\ui-device.xml" 2>&1 | Out-Null
  if (Test-Path "$env:TEMP\ui-device.xml") { return Get-Content "$env:TEMP\ui-device.xml" -Raw }
  return ''
}

function Get-Bounds {
  param([string]$Xml, [string]$Attr, [string]$Value)
  if (-not $Xml) { return $null }
  $pattern = '<node[^>]*' + [regex]::Escape($Attr) + '="' + [regex]::Escape($Value) + '"[^>]*>'
  $m = [regex]::Match($Xml, $pattern)
  if (-not $m.Success) { return $null }
  $b = [regex]::Match($m.Value, 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"')
  if (-not $b.Success) { return $null }
  return [PSCustomObject]@{
    Left   = [int]$b.Groups[1].Value
    Top    = [int]$b.Groups[2].Value
    Right  = [int]$b.Groups[3].Value
    Bottom = [int]$b.Groups[4].Value
  }
}

Write-Output "[video-play] device    : $(& $Adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "`tdevice$" })"
Write-Output "[video-play] concept   : $ConceptId"

& $Adb shell am force-stop $Package 2>&1 | Out-Null
Start-Sleep -Seconds 2
& $Adb shell am start -a android.intent.action.VIEW -d "${Scheme}://concept/${ConceptId}" 2>&1 | Out-Null
Write-Output "[video-play] opened, waiting ${WaitSeconds}s for the Learn tab"
Start-Sleep -Seconds $WaitSeconds

$xml = Get-Ui
$play = Get-Bounds -Xml $xml -Attr 'content-desc' -Value 'Play Surface Areas and Volumes'
if (-not $play) {
  $play = Get-Bounds -Xml $xml -Attr 'content-desc' -Value 'Play Surface Areas and Volumes '
}
if (-not $play) {
  # fall back to the first "Play ..." control on the screen
  $m = [regex]::Match($xml, '<node[^>]*content-desc="(Play [^"]+)"[^>]*>')
  if ($m.Success) {
    Write-Output "[video-play] player button : $($m.Groups[1].Value)"
    $play = Get-Bounds -Xml $xml -Attr 'content-desc' -Value $m.Groups[1].Value
  }
}
if (-not $play) { Write-Output "[video-play] FAIL: no play button found on the concept page"; exit 1 }

$cx = [int](($play.Left + $play.Right) / 2)
$cy = [int](($play.Top + $play.Bottom) / 2)
Write-Output "[video-play] tapping play at ($cx,$cy)"
& $Adb shell input tap $cx $cy 2>&1 | Out-Null
Start-Sleep -Seconds $PlayWaitSeconds

$after = Get-Ui
$file = Join-Path $OutDir "$Label.png"
$remote = "/sdcard/$Label.png"
& $Adb shell screencap -p $remote 2>&1 | Out-Null
& $Adb pull $remote $file 2>&1 | Out-Null
& $Adb shell rm $remote 2>&1 | Out-Null

$errorText = $null
if ($after -match 'Error 153|Video player configuration error') { $errorText = 'player configuration error still shown' }
Write-Output "[video-play] screenshot : $file"
if ($errorText) {
  Write-Output "[video-play] FAIL: $errorText"
  exit 1
}
Write-Output "[video-play] PASS: no player configuration error in the UI tree"
exit 0
