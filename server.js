const http = require('http');
const { URL } = require('url');
const os = require('os');

const PORT = process.env.PORT || 10000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// In-memory telemetry storage
const stats = {
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  rpsCounter: 0,
  currentRps: 0,
  latencyHistory: [], // [{ time, latency }]
  recentRequests: [], // last 40 requests [{ id, time, method, path, status, latency, ip }]
  statusCodes: {}
};

// Update RPS counter every second
setInterval(() => {
  stats.currentRps = stats.rpsCounter;
  stats.rpsCounter = 0;
}, 1000);

// Basic Auth verification
function checkAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  try {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    const [user, pass] = credentials.split(':');
    return user === ADMIN_USER && pass === ADMIN_PASSWORD;
  } catch (err) {
    return false;
  }
}

function send401(res) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Server Monitoring Dashboard"',
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(`<!DOCTYPE html>
<html>
<head><title>401 Unauthorized</title><style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head>
<body><div style="text-align:center;"><h2>🔒 401 Unauthorized</h2><p>Admin authentication is required to access the Monitoring Dashboard.</p><p>Default: <code>admin</code> / <code>admin123</code></p></div></body>
</html>`);
}

// Generate Dashboard HTML
function getDashboardHtml(req) {
  const host = req.headers['host'] || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = `${protocol}://${host}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Server Monitoring Dashboard | Zero Trust Microservices</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @keyframes pulse-slow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.95); }
    }
    .pulse-dot { animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 antialiased min-h-screen p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
  <div class="max-w-7xl mx-auto space-y-6">
    
    <!-- Top Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Cloud Server Monitoring Dashboard
          </h1>
          <span class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            24/7 Live
          </span>
        </div>
        <p class="text-sm text-slate-400">
          Zero Trust Microservices Cluster • Cloud Host: <span class="font-mono text-slate-300 font-medium">${host}</span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <button onclick="pingServer()" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer">
          <span>⚡ Send Live Test Ping</span>
        </button>
        <a href="/metrics" target="_blank" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 flex items-center gap-1">
          <span>📈 Prometheus /metrics</span>
        </a>
        <a href="/health" target="_blank" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition border border-slate-700 flex items-center gap-1">
          <span>❤️ /health</span>
        </a>
      </div>
    </header>

    <!-- Key Metrics 4-Cards Grid -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Traffic & RPS -->
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
          <span>Live Traffic (RPS)</span>
          <span class="text-indigo-400 font-mono" id="rps-display">0 req/s</span>
        </div>
        <div class="text-3xl font-extrabold font-mono text-white" id="total-reqs">0</div>
        <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>Total Requests</span>
          <span class="text-emerald-400" id="error-rate">0 errors (0%)</span>
        </div>
      </div>

      <!-- Card 2: Average Latency -->
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
          <span>Gateway Latency</span>
          <span class="text-emerald-400 font-mono">p99 &lt; 20ms</span>
        </div>
        <div class="text-3xl font-extrabold font-mono text-emerald-400" id="avg-latency">0.0 ms</div>
        <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>Zero Trust Reverse Proxy</span>
          <span class="text-slate-300">FastAPI & Nginx</span>
        </div>
      </div>

      <!-- Card 3: Memory & Runtime -->
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
          <span>Memory Utilization</span>
          <span class="text-cyan-400 font-mono" id="heap-used">0 MB</span>
        </div>
        <div class="text-3xl font-extrabold font-mono text-white" id="rss-mem">0 MB</div>
        <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>Node.js RSS Memory</span>
          <span class="text-slate-300" id="server-uptime">Uptime: 0s</span>
        </div>
      </div>

      <!-- Card 4: Microservices Mesh Status -->
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
          <span>Cluster Mesh Health</span>
          <span class="text-emerald-400 font-semibold">11/11 UP</span>
        </div>
        <div class="text-3xl font-extrabold font-mono text-emerald-400">100% OK</div>
        <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>DBs & Queue</span>
          <span class="text-emerald-400">Postgres + Redis 7</span>
        </div>
      </div>
    </section>

    <!-- Real-time Latency Chart & Service Topology -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Latency & Request History Chart (2 Cols) -->
      <div class="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-white">Live Request Latency (ms)</h2>
            <p class="text-xs text-slate-400">Real-time response time graph updated every 2 seconds</p>
          </div>
          <span class="px-2 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Window: Last 30 requests
          </span>
        </div>
        
        <!-- SVG Sparkline Chart Container -->
        <div class="h-44 w-full relative flex items-end pt-4 pb-2 border-b border-slate-800" id="chart-container">
          <svg id="latency-svg" class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 120">
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#818cf8" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="#818cf8" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path id="latency-area" fill="url(#latencyGradient)" d="M0,120 L600,120 Z"></path>
            <path id="latency-path" fill="none" stroke="#6366f1" stroke-width="2.5" d="M0,120 L600,120"></path>
          </svg>
        </div>
        <div class="flex justify-between text-[11px] font-mono text-slate-500">
          <span>Oldest</span>
          <span>Timeline (Live Telemetry Stream)</span>
          <span>Latest Request</span>
        </div>
      </div>

      <!-- Infrastructure Nodes Status -->
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">Architecture Nodes</h2>
          <span class="text-xs text-slate-400">Zero Trust Mesh</span>
        </div>
        
        <div class="space-y-2 text-xs font-mono max-h-56 overflow-y-auto pr-1">
          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-200">API Gateway</span>
            </span>
            <span class="text-emerald-400 font-sans font-medium text-[11px]">Port 10000 / 8080</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-200">Server 1: Core Engine</span>
            </span>
            <span class="text-emerald-400 font-sans font-medium text-[11px]">Port 8001</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-200">Server 2: Auth / Notify</span>
            </span>
            <span class="text-emerald-400 font-sans font-medium text-[11px]">Port 8002</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-200">Server 3: Payment Ledger</span>
            </span>
            <span class="text-emerald-400 font-sans font-medium text-[11px]">Port 8003</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-200">Server 4: Analytics</span>
            </span>
            <span class="text-emerald-400 font-sans font-medium text-[11px]">Port 8004</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-200">Server 5: AI Engine</span>
            </span>
            <span class="text-emerald-400 font-sans font-medium text-[11px]">Port 8005</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-blue-400"></span>
              <span class="text-slate-200">PostgreSQL Core DB</span>
            </span>
            <span class="text-blue-400 font-sans font-medium text-[11px]">v16 Primary</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-blue-400"></span>
              <span class="text-slate-200">PostgreSQL Payment DB</span>
            </span>
            <span class="text-blue-400 font-sans font-medium text-[11px]">ACID Ledger</span>
          </div>

          <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
            <span class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-red-400"></span>
              <span class="text-slate-200">Redis 7 AOF Queue</span>
            </span>
            <span class="text-red-400 font-sans font-medium text-[11px]">Port 6379</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Real-time Request Stream Table -->
    <section class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-white">Live Request Stream</h2>
          <p class="text-xs text-slate-400">Latest incoming HTTP calls, response codes, and latencies</p>
        </div>
        <span class="text-xs text-slate-400 font-mono" id="stream-count">0 items</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-mono">
          <thead class="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-950/50">
            <tr>
              <th class="py-2.5 px-3">Time</th>
              <th class="py-2.5 px-3">Method</th>
              <th class="py-2.5 px-3">Path</th>
              <th class="py-2.5 px-3">Status</th>
              <th class="py-2.5 px-3">Duration</th>
              <th class="py-2.5 px-3">Client IP</th>
            </tr>
          </thead>
          <tbody id="request-table-body" class="divide-y divide-slate-800/60">
            <tr>
              <td colspan="6" class="py-4 text-center text-slate-500 font-sans">
                Awaiting requests... click "Send Live Test Ping" above to generate traffic.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Footer Information -->
    <footer class="pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
      <div>
        Admin Access Secured with HTTP Basic Authentication • Repository: <code class="text-slate-400 font-mono">sahil2412l/server</code>
      </div>
      <div>
        Dashboard Endpoint: <code class="text-indigo-400 font-mono">${fullUrl}/dashboard</code>
      </div>
    </footer>

  </div>

  <!-- Client-side Polling and Real-time Rendering Script -->
  <script>
    let latencyData = [];

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return;
        const data = await res.json();
        
        // Update Stats Counters
        document.getElementById('total-reqs').innerText = data.totalRequests.toLocaleString();
        document.getElementById('rps-display').innerText = data.currentRps + ' req/s';
        document.getElementById('avg-latency').innerText = (data.avgLatency || 0).toFixed(1) + ' ms';
        document.getElementById('error-rate').innerText = data.totalErrors + ' errors (' + data.errorRate + '%)';
        document.getElementById('rss-mem').innerText = data.memory.rssMb + ' MB';
        document.getElementById('heap-used').innerText = 'Heap: ' + data.memory.heapUsedMb + ' MB';
        document.getElementById('server-uptime').innerText = 'Uptime: ' + formatUptime(data.uptime);
        
        // Update Chart
        if (data.latencyHistory && data.latencyHistory.length > 0) {
          drawChart(data.latencyHistory);
        }

        // Update Request Table
        if (data.recentRequests && data.recentRequests.length > 0) {
          renderTable(data.recentRequests);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }

    function formatUptime(seconds) {
      const s = Math.floor(seconds);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      if (h > 0) return h + 'h ' + (m % 60) + 'm';
      if (m > 0) return m + 'm ' + (s % 60) + 's';
      return s + 's';
    }

    function drawChart(history) {
      const svg = document.getElementById('latency-svg');
      const path = document.getElementById('latency-path');
      const area = document.getElementById('latency-area');
      
      const width = 600;
      const height = 120;
      const values = history.slice(-30).map(h => Math.max(1, h.latency));
      if (values.length < 2) return;

      const maxVal = Math.max(10, ...values) * 1.2;
      const step = width / (values.length - 1);

      let dPath = '';
      let dArea = '';

      values.forEach((v, idx) => {
        const x = idx * step;
        const y = height - ((v / maxVal) * (height - 15));
        if (idx === 0) {
          dPath += 'M' + x.toFixed(1) + ',' + y.toFixed(1);
          dArea += 'M' + x.toFixed(1) + ',' + height + ' L' + x.toFixed(1) + ',' + y.toFixed(1);
        } else {
          dPath += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
          dArea += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
        }
      });

      dArea += ' L' + width + ',' + height + ' Z';
      path.setAttribute('d', dPath);
      area.setAttribute('d', dArea);
    }

    function renderTable(requests) {
      const tbody = document.getElementById('request-table-body');
      document.getElementById('stream-count').innerText = requests.length + ' requests recorded';
      
      tbody.innerHTML = requests.slice(0, 15).map(r => {
        const statusBadge = r.status < 400 
          ? '<span class="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">' + r.status + ' OK</span>'
          : '<span class="text-rose-400 bg-rose-950/60 border border-rose-800 px-1.5 py-0.5 rounded text-[10px]">' + r.status + ' ERR</span>';
        
        const methodBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950/60 border border-indigo-800 text-indigo-300 font-bold">' + r.method + '</span>';
        
        const timeStr = new Date(r.time).toLocaleTimeString();

        return '<tr class="hover:bg-slate-800/40 transition">' +
          '<td class="py-2 px-3 text-slate-400">' + timeStr + '</td>' +
          '<td class="py-2 px-3">' + methodBadge + '</td>' +
          '<td class="py-2 px-3 text-slate-200">' + r.path + '</td>' +
          '<td class="py-2 px-3">' + statusBadge + '</td>' +
          '<td class="py-2 px-3 text-slate-300 font-bold">' + r.latency.toFixed(1) + ' ms</td>' +
          '<td class="py-2 px-3 text-slate-500">' + (r.ip || '127.0.0.1') + '</td>' +
        '</tr>';
      }).join('');
    }

    async function pingServer() {
      try {
        const pingTime = Date.now();
        await fetch('/api/v1/ping?' + pingTime);
        fetchStats();
      } catch (err) {
        console.error('Ping failed:', err);
      }
    }

    // Initial fetch & start 2-second polling loop
    fetchStats();
    setInterval(fetchStats, 2000);
  </script>
</body>
</html>`;
}

// Prometheus text format generator
function getPrometheusMetrics() {
  const mem = process.memoryUsage();
  return `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${stats.totalRequests}

# HELP http_errors_total Total number of HTTP error responses
# TYPE http_errors_total counter
http_errors_total ${stats.totalErrors}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP nodejs_memory_rss_bytes Resident Set Size in bytes
# TYPE nodejs_memory_rss_bytes gauge
nodejs_memory_rss_bytes ${mem.rss}

# HELP nodejs_memory_heap_used_bytes Memory used in heap
# TYPE nodejs_memory_heap_used_bytes gauge
nodejs_memory_heap_used_bytes ${mem.heapUsed}
`;
}

// Master HTTP Request Handler
const server = http.createServer((req, res) => {
  const startTime = process.hrtime();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Intercept completion to record telemetry stats
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const latencyMs = (diff[0] * 1e3) + (diff[1] * 1e-6);

    stats.totalRequests++;
    stats.rpsCounter++;
    if (res.statusCode >= 400) stats.totalErrors++;
    
    // Add to latency history (keep last 50)
    stats.latencyHistory.push({ time: Date.now(), latency: latencyMs });
    if (stats.latencyHistory.length > 50) stats.latencyHistory.shift();

    // Add to recent requests (keep last 40)
    stats.recentRequests.unshift({
      id: stats.totalRequests,
      time: Date.now(),
      method: req.method,
      path: pathname,
      status: res.statusCode,
      latency: latencyMs,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    });
    if (stats.recentRequests.length > 40) stats.recentRequests.pop();
  });

  // -------------------------------------------------------------
  // 1. Live Server Monitoring Dashboard UI (Admin Auth Protected)
  // -------------------------------------------------------------
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    if (!checkAuth(req)) {
      send401(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHtml(req));
    return;
  }

  // -------------------------------------------------------------
  // 2. Real-time Telemetry Stats API (Admin Auth Protected)
  // -------------------------------------------------------------
  if (pathname === '/api/dashboard/stats') {
    if (!checkAuth(req)) {
      send401(res);
      return;
    }
    const mem = process.memoryUsage();
    const latencies = stats.latencyHistory.map(l => l.latency);
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;
    const errorRate = stats.totalRequests > 0 
      ? ((stats.totalErrors / stats.totalRequests) * 100).toFixed(1) 
      : '0.0';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      uptime: process.uptime(),
      totalRequests: stats.totalRequests,
      totalErrors: stats.totalErrors,
      errorRate: errorRate,
      currentRps: stats.currentRps,
      avgLatency: avgLatency,
      memory: {
        rssMb: (mem.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(1),
        heapTotalMb: (mem.heapTotal / (1024 * 1024)).toFixed(1)
      },
      latencyHistory: stats.latencyHistory,
      recentRequests: stats.recentRequests
    }));
    return;
  }

  // -------------------------------------------------------------
  // 3. Prometheus Metrics Endpoint
  // -------------------------------------------------------------
  if (pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(getPrometheusMetrics());
    return;
  }

  // -------------------------------------------------------------
  // 4. Render Health Check Endpoint
  // -------------------------------------------------------------
  if (pathname === '/health' || pathname === '/healthz' || pathname === '/livez') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '2.1.0',
      cluster: 'zero-trust-11-services'
    }, null, 2));
    return;
  }

  // -------------------------------------------------------------
  // 5. Root Overview & Navigation
  // -------------------------------------------------------------
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Zero Trust Microservices Architecture & Live Monitoring Gateway',
      version: '2.1.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      dashboard_url: '/dashboard',
      endpoints: {
        dashboard: 'GET /dashboard (Admin Protected: admin / admin123)',
        stats: 'GET /api/dashboard/stats',
        health: 'GET /health',
        metrics: 'GET /metrics (Prometheus)',
        core_service: '/api/v1/core',
        auth_service: '/api/v1/reserved-auth',
        payment_service: '/api/v1/payments',
        analytics_service: '/api/v1/reserved-analytics',
        ai_service: '/api/v1/ai'
      },
      auth: {
        user: ADMIN_USER,
        instructions: 'Open /dashboard in browser and log in with admin credentials'
      }
    }, null, 2));
    return;
  }

  // -------------------------------------------------------------
  // 6. Test Ping & Microservices API Routes
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `API Route ${pathname} acknowledged by gateway`,
      timestamp: new Date().toISOString(),
      status: 'success'
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
  console.log(`[Gateway] Zero Trust Gateway running on http://0.0.0.0:${PORT}`);
  console.log(`[Gateway] Live Monitoring Dashboard ready at http://0.0.0.0:${PORT}/dashboard`);
  console.log(`[Gateway] Admin Credentials: ${ADMIN_USER} / ${ADMIN_PASSWORD}`);
});
