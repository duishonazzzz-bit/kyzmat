Set-Location 'C:\Users\Janbolot\Desktop\Кызмат'
$env:PORT = '4001'
$env:CLIENT_URL = 'http://localhost:5174'
npm --workspace apps/api run dev *>> '.\logs\api-dev.log'
