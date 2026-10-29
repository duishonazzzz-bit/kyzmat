Set-Location 'C:\Users\Janbolot\Desktop\Кызмат'
$env:VITE_API_URL = 'http://localhost:4001'
npm --workspace apps/web run dev -- --port 5174 *>> '.\logs\web-dev.log'
