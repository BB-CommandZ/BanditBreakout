<#
  Save as   assets.ps1
  Usage:    .\assets.ps1 -AssetsDir .\game\art
#>
param(
  [Parameter(Mandatory)] [string]$AssetsDir,
  [string]$MongoUri       = 'mongodb://localhost:27017',
  [string]$Db             = 'game_assets',
  [string]$Coll           = 'assets',
  [string]$Bucket         = 'assets_fs',
  [int]   $ThresholdMiB   = 16
)

$ThresholdBytes = $ThresholdMiB * 1MB
$Exclude        = @('Voice lines', 'BanditBreakout_hifi.mov')
$Ext            = '*.png','*.svg','*.mp3','*.wav','*.mp4'

Get-ChildItem $AssetsDir -Recurse -Include $Ext |
Where-Object {
    ($_.FullName -notmatch ($Exclude -join '|'))
} | ForEach-Object {
    $rel      = $_.FullName.Substring($AssetsDir.Length + 1)
    $sizeMiB  = [Math]::Round($_.Length / 1MB, 2)
    if ($_.Length -gt $ThresholdBytes) {
        Write-Host "🎥 [GridFS] $rel  ($sizeMiB MiB)"
        & mongofiles --uri="$MongoUri/$Db" --prefix="$Bucket" put $rel `
                     --local $_.FullName --replace
    } else {
        Write-Host "📄 [Doc]    $rel  ($sizeMiB MiB)"
        & mongosh "$MongoUri/$Db" --quiet -eval @"
const fs = require('fs');
const buf = fs.readFileSync("$($_.FullName -replace '\\','/')");
db.getSiblingDB("$Db").getCollection("$Coll").insertOne({
  filename: "$rel",
  data: new BinData(0, buf.toString('base64')),
  contentType: "$($_.PSISitem.ContentType)",
  size: buf.length,
  uploadedAt: new Date()
});
"@
    }
}

