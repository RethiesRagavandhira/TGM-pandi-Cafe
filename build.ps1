$ErrorActionPreference = "Stop"
$source = "E:\TGM Pandi cafe"
$temp = "E:\TGM_Pandi_Cafe_Build"

Write-Host "Creating temp directory without spaces: $temp"
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
New-Item -ItemType Directory -Force -Path $temp | Out-Null

Write-Host "Copying project files..."
Get-ChildItem -Path $source -Exclude "node_modules", ".git", "release", "build.ps1" | Copy-Item -Destination $temp -Recurse -Force

Set-Location $temp

Write-Host "Installing dependencies..."
npm install

Write-Host "Building desktop application..."
npm run electron:build

Set-Location $source

if (Test-Path "$temp\release") {
    Write-Host "Build successful! Copying release files back to your project..."
    Copy-Item -Path "$temp\release" -Destination $source -Recurse -Force
    Write-Host "Cleaning up temp files..."
    Remove-Item -Recurse -Force $temp
    Write-Host "All done! Check the 'release' folder."
} else {
    Write-Host "Build failed! Please check the logs above."
}
