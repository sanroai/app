<#
  Release verification: everything that has to be green before the product ships.

    powershell -ExecutionPolicy Bypass -File scripts/qa/verify-release.ps1

  Runs the gates (typecheck, lint, the three test suites) and the product-level
  probes (web/mobile parity, the chapter hub, practice scoring, video liveness and
  duration, curriculum coverage, chapter PDFs, book alignment). Exits 1 with the
  list of failures.
#>
$ErrorActionPreference = 'Continue'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repo

$results = @()

function Run-Step {
  param(
    [string]$Name,
    [string]$Command,
    [string]$Pattern
  )
  Write-Output ""
  Write-Output "=== $Name ==="
  $output = Invoke-Expression $Command 2>&1 | Out-String
  $failed = $false
  if ($Pattern) {
    $failed = ($output -notmatch $Pattern) -and ($LASTEXITCODE -ne 0)
  } else {
    $failed = $LASTEXITCODE -ne 0
  }
  $tail = ($output -split "`n" | Where-Object { $_.Trim() } | Select-Object -Last 3) -join "`n      "
  if ($tail) { Write-Output "      $tail" }
  $script:results += [PSCustomObject]@{ Step = $Name; Ok = -not $failed }
  if ($failed) { Write-Output "      -> FAILED" }
}

Run-Step 'typecheck'      'pnpm -r typecheck'                  'typecheck: Done'
Run-Step 'lint'           'pnpm -r lint'                       '0 errors'
Run-Step 'api tests'      'pnpm --filter @sanro/api test'      'Tests .*passed'
Run-Step 'web tests'      'pnpm --filter @sanro/web test'      'Tests .*passed'
Run-Step 'mobile tests'   'pnpm --filter @sanro/mobile test'   'Tests:'
Run-Step 'parity sweep'   'node scripts/qa/audit-web-mobile-parity.mjs'  'PARITY: PASS'
Run-Step 'chapter hub'    'node scripts/qa/probe-chapter-hub.mjs'       '9/9 PASS'
Run-Step 'practice scoring' 'node scripts/qa/probe-practice-scoring.mjs sanro_dev'  'PRACTICE SCORING: PASS'
Run-Step 'practice scoring (5)' 'node scripts/qa/probe-practice-scoring.mjs sanro_dev --email student5@sanroai.com'  'PRACTICE SCORING: PASS'
Run-Step 'practice scoring (6)' 'node scripts/qa/probe-practice-scoring.mjs sanro_dev --email student6@sanroai.com'  'PRACTICE SCORING: PASS'
Run-Step 'practice scoring (7)' 'node scripts/qa/probe-practice-scoring.mjs sanro_dev --email student7@sanroai.com'  'PRACTICE SCORING: PASS'
Run-Step 'practice scoring (8)' 'node scripts/qa/probe-practice-scoring.mjs sanro_dev --email student8@sanroai.com'  'PRACTICE SCORING: PASS'
Run-Step 'practice scoring (9)' 'node scripts/qa/probe-practice-scoring.mjs sanro_dev --email student9@sanroai.com'  'PRACTICE SCORING: PASS'
Run-Step 'video liveness' 'node scripts/qa/verify-video-liveness.mjs sanro_dev'  'thumbnail'
Run-Step 'video lengths'  'node scripts/qa/audit-video-durations.mjs --min 120'  'TOO SHORT: 0'
Run-Step 'curriculum'     'node scripts/qa/audit-curriculum-coverage.mjs'   'VIDEO lessons without a URL in the map: 0'
Run-Step 'chapter PDFs'   'node scripts/qa/audit-chapter-pdfs.mjs'          'without a PDF              : 0'
Run-Step 'book alignment' 'node scripts/qa/audit-book-alignment.mjs'       'missing from the seed : 0'

Write-Output ""
Write-Output "=== VERIFICATION SUMMARY ==="
foreach ($r in $results) {
  $mark = if ($r.Ok) { 'PASS' } else { 'FAIL' }
  Write-Output ("  {0,-4} {1}" -f $mark, $r.Step)
}
$failed = @($results | Where-Object { -not $_.Ok })
if ($failed.Count -gt 0) {
  Write-Output ""
  Write-Output "=== VERIFICATION: FAIL ($($failed.Count) step(s)) ==="
  exit 1
}
Write-Output ""
Write-Output "=== VERIFICATION: PASS ($($results.Count) steps) ==="
