# OpsDental — Inicio de N8N con variables de entorno configuradas
# Ejecutar desde esta carpeta: .\start-n8n.ps1

$env:OPSDENTAL_API_URL      = "http://localhost:8000"
$env:OPSDENTAL_N8N_TOKEN    = "opsdental_n8n_2026"
$env:WA_PHONE_NUMBER_ID     = "1238253316039413"
$env:WA_TOKEN               = "EAA9FgBwdXPwBSN6eeqdDj5V9d3nzFYSjpPFPoZBOUKoufoh6oeI5Gqtsk2qXxzJDYeKAhjqKwKsyD4XvaWVkQFHRj6Jm1GJclv4PjYOPhICdoPTeUaT4fHl9yAXqZBWWTlFkTENkxzlFiQiXEb2xaai4oi2uId10d4ZChOf9U2jAagc8mZA6kojirFCYM1ZCknpDCAYAIh0uwZBqLzgv18fQuGvLGFAeSTZAS5pypbkZAHk4uu81gbg8cNjzELHMeCab3Q8AYxvPZCajWN9fT0gLkU4LqQgZDZD"

Write-Host "Variables configuradas:" -ForegroundColor Cyan
Write-Host "  OPSDENTAL_API_URL   = $env:OPSDENTAL_API_URL"
Write-Host "  OPSDENTAL_N8N_TOKEN = $env:OPSDENTAL_N8N_TOKEN"
Write-Host "  WA_PHONE_NUMBER_ID  = $env:WA_PHONE_NUMBER_ID"
Write-Host "  WA_TOKEN            = $($env:WA_TOKEN.Substring(0,20))..."
Write-Host ""
Write-Host "Iniciando N8N en http://localhost:5678 ..." -ForegroundColor Green

npx n8n start
