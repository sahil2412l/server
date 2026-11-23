const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint for Render / Gateway
  if (pathname === '/health' || pathname === '/healthz' || pathname === '/livez') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production'
    }, null, 2));
    return;
  }

  // Root endpoint
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Zero Trust Microservices Architecture API Gateway',
      version: '2.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        core_service: '/api/v1/core',
        auth_service: '/api/v1/auth',
        payment_service: '/api/v1/payment',
        analytics_service: '/api/v1/analytics',
        ai_service: '/api/v1/ai'
      },
      infrastructure: {
        gateway: 'Active',
        database_core: 'PostgreSQL 16',
        database_ledger: 'PostgreSQL 16 (ACID)',
        cache_queue: 'Redis 7',
        monitoring: 'Prometheus & Grafana'
      }
    }, null, 2));
    return;
  }

  // API endpoints routing preview
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `API Route ${pathname} acknowledged by gateway`,
      status: 'ready',
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not Found',
    path: pathname,
    timestamp: new Date().toISOString()
  }, null, 2));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Gateway] Server listening on 0.0.0.0:${PORT}`);
  console.log(`[Gateway] Health check ready at http://0.0.0.0:${PORT}/health`);
});
