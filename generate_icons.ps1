Add-Type -AssemblyName System.Drawing

function Resize-Icon([string]$srcPath, [string]$destPath, [int]$size) {
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $srcImg.Dispose()
    Write-Host "Created $destPath ($size x $size)"
}

$source = "C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app\assets\choy-apparel-bg.jpg"
Resize-Icon $source "C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app\icons\icon-192.png" 192
Resize-Icon $source "C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app\icons\icon-512.png" 512
