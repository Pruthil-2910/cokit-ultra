const http = require('http');

const PORT = process.env.PORT || 80;

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>cokit-ultra Dashboard</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #10b981; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 14px; }
    .status.online { background: #d1fae5; color: #065f46; }
    .status.offline { background: #fee2e2; color: #991b1b; }
    .metric { font-size: 24px; font-weight: bold; color: #3b82f6; }
  </style>
</head>
<body>
  <h1>🚀 cokit-ultra Dashboard</h1>
  
  <div class="card">
    <h2>Services</h2>
    <p>MCP Server: <span class="status online">Online</span></p>
    <p>FastContext: <span class="status online">Online</span></p>
    <p>Redis: <span class="status online">Online</span></p>
  </div>
  
  <div class="card">
    <h2>Token Savings (Session)</h2>
    <p class="metric">-0 tokens</p>
    <p>$0.0000 saved</p>
  </div>
  
  <div class="card">
    <h2>FastContext Queue</h2>
    <p>Position: 0</p>
    <p>Wait time: 0s</p>
  </div>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
    Dashboard v1.0.0 | <a href="http://localhost:3000/health">FastContext API</a>
  </p>
</body>
</html>
    `);
  } else if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      services: {
        mcp: 'online',
        fastcontext: 'online',
        redis: 'online'
      },
      savings: {
        tokens: 0,
        cost: 0
      },
      queue: {
        position: 0,
        wait_time: 0
      }
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});