# End-to-end API test of the order flow (Windows PowerShell)
# Run from the server folder while "npm run dev" is running:
#   powershell -ExecutionPolicy Bypass -File scripts\test-order-flow.ps1

$ErrorActionPreference = "Stop"
$api = "http://localhost:5000/api"

function Call($method, $path, $token, $body) {
  $params = @{ Uri = "$api$path"; Method = $method; ContentType = "application/json" }
  if ($token) { $params.Headers = @{ Authorization = "Bearer $token" } }
  if ($body)  { $params.Body = ($body | ConvertTo-Json -Depth 10) }
  try { return Invoke-RestMethod @params }
  catch {
    $msg = $_.ErrorDetails.Message
    Write-Host "  FAILED $method $path -> $msg" -ForegroundColor Red
    throw
  }
}
function Step($text) { Write-Host "`n== $text" -ForegroundColor Cyan }

$userEmail  = Read-Host "Customer email (verified account)"
$userPass   = Read-Host "Customer password"
$adminEmail = Read-Host "Admin email"
$adminPass  = Read-Host "Admin password" -AsSecureString
$adminPass  = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPass))

Step "1. Customer login"
$user = Call Post "/auth/login" $null @{ email = $userEmail; password = $userPass }
Write-Host "  Logged in as $($user.user.name) ($($user.user.role))"

Step "2. Pizza varieties"
$pizzas = Call Get "/pizzas" $user.token
$pizzas.pizzas | ForEach-Object { Write-Host "  - $($_.name): Rs $($_.basePrice)" }

Step "3. Builder options"
$opt = (Call Get "/inventory/options" $user.token).options
$items = @{
  base    = $opt.base[0].id
  sauce   = $opt.sauce[0].id
  cheese  = $opt.cheese[0].id
  veggies = @($opt.veggie[0].id, $opt.veggie[1].id)
}
Write-Host "  Base: $($opt.base[0].name) | Sauce: $($opt.sauce[0].name) | Cheese: $($opt.cheese[0].name) | Veggies: $($opt.veggie[0].name), $($opt.veggie[1].name)"

Step "4. Quote (price calculated by the server)"
$quote = Call Post "/orders/quote" $user.token @{ items = $items }
Write-Host "  Total: Rs $($quote.total)"

Step "5. Checkout + failed payment (should be rejected)"
$co = Call Post "/orders/checkout" $user.token @{ items = $items }
try { Call Post "/orders/mock-pay" $user.token @{ gatewayOrderId = $co.gateway.orderId; outcome = "failure" } | Out-Null }
catch { Write-Host "  OK: failure was rejected as expected" -ForegroundColor Green }

Step "6. Checkout + successful payment"
$co = Call Post "/orders/checkout" $user.token @{ items = $items }
Write-Host "  Gateway order: $($co.gateway.orderId) ($($co.gateway.provider))"
$pay = Call Post "/orders/mock-pay" $user.token @{ gatewayOrderId = $co.gateway.orderId; outcome = "success" }
$ver = Call Post "/orders/verify" $user.token @{ gatewayOrderId = $co.gateway.orderId; paymentId = $pay.paymentId; signature = $pay.signature }
$orderId = $ver.order._id
Write-Host "  $($ver.message) | order $orderId | status: $($ver.order.status)"

Step "7. Tampered signature (should be rejected)"
$co2 = Call Post "/orders/checkout" $user.token @{ items = $items }
try { Call Post "/orders/verify" $user.token @{ gatewayOrderId = $co2.gateway.orderId; paymentId = "pay_fake"; signature = "fake" } | Out-Null }
catch { Write-Host "  OK: fake signature was rejected" -ForegroundColor Green }

Step "8. Admin login + inventory after the order"
$admin = Call Post "/admin/login" $null @{ email = $adminEmail; password = $adminPass }
$inv = (Call Get "/admin/inventory" $admin.token).items
$inv | Where-Object { $_._id -in @($items.base, $items.sauce, $items.cheese) + $items.veggies } |
  ForEach-Object { Write-Host "  - $($_.name): $($_.quantity) left" }

Step "9. Admin moves the order: kitchen -> delivery"
$o = Call Patch "/admin/orders/$orderId/status" $admin.token @{ status = "kitchen" }
Write-Host "  Status: $($o.order.status)"
$o = Call Patch "/admin/orders/$orderId/status" $admin.token @{ status = "delivery" }
Write-Host "  Status: $($o.order.status)"

Step "10. Customer sees the final status"
$mine = (Call Get "/orders/my" $user.token).orders | Where-Object { $_._id -eq $orderId }
Write-Host "  Order $orderId -> $($mine.status) (history: $(($mine.statusHistory | ForEach-Object status) -join ' > '))"

Write-Host "`nAll steps passed" -ForegroundColor Green
