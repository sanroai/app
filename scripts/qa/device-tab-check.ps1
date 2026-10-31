<#
.SYNOPSIS
  Edge-case checker for the mobile concept screen's mode tab bar.

.DESCRIPTION
  The mode pills live in a horizontal ScrollView that sits next to a vertical
  ScrollView. A tall mode (e.g. AR / 3D, which mounts a 320dp WebView) used to
  overflow the column, so flex-shrink crushed the tab bar and Android sliced the
  label glyphs. This script drives every mode, measures the rendered height of
  each label (via uiautomator bounds) and fails when a label is compressed.

  A healthy 13sp label measures ~40px on a 3x device; the bug produced 27px.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/qa/device-tab-check.ps1
#>
[CmdletBinding()]
param(
  [string]$Package = 'com.sanro.ai',
  [string]$Scheme = 'sanro-ai',
  [string]$ConceptId = '',
  [int]$MinLabelHeight = 34,
  [int]$SettleSeconds = 7,
  [string[]]$Modes = @('Learn', 'Practice', 'Ask Sanro AI'),
  [switch]$Landscape
)

$ErrorActionPreference = 'Continue'

$adbCmd = Get-Command adb -ErrorAction SilentlyContinue
$adb = $null
if ($adbCmd) { $adb = $adbCmd.Source }
if (-not $adb) {
  $candidate = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
  if (Test-Path $candidate) { $adb = $candidate }
}
if (-not $adb) { throw 'adb not found' }

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir = Join-Path $repoRoot "artifacts\qa\$(Get-Date -Format 'yyyy-MM-dd')\screenshots"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# The concept used to be hard-coded, which broke the check as soon as a curriculum
# realignment deleted that concept (the deep link opened a 404 and the mode bar never
# rendered). Resolve the student's weakest concept from the learning path instead, so
# the check always opens a concept the demo student can actually see.
function Resolve-ConceptId {
  param([string]$ApiBase = 'http://localhost:4000/api/v1')
  if ($ConceptId) { return $ConceptId }
  $envFile = Join-Path $repoRoot 'apps\api\.env'
  $pw = $null
  if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
      if ($line -match '^\s*SEED_DEMO_PASSWORD\s*=\s*(.+?)\s*$') { $pw = $matches[1].Trim().Trim('"').Trim("'") }
    }
  }
  if (-not $pw) { return $null }
  try {
    $login = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method Post -ContentType 'application/json' `
      -Body (@{ email = 'student@sanroai.com'; password = $pw } | ConvertTo-Json) -TimeoutSec 20
    $path = Invoke-RestMethod -Uri "$ApiBase/learning/path" -Headers @{ Authorization = "Bearer $($login.accessToken)" } -TimeoutSec 20
    return $path.next.conceptId
  } catch {
    return $null
  }
}

function Get-Ui {
  & $adb shell uiautomator dump /sdcard/ui.xml 2>&1 | Out-Null
  & $adb pull /sdcard/ui.xml "$env:TEMP\ui-tabcheck.xml" 2>&1 | Out-Null
  return (Get-Content "$env:TEMP\ui-tabcheck.xml" -Raw)
}

function Get-Bounds {
  param([string]$Xml, [string]$Attr, [string]$Value)
  foreach ($m in [regex]::Matches($Xml, '<node[^>]*>')) {
    $n = $m.Value
    if ($n -match "$Attr=`"$([regex]::Escape($Value))`"") {
      if ($n -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
        return [PSCustomObject]@{
          Left = [int]$matches[1]; Top = [int]$matches[2]
          Right = [int]$matches[3]; Bottom = [int]$matches[4]
        }
      }
    }
  }
  return $null
}

function Save-Screen {
  param([string]$Name)
  $file = Join-Path $outDir "$Name.png"
  & $adb shell screencap -p "/sdcard/$Name.png" 2>&1 | Out-Null
  & $adb pull "/sdcard/$Name.png" $file 2>&1 | Out-Null
  & $adb shell rm "/sdcard/$Name.png" 2>&1 | Out-Null
  return $file
}

foreach ($port in @(4000, 8081, 3000)) { & $adb reverse "tcp:$port" "tcp:$port" 2>&1 | Out-Null }

$ConceptId = Resolve-ConceptId
if (-not $ConceptId) {
  Write-Output "[tab-check] FAIL: could not resolve a concept for the demo student (is the API on :4000?)"
  exit 1
}
Write-Output "[tab-check] concept: $ConceptId"

# landscape is the harshest case: the least vertical space for header + tab bar
& $adb shell settings put system accelerometer_rotation 0 2>&1 | Out-Null
& $adb shell settings put system user_rotation $(if ($Landscape) { 1 } else { 0 }) 2>&1 | Out-Null
Start-Sleep -Seconds 4

& $adb shell am start -a android.intent.action.VIEW -d "${Scheme}://concept/${ConceptId}" 2>&1 | Out-Null

# wait for the mode bar instead of guessing: a cold bundle (Metro rebuild) can take
# well over ten seconds, and a fixed sleep made the first mode look "not found"
$ready = $false
for ($attempt = 0; $attempt -lt 12 -and -not $ready; $attempt++) {
  Start-Sleep -Seconds 3
  $probe = Get-Ui
  if ($probe -match 'Switch to .* mode') { $ready = $true }
}
if (-not $ready) { Write-Output "[tab-check] FAIL: the concept page never rendered its mode bar" ; exit 1 }
Write-Output "[tab-check] mode bar ready after $([Math]::Round(($attempt + 1) * 3))s"

$results = @()
foreach ($mode in $Modes) {
  $xml = Get-Ui
  $button = Get-Bounds -Xml $xml -Attr 'content-desc' -Value "Switch to $mode mode"
  if (-not $button) {
    # the pill row is horizontally scrollable - sweep it to both ends and retry
    for ($attempt = 0; $attempt -lt 3 -and -not $button; $attempt++) {
      & $adb shell input swipe 950 348 250 348 400 2>&1 | Out-Null
      Start-Sleep -Seconds 2
      $xml = Get-Ui
      $button = Get-Bounds -Xml $xml -Attr 'content-desc' -Value "Switch to $mode mode"
      if (-not $button) {
        & $adb shell input swipe 250 348 950 348 400 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        $xml = Get-Ui
        $button = Get-Bounds -Xml $xml -Attr 'content-desc' -Value "Switch to $mode mode"
      }
    }
  }
  if (-not $button) {
    $results += [PSCustomObject]@{ Mode = $mode; LabelHeight = '-'; Status = 'TAB NOT FOUND'; Screenshot = '' }
    continue
  }
  $cx = [int](($button.Left + $button.Right) / 2)
  $cy = [int](($button.Top + $button.Bottom) / 2)
  & $adb shell input tap $cx $cy 2>&1 | Out-Null
  Start-Sleep -Seconds $SettleSeconds

  $xml2 = Get-Ui
  $height = 0
  # the row animates after a switch - retry the measurement a few times
  for ($try = 0; $try -lt 4 -and $height -lt $MinLabelHeight; $try++) {
    $btn2 = Get-Bounds -Xml $xml2 -Attr 'content-desc' -Value "Switch to $mode mode"
    $label = Get-Bounds -Xml $xml2 -Attr 'text' -Value $mode
    if ($btn2) {
      foreach ($m in [regex]::Matches($xml2, '<node[^>]*>')) {
        $n = $m.Value
        if ($n -notmatch 'class="[^"]*TextView') { continue }
        if ($n -notmatch 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') { continue }
        $l = [int]$matches[1]; $t = [int]$matches[2]; $r = [int]$matches[3]; $b = [int]$matches[4]
        if ($l -ge $btn2.Left -and $r -le $btn2.Right + 4 -and $t -ge $btn2.Top -and $b -le $btn2.Bottom + 4) {
          $h = $b - $t
          if ($h -gt $height) { $height = $h }
        }
      }
    }
    if ($height -eq 0 -and $label) { $height = $label.Bottom - $label.Top }
    if ($height -lt $MinLabelHeight) { Start-Sleep -Seconds 2; $xml2 = Get-Ui }
  }
  $label = Get-Bounds -Xml $xml2 -Attr 'text' -Value $mode
  $shot = Save-Screen -Name ("device-tab-{0}" -f ($mode -replace '[^A-Za-z0-9]', '-').ToLower())
  $status = if ($label -and $height -ge $MinLabelHeight) { 'OK' } elseif (-not $label) { 'LABEL MISSING' } else { 'COMPRESSED' }
  $results += [PSCustomObject]@{ Mode = $mode; LabelHeight = $height; Status = $status; Screenshot = (Split-Path -Leaf $shot) }
}

Write-Output ''
Write-Output ("mode            height  status          screenshot")
foreach ($r in $results) {
  Write-Output ("{0,-15} {1,-7} {2,-15} {3}" -f $r.Mode, $r.LabelHeight, $r.Status, $r.Screenshot)
}
$bad = @($results | Where-Object { $_.Status -ne 'OK' })
Write-Output ''
if ($bad.Count -gt 0) { Write-Output "FAIL: $($bad.Count) mode(s) not OK" } else { Write-Output "PASS: all $($results.Count) modes render un-compressed labels" }
