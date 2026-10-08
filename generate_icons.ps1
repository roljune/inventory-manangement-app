Add-Type -AssemblyName System.Drawing

function Generate-InventoryIconPng([string]$outputPath, [int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Rounded rectangle background gradient (Teal to Emerald)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(15, 118, 110), [System.Drawing.Color]::FromArgb(13, 148, 136), 45.0)
    $g.FillRectangle($brush, $rect)

    # Accent ring
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), [float]($size * 0.03))
    $inset = [int]($size * 0.06)
    $g.DrawEllipse($pen, $inset, $inset, $size - ($inset * 2), $size - ($inset * 2))

    # Icon Center: Package + Camera text / Monogram
    $fontSize = [float]($size * 0.28)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    # Draw "INV" center
    $textRect = New-Object System.Drawing.RectangleF(0, [float]($size * 0.12), [float]$size, [float]($size * 0.5))
    $g.DrawString("INV", $font, $textBrush, $textRect, $sf)

    # Subtitle "STOCK & CAM"
    $subFont = New-Object System.Drawing.Font("Arial", [float]($size * 0.075), [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(204, 251, 241))
    $subRect = New-Object System.Drawing.RectangleF(0, [float]($size * 0.68), [float]$size, [float]($size * 0.2))
    $g.DrawString("INVENTORY", $subFont, $subBrush, $subRect, $sf)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $outputPath ($size x $size)"
}

Generate-InventoryIconPng "C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app\icons\icon-192.png" 192
Generate-InventoryIconPng "C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app\icons\icon-512.png" 512
