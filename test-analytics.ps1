# Quick test of analytics endpoints
$baseUrl = "http://localhost:5000"

Write-Host "`n🧪 Testing Analytics Endpoints..." -ForegroundColor Cyan
Write-Host "=" * 60

# Test Revenue endpoint
Write-Host "`n📊 Testing /api/admin/analytics/revenue" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/analytics/revenue" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..."
} catch {
    Write-Host "❌ Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

# Test Sales by Category endpoint
Write-Host "`n📊 Testing /api/admin/analytics/sales-by-category" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/analytics/sales-by-category" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..."
} catch {
    Write-Host "❌ Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host "`n" + "=" * 60
Write-Host "✅ Test complete!" -ForegroundColor Cyan
