<#
  reset_assets.ps1
  ────────────────────────────────────────────────────────────────────
  Deletes every asset that a previous run of assets.ps1 inserted:

    • Removes large files from GridFS
    • Removes small-file documents from the collection

  USAGE
    .\reset_assets.ps1 -AssetsDir <dir> [-MongoUri ...] [-Db ...]
                       [-Coll ...]     [-Bucket ...]  [-ThresholdMiB ...]

  Defaults match assets.ps1 so you can usually just pass -AssetsDir.
#>

param(
  [Parameter(Mandatory)] [string]$AssetsDir,
  [string]$MongoUri     = 'mongodb://localhost:27017',
  [string]$Db           = 'game_assets',
  [string]$Coll         = 'assets',
  [string]$Bucket       = 'assets_fs',
  [int]   $ThresholdMiB = 16
)

#--- constants mirroring the ingest script ────────────────────────────
$ThresholdBytes = $ThresholdMiB * 1MB
$ExcludePaths   = @('Voice lines')
$ExcludeFiles   = @('BanditBreakout_hifi.mov')
$WantedExt      = '*.png','*.svg','*.mp3','*.wav','*.mp4'

#--- guard: make sure Mongo tools are available ───────────────────────
foreach ($exe in @('mongosh','mongofiles')) {
  if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) {
    Write-Error "'$exe' not found. Add it to PATH or install MongoDB Database Tools."
    exit 1
  }
}

#--- helper: walk the tree exactly like assets.ps1 did ────────────────
Get-ChildItem $AssetsDir -Recurse -Include $WantedExt |
Where-Object {
  # skip “Voice lines” folder(s)
  ($ExcludePaths | ForEach-Object { $_ }) -notcontains $_.Directory.Name
} | Where-Object {
  # skip explicit files
  ($ExcludeFiles -notcontains $_.Name)
} | ForEach-Object {

  $rel  = $_.FullName.Substring($AssetsDir.Length + 1)
  $size = $_.Length
  $sizeMiB = [Math]::Round($size / 1MB, 2)

  if ($size -gt $ThresholdBytes) {
    Write-Host "🗑️  [GridFS] Deleting $rel"
    & mongofiles --uri "$MongoUri/$Db" `
                 --prefix "$Bucket" `
                 delete $rel | Out-Null
  }
  else {
    Write-Host "🗑️  [Doc]    Deleting $rel"
    & mongosh "$MongoUri/$Db" --quiet -eval @"
db.getCollection("$Coll").deleteOne({ filename: "$rel" });
"@ | Out-Null
  }
}

