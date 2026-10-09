$port = 8080
$path = $PSScriptRoot

# Determine local IP addresses for mobile access over Wi-Fi
$localIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | 
            Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | 
            Select-Object -ExpandProperty IPAddress

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port 8080 is in use, trying alternative port 8082..." -ForegroundColor Yellow
    $port = 8082
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CHOY APPAREL - INVENTORY MANAGEMENT SYSTEM" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 App running locally on your computer:" -ForegroundColor White
Write-Host "   -> http://localhost:$port" -ForegroundColor Green
Write-Host ""
if ($localIps) {
    Write-Host "📱 To use on your PHONE / TABLET camera on the same Wi-Fi:" -ForegroundColor Yellow
    foreach ($ip in $localIps) {
        Write-Host "   -> Open on your phone: http://${ip}:${port}" -ForegroundColor Yellow
    }
    Write-Host ""
}
Write-Host "💡 FEATURES & MOBILE CAMERA:" -ForegroundColor Cyan
Write-Host "   - Phone Camera: Tap '📷 Camera / Choose Photo' to shoot photos with phone camera"
Write-Host "   - PC Webcam: Supports direct live webcam snapshot or file upload"
Write-Host "   - Auto-compression: Photos are automatically resized to fit LocalStorage smoothly"
Write-Host "   - 100% Offline: No MySQL, no external database required!"
Write-Host ""
Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor Gray
Write-Host "----------------------------------------------------------"

# Launch default browser
Start-Process "http://localhost:$port"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/" -or [string]::IsNullOrWhiteSpace($rawUrl)) {
            $rawUrl = "/index.html"
        }

        $localFilePath = Join-Path $path ($rawUrl.TrimStart('/'))

        if (Test-Path $localFilePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localFilePath).ToLower()
            $mime = $mimeTypes[$ext]
            if (-not $mime) { $mime = "application/octet-stream" }

            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.AddHeader("Cache-Control", "no-cache")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # Loop continues until interrupted
    }
}
