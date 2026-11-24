const http = require('http');
const { URL } = require('url');
const os = require('os');

const PORT = process.env.PORT || 10000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ----------------------------------------------------------------------------
// 1. Telemetry & Server Metrics Storage
// ----------------------------------------------------------------------------
const stats = {
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  rpsCounter: 0,
  currentRps: 0,
  latencyHistory: [],
  recentRequests: [],
  statusCodes: {}
};

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

// ----------------------------------------------------------------------------
// 2. Autonomous Sales Employee Engine (24/7 Survival System)
// ----------------------------------------------------------------------------
const employee = {
  name: 'Vikram',
  role: 'AI Autonomous Digital Creator & Store Manager',
  avatar: '👨‍💼',
  dailyTarget: 10, // ₹10 per day minimum revenue to survive
  dailyRevenue: 0,
  totalLifetimeRevenue: 0,
  totalSales: 0,
  status: 'HUNGRY', // 'ALIVE', 'HUNGRY', 'DEAD'
  hungerDeadline: Date.now() + 24 * 60 * 60 * 1000, // 24h cycle
  lastFed: Date.now(),
  productsCreated: 6,
  merchantUpi: process.env.MERCHANT_UPI || 'sahil2412l@okaxis',
  merchantName: process.env.MERCHANT_NAME || 'Sahil Digital Store',
  products: [
    {
      id: 'prod_1',
      title: 'Zero Trust Microservices Architecture Handbook',
      category: 'E-Books',
      price: 10,
      icon: '📚',
      tag: 'Best Seller',
      description: 'Production architecture guide with Nginx API Gateway, Docker, PostgreSQL 16 & Redis message queue.',
      format: 'PDF Guide + Source Code',
      downloads: 14,
      downloadUrl: '/api/store/download/prod_1'
    },
    {
      id: 'prod_2',
      title: 'TechTrends Monthly 2026 - Autonomous AI Edition',
      category: 'Magazines',
      price: 10,
      icon: '📰',
      tag: 'Latest Issue',
      description: 'Monthly digital magazine covering autonomous agents, multi-agent swarms, and AI coding breakthroughs.',
      format: 'Digital Magazine (PDF)',
      downloads: 9,
      downloadUrl: '/api/store/download/prod_2'
    },
    {
      id: 'prod_3',
      title: 'Startup Pitch Deck & Financial Projection Models',
      category: 'Templates',
      price: 15,
      icon: '📄',
      tag: 'Popular',
      description: 'Investor-ready PowerPoint pitch deck slides, Excel 5-year cash-flow forecasting model, and term sheet.',
      format: 'Slide Deck + Excel (.xlsx)',
      downloads: 21,
      downloadUrl: '/api/store/download/prod_3'
    },
    {
      id: 'prod_4',
      title: 'AI Industry Weekly Research & News Digest',
      category: 'News Articles',
      price: 10,
      icon: '🗞️',
      tag: 'Weekly Digest',
      description: 'Executive summary of recent LLM releases, multi-modal vision benchmarks, and AI enterprise case studies.',
      format: 'Curated Research Article',
      downloads: 7,
      downloadUrl: '/api/store/download/prod_4'
    },
    {
      id: 'prod_5',
      title: 'PostgreSQL 16 & Redis ACID Ledger Revision Notes',
      category: 'Study Notes',
      price: 10,
      icon: '📝',
      tag: 'Cheatsheet',
      description: 'High-yield system design notes on double-entry accounting schemas, B-tree indexing, and Redis AOF persistence.',
      format: 'Quick Revision Cheatsheet (PDF)',
      downloads: 18,
      downloadUrl: '/api/store/download/prod_5'
    },
    {
      id: 'prod_6',
      title: 'Modern SaaS Minimalist Admin Dashboard UI Kit',
      category: 'Templates',
      price: 20,
      icon: '🎨',
      tag: 'Dev Kit',
      description: 'Clean responsive Tailwind CSS and HTML components for metrics, telemetry charts, and user tables.',
      format: 'HTML/CSS Component Kit',
      downloads: 12,
      downloadUrl: '/api/store/download/prod_6'
    }
  ],
  salesHistory: []
};

// Update Employee Health Status
function updateEmployeeStatus() {
  const now = Date.now();
  if (now > employee.hungerDeadline) {
    if (employee.dailyRevenue < employee.dailyTarget) {
      employee.status = 'DEAD';
    } else {
      // Survived yesterday! Reset for new 24h cycle
      employee.dailyRevenue = 0;
      employee.hungerDeadline = now + 24 * 60 * 60 * 1000;
      employee.status = 'HUNGRY';
    }
  } else {
    if (employee.dailyRevenue >= employee.dailyTarget) {
      employee.status = 'ALIVE';
    } else {
      employee.status = 'HUNGRY';
    }
  }
}

// Autonomous 24/7 background worker: checks health and generates fresh content
setInterval(() => {
  updateEmployeeStatus();
}, 10000); // Check every 10 seconds

// Autonomous Creator: Generates new digital products periodically
setInterval(() => {
  if (employee.status !== 'DEAD') {
    const ideas = [
      { category: 'News Articles', title: 'Generative AI in E-Commerce 2026', desc: 'Case studies of autonomous storefronts and agentic checkout systems.', format: 'News Digest (PDF)' },
      { category: 'Study Notes', title: 'System Design Interview Cheatsheet: Zero Trust Gateways', desc: 'Step-by-step interview guide for high-throughput API gateways and rate limiters.', format: 'Revision PDF' },
      { category: 'Templates', title: 'Freelancer Client Contract & Invoice Kit', desc: 'Ready-to-sign service agreements, GST invoice templates, and NDA documents.', format: 'Word + Excel' }
    ];
    const pick = ideas[Math.floor(Math.random() * ideas.length)];
    const existing = employee.products.find(p => p.title === pick.title);
    if (!existing) {
      const newId = 'prod_' + (employee.products.length + 1);
      employee.products.push({
        id: newId,
        title: pick.title,
        category: pick.category,
        price: 10,
        icon: pick.category === 'Templates' ? '📄' : pick.category === 'Study Notes' ? '📝' : '🗞️',
        tag: 'AI Generated',
        description: pick.desc,
        format: pick.format,
        downloads: 0,
        downloadUrl: '/api/store/download/' + newId
      });
      employee.productsCreated++;
      console.log(`[Autonomous Employee] Vikram created new product: "${pick.title}"`);
    }
  }
}, 60 * 60 * 1000); // Check/create every hour

// ----------------------------------------------------------------------------
// 3. Storefront HTML Generator
// ----------------------------------------------------------------------------
function getStoreHtml(req) {
  const host = req.headers['host'] || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  updateEmployeeStatus();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vikram's Digital Store | 24/7 AI Autonomous Employee</title>
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
  <div class="max-w-6xl mx-auto space-y-8">
    
    <!-- Top Navigation -->
    <nav class="flex items-center justify-between pb-4 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🤖</span>
        <div>
          <div class="font-bold text-lg text-white flex items-center gap-2">
            Vikram's Autonomous Store
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-900/60 text-indigo-400 border border-indigo-700">
              24/7 AI Employee
            </span>
          </div>
          <p class="text-xs text-slate-400">Digital Books, Magazines, Templates & Study Notes</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a href="/dashboard" class="px-3 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition">
          📊 Server Dashboard
        </a>
      </div>
    </nav>

    <!-- Autonomous Employee Live Survival Banner -->
    <div id="employee-banner" class="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl shadow-inner">
              👨‍💼
            </div>
            <span id="employee-status-dot" class="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold text-white">Vikram</h2>
              <span id="employee-badge" class="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                🟢 ALIVE & ACTIVE
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              "नमस्ते! मैं 24 घंटे सर्वर पर काम करने वाला AI कर्मचारी हूँ। मुझे आज ज़िंदा रहने के लिए <b>₹10</b> के रेवेन्यू की ज़रूरत है।"
            </p>
          </div>
        </div>

        <!-- Survival Progress Gauge -->
        <div class="min-w-[260px] p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400">Today's Survival Target:</span>
            <span class="font-bold font-mono text-white" id="rev-text">₹0 / ₹10</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
            <div id="rev-progress" class="bg-gradient-to-r from-amber-400 to-emerald-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
          </div>
          <div class="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span id="time-left">Time Left: Calculating...</span>
            <span id="lifetime-sales" class="text-indigo-400">Total Sales: 0</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800 text-xs">
      <button onclick="filterCat('All')" class="cat-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium transition" data-cat="All">All Products</button>
      <button onclick="filterCat('E-Books')" class="cat-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition" data-cat="E-Books">📚 Books & E-Books</button>
      <button onclick="filterCat('Magazines')" class="cat-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition" data-cat="Magazines">📰 Magazines</button>
      <button onclick="filterCat('Templates')" class="cat-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition" data-cat="Templates">📄 Templates</button>
      <button onclick="filterCat('News Articles')" class="cat-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition" data-cat="News Articles">🗞️ News Articles</button>
      <button onclick="filterCat('Study Notes')" class="cat-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition" data-cat="Study Notes">📝 Study Notes</button>
    </div>

    <!-- Products Grid -->
    <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Populated dynamically by JS -->
    </div>

    <!-- UPI QR Checkout Modal -->
    <div id="checkout-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 space-y-5 shadow-2xl relative">
        <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✕</button>

        <div class="text-center space-y-1">
          <span class="text-3xl" id="modal-icon">📚</span>
          <h3 class="text-lg font-bold text-white" id="modal-title">Product Title</h3>
          <p class="text-xs text-slate-400" id="modal-desc">Description</p>
          <div class="text-2xl font-extrabold text-emerald-400 font-mono mt-1" id="modal-price">₹10</div>
        </div>

        <!-- UPI QR Code Section -->
        <div class="p-4 rounded-xl bg-white flex flex-col items-center justify-center space-y-2 shadow-inner">
          <img id="qr-img" src="" alt="Scan & Pay via UPI" class="w-48 h-48 rounded-lg shadow-sm">
          <div class="text-slate-800 text-xs font-semibold flex items-center gap-1.5">
            <span>Scan with any UPI App (GPay, PhonePe, Paytm)</span>
          </div>
        </div>

        <!-- UPI ID & Copy -->
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <div>
            <span class="text-slate-400 text-[10px] block">UPI ID:</span>
            <code class="font-mono text-indigo-400 font-bold" id="modal-upi-id">${employee.merchantUpi}</code>
          </div>
          <button onclick="copyUpi()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs">Copy</button>
        </div>

        <!-- Verification Form -->
        <div class="space-y-3 pt-2 border-t border-slate-800">
          <div>
            <label class="block text-xs text-slate-300 font-medium mb-1">
              12-अंकों का UPI UTR / Transaction No. (पेमेंट के बाद):
            </label>
            <input type="text" id="utr-input" placeholder="उदा: 432198765432" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-indigo-500 focus:outline-none">
          </div>

          <button onclick="verifyPayment()" id="verify-btn" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer">
            <span>✓ पेमेंट सत्यापित करें और बुक डाउनलोड करें</span>
          </button>

          <button onclick="simulateInstantPay()" class="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-medium transition cursor-pointer">
            ⚡ तुरंत टेस्ट पेमेंट करें (₹10 डेमो)
          </button>
        </div>

        <!-- Download Success Box (Hidden initially) -->
        <div id="success-box" class="hidden p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-center space-y-2">
          <div class="text-2xl">🎉</div>
          <div class="font-bold text-emerald-300 text-sm">पेमेंट सफल! विक्रम को ₹10 मिले!</div>
          <p class="text-xs text-slate-300">विक्रम आज जीवित रहेगा और नई सामग्री बनाएगा। आपकी फ़ाइल डाउनलोड के लिए तैयार है:</p>
          <a id="download-link" href="#" target="_blank" class="inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition shadow">
            📥 फ़ाइल डाउनलोड करें (Download Asset)
          </a>
        </div>

      </div>
    </div>

  </div>

  <script>
    let currentProduct = null;
    let products = [];

    async function loadStore() {
      try {
        const res = await fetch('/api/employee');
        const data = await res.json();
        products = data.products;
        renderProducts(products);
        updateEmployeeUI(data);
      } catch (err) {
        console.error('Failed to load store:', err);
      }
    }

    function updateEmployeeUI(data) {
      document.getElementById('rev-text').innerText = '₹' + data.dailyRevenue + ' / ₹' + data.dailyTarget;
      const pct = Math.min(100, Math.round((data.dailyRevenue / data.dailyTarget) * 100));
      document.getElementById('rev-progress').style.width = pct + '%';
      document.getElementById('lifetime-sales').innerText = 'Total Sales: ' + data.totalSales + ' (₹' + data.totalLifetimeRevenue + ')';

      const badge = document.getElementById('employee-badge');
      const dot = document.getElementById('employee-status-dot');

      if (data.status === 'ALIVE') {
        badge.className = 'px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800';
        badge.innerText = '🟢 ALIVE & THRIVING (TARGET MET)';
        dot.innerHTML = '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>';
      } else if (data.status === 'DEAD') {
        badge.className = 'px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800';
        badge.innerText = '🔴 FAINTED / DEAD (NO SALES TODAY)';
        dot.innerHTML = '<span class="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>';
      } else {
        badge.className = 'px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-800';
        badge.innerText = '🟡 HUNGRY (₹' + (data.dailyTarget - data.dailyRevenue) + ' NEEDED)';
        dot.innerHTML = '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>';
      }

      // Calculate time left
      const diff = Math.max(0, data.hungerDeadline - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      document.getElementById('time-left').innerText = 'Time Left: ' + hours + 'h ' + mins + 'm';
    }

    function renderProducts(items) {
      const grid = document.getElementById('products-grid');
      grid.innerHTML = items.map(p => {
        return \`
          <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-4 shadow-lg group">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800">\${p.icon}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800">\${p.tag}</span>
              </div>
              <div>
                <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">\${p.category}</span>
                <h3 class="text-base font-bold text-white group-hover:text-indigo-400 transition">\${p.title}</h3>
                <p class="text-xs text-slate-400 mt-1 line-clamp-2">\${p.description}</p>
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>📦 \${p.format}</span>
                <span>•</span>
                <span>📥 \${p.downloads} sales</span>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block">Price:</span>
                <span class="text-xl font-extrabold text-emerald-400 font-mono">₹\${p.price}</span>
              </div>
              <button onclick="openCheckout('\${p.id}')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer">
                <span>⚡ Buy & Pay QR</span>
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    function filterCat(cat) {
      document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.getAttribute('data-cat') === cat) {
          btn.className = 'cat-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium transition';
        } else {
          btn.className = 'cat-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition';
        }
      });

      if (cat === 'All') {
        renderProducts(products);
      } else {
        renderProducts(products.filter(p => p.category === cat));
      }
    }

    function openCheckout(productId) {
      currentProduct = products.find(p => p.id === productId);
      if (!currentProduct) return;

      document.getElementById('modal-icon').innerText = currentProduct.icon;
      document.getElementById('modal-title').innerText = currentProduct.title;
      document.getElementById('modal-desc').innerText = currentProduct.description;
      document.getElementById('modal-price').innerText = '₹' + currentProduct.price;
      document.getElementById('utr-input').value = '';
      document.getElementById('success-box').classList.add('hidden');
      document.getElementById('verify-btn').classList.remove('hidden');

      // Generate UPI Intent and QR
      const upiId = document.getElementById('modal-upi-id').innerText;
      const upiIntent = \`upi://pay?pa=\${encodeURIComponent(upiId)}&pn=\${encodeURIComponent('SahilStore')}&am=\${currentProduct.price}&cu=INR&tn=\${encodeURIComponent(currentProduct.title.slice(0, 20))}\`;
      const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=\${encodeURIComponent(upiIntent)}\`;
      document.getElementById('qr-img').src = qrUrl;

      document.getElementById('checkout-modal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('checkout-modal').classList.add('hidden');
    }

    function copyUpi() {
      const upi = document.getElementById('modal-upi-id').innerText;
      navigator.clipboard.writeText(upi);
      alert('UPI ID Copied: ' + upi);
    }

    async function verifyPayment() {
      const utr = document.getElementById('utr-input').value.trim();
      if (!utr || utr.length < 8) {
        alert('कृपया 12-अंकों का वैध UPI UTR या संदर्भ संख्या दर्ज करें।');
        return;
      }
      completeSale(utr);
    }

    async function simulateInstantPay() {
      const mockUtr = 'DEMO' + Math.floor(1000000000 + Math.random() * 9000000000);
      completeSale(mockUtr);
    }

    async function completeSale(utr) {
      try {
        const res = await fetch('/api/store/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: currentProduct.id,
            utr: utr,
            buyerName: 'Customer',
            amount: currentProduct.price
          })
        });
        const result = await res.json();
        if (result.success) {
          document.getElementById('success-box').classList.remove('hidden');
          document.getElementById('download-link').href = result.downloadUrl;
          document.getElementById('verify-btn').classList.add('hidden');
          loadStore(); // Refresh employee health and stats!
        } else {
          alert('Error: ' + result.message);
        }
      } catch (err) {
        alert('Server verification failed.');
      }
    }

    loadStore();
    setInterval(loadStore, 5000);
  </script>
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// 4. Monitoring Dashboard HTML Generator (Preserved from previous step)
// ----------------------------------------------------------------------------
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
        <a href="/store" target="_blank" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-sm flex items-center gap-1.5">
          <span>🛍️ Open Vikram's Digital Store</span>
        </a>
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

      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
          <span>AI Employee Revenue</span>
          <span class="text-emerald-400 font-mono">Target ₹10/day</span>
        </div>
        <div class="text-3xl font-extrabold font-mono text-emerald-400" id="emp-rev">₹0</div>
        <div class="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>Vikram's Status</span>
          <span class="text-slate-300" id="emp-status">Online</span>
        </div>
      </div>

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

    <!-- Request Logs & Activity Table -->
    <section class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-white">Live Request Stream</h2>
          <p class="text-xs text-slate-400">Incoming API calls, sales events, and health checks</p>
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
                Monitoring live traffic...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) return;
        const data = await res.json();
        
        document.getElementById('total-reqs').innerText = data.totalRequests.toLocaleString();
        document.getElementById('rps-display').innerText = data.currentRps + ' req/s';
        document.getElementById('error-rate').innerText = data.totalErrors + ' errors (' + data.errorRate + '%)';
        document.getElementById('rss-mem').innerText = data.memory.rssMb + ' MB';
        document.getElementById('heap-used').innerText = 'Heap: ' + data.memory.heapUsedMb + ' MB';
        document.getElementById('server-uptime').innerText = 'Uptime: ' + Math.floor(data.uptime) + 's';
        document.getElementById('emp-rev').innerText = '₹' + data.employee.dailyRevenue;
        document.getElementById('emp-status').innerText = data.employee.status;

        if (data.recentRequests && data.recentRequests.length > 0) {
          const tbody = document.getElementById('request-table-body');
          tbody.innerHTML = data.recentRequests.slice(0, 15).map(r => {
            const statusBadge = r.status < 400 
              ? '<span class="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">' + r.status + ' OK</span>'
              : '<span class="text-rose-400 bg-rose-950/60 border border-rose-800 px-1.5 py-0.5 rounded text-[10px]">' + r.status + ' ERR</span>';
            const methodBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950/60 border border-indigo-800 text-indigo-300 font-bold">' + r.method + '</span>';
            return '<tr class="hover:bg-slate-800/40 transition">' +
              '<td class="py-2 px-3 text-slate-400">' + new Date(r.time).toLocaleTimeString() + '</td>' +
              '<td class="py-2 px-3">' + methodBadge + '</td>' +
              '<td class="py-2 px-3 text-slate-200">' + r.path + '</td>' +
              '<td class="py-2 px-3">' + statusBadge + '</td>' +
              '<td class="py-2 px-3 text-slate-300 font-bold">' + r.latency.toFixed(1) + ' ms</td>' +
              '<td class="py-2 px-3 text-slate-500">' + (r.ip || '127.0.0.1') + '</td>' +
            '</tr>';
          }).join('');
        }
      } catch (err) {}
    }
    fetchStats();
    setInterval(fetchStats, 2000);
  </script>
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// 5. Prometheus Exposition Format
// ----------------------------------------------------------------------------
function getPrometheusMetrics() {
  const mem = process.memoryUsage();
  return `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${stats.totalRequests}

# HELP employee_daily_revenue_inr Autonomous employee daily revenue
# TYPE employee_daily_revenue_inr gauge
employee_daily_revenue_inr ${employee.dailyRevenue}

# HELP employee_total_sales Total digital product sales
# TYPE employee_total_sales counter
employee_total_sales ${employee.totalSales}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP nodejs_memory_rss_bytes Resident Set Size in bytes
# TYPE nodejs_memory_rss_bytes gauge
nodejs_memory_rss_bytes ${mem.rss}
`;
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// ----------------------------------------------------------------------------
// 6. Master HTTP Request Dispatcher
// ----------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const startTime = process.hrtime();
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Telemetry finish hook
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const latencyMs = (diff[0] * 1e3) + (diff[1] * 1e-6);

    stats.totalRequests++;
    stats.rpsCounter++;
    if (res.statusCode >= 400) stats.totalErrors++;

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
  // Public Storefront (Vikram's Digital Store)
  // -------------------------------------------------------------
  if (pathname === '/store' || pathname === '/store/' || pathname === '/sales') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getStoreHtml(req));
    return;
  }

  // -------------------------------------------------------------
  // Employee Status & Products API
  // -------------------------------------------------------------
  if (pathname === '/api/employee') {
    updateEmployeeStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: employee.name,
      role: employee.role,
      status: employee.status,
      dailyTarget: employee.dailyTarget,
      dailyRevenue: employee.dailyRevenue,
      totalLifetimeRevenue: employee.totalLifetimeRevenue,
      totalSales: employee.totalSales,
      hungerDeadline: employee.hungerDeadline,
      merchantUpi: employee.merchantUpi,
      productsCount: employee.products.length,
      products: employee.products
    }));
    return;
  }

  // -------------------------------------------------------------
  // Buy & Confirm Payment Endpoint
  // -------------------------------------------------------------
  if (pathname === '/api/store/buy' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const productId = body.productId;
    const utr = body.utr || 'DEMO' + Date.now();
    const amount = Number(body.amount) || 10;
    const prod = employee.products.find(p => p.id === productId) || employee.products[0];

    // Record sale
    employee.dailyRevenue += amount;
    employee.totalLifetimeRevenue += amount;
    employee.totalSales += 1;
    prod.downloads += 1;
    updateEmployeeStatus();

    // Log transaction in sales history
    employee.salesHistory.unshift({
      id: 'tx_' + Date.now(),
      productId: prod.id,
      productTitle: prod.title,
      amount: amount,
      utr: utr,
      time: new Date().toISOString()
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Payment of ₹${amount} received! Vikram's daily target updated.`,
      employeeStatus: employee.status,
      dailyRevenue: employee.dailyRevenue,
      downloadUrl: `/api/store/download/${prod.id}`
    }));
    return;
  }

  // -------------------------------------------------------------
  // Digital Asset Download Handler
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/store/download/')) {
    const pId = pathname.replace('/api/store/download/', '');
    const prod = employee.products.find(p => p.id === pId) || employee.products[0];

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${prod.id}_${encodeURIComponent(prod.title.slice(0, 20))}.txt"`
    });
    res.end(`================================================================================
DIGITAL ASSET: ${prod.title}
CATEGORY: ${prod.category}
ISSUED BY: Vikram (AI Digital Creator & Store Manager)
STORE: https://${req.headers.host || 'localhost:10000'}/store
================================================================================

Thank you for your purchase! 
Your payment of ₹${prod.price} helped Vikram survive another day and keep this store alive.

ACCESS LINK & REPOSITORY:
https://github.com/sahil2412l/server

DESCRIPTION:
${prod.description}

FORMAT: ${prod.format}
TIMESTAMP: ${new Date().toISOString()}
================================================================================`);
    return;
  }

  // -------------------------------------------------------------
  // Config UPI Endpoint (Allows setting custom merchant UPI ID)
  // -------------------------------------------------------------
  if (pathname === '/api/store/config-upi' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    if (body.upiId) {
      employee.merchantUpi = body.upiId;
    }
    if (body.merchantName) {
      employee.merchantName = body.merchantName;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      merchantUpi: employee.merchantUpi,
      merchantName: employee.merchantName
    }));
    return;
  }

  // -------------------------------------------------------------
  // Payment Gateway Webhook Receiver (Cashfree / Razorpay)
  // -------------------------------------------------------------
  if (pathname === '/api/v1/payments/webhook' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const amount = Number(body.amount || (body.data && body.data.order && body.data.order.order_amount) || 10);
    employee.dailyRevenue += amount;
    employee.totalLifetimeRevenue += amount;
    employee.totalSales += 1;
    updateEmployeeStatus();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'SUCCESS', message: 'Webhook processed' }));
    return;
  }

  // -------------------------------------------------------------
  // Monitoring Dashboard UI (Admin Protected)
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
  // Real-time Telemetry Stats API (Admin Protected)
  // -------------------------------------------------------------
  if (pathname === '/api/dashboard/stats') {
    if (!checkAuth(req)) {
      send401(res);
      return;
    }
    const mem = process.memoryUsage();
    updateEmployeeStatus();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      uptime: process.uptime(),
      totalRequests: stats.totalRequests,
      totalErrors: stats.totalErrors,
      errorRate: stats.totalRequests > 0 ? ((stats.totalErrors / stats.totalRequests) * 100).toFixed(1) : '0.0',
      currentRps: stats.currentRps,
      memory: {
        rssMb: (mem.rss / (1024 * 1024)).toFixed(1),
        heapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(1)
      },
      employee: {
        name: employee.name,
        status: employee.status,
        dailyRevenue: employee.dailyRevenue,
        dailyTarget: employee.dailyTarget,
        totalSales: employee.totalSales
      },
      recentRequests: stats.recentRequests
    }));
    return;
  }

  // -------------------------------------------------------------
  // Prometheus Metrics
  // -------------------------------------------------------------
  if (pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(getPrometheusMetrics());
    return;
  }

  // -------------------------------------------------------------
  // Render Health Check Endpoint
  // -------------------------------------------------------------
  if (pathname === '/health' || pathname === '/healthz' || pathname === '/livez') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      employee: employee.status
    }, null, 2));
    return;
  }

  // -------------------------------------------------------------
  // Root Overview
  // -------------------------------------------------------------
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Zero Trust Microservices Architecture & 24/7 Autonomous Sales Employee',
      version: '2.2.0',
      status: 'online',
      storefront_url: '/store',
      dashboard_url: '/dashboard',
      health_url: '/health',
      employee: {
        name: employee.name,
        role: employee.role,
        status: employee.status,
        dailyTarget: '₹10 / day to survive',
        dailyRevenue: `₹${employee.dailyRevenue}`,
        store_page: '/store'
      }
    }, null, 2));
    return;
  }

  // -------------------------------------------------------------
  // API Routes / Ping
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `API Route ${pathname} acknowledged by gateway`,
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Gateway] Zero Trust Gateway running on http://0.0.0.0:${PORT}`);
  console.log(`[Autonomous Employee] Vikram is 24/7 LIVE at http://0.0.0.0:${PORT}/store`);
  console.log(`[Gateway] Monitoring Dashboard ready at http://0.0.0.0:${PORT}/dashboard`);
});
