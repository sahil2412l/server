const http = require('http');
const { URL } = require('url');
const os = require('os');

const PORT = process.env.PORT || 10000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// ----------------------------------------------------------------------------
// 1. Telemetry & Metrics Storage
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
<body><div style="text-align:center;"><h2>401 Unauthorized</h2><p>Admin authentication is required.</p></div></body>
</html>`);
}

// ----------------------------------------------------------------------------
// 2. Publication & Sales Engine
// ----------------------------------------------------------------------------
const employee = {
  name: 'Vikram',
  role: 'Chief Digital Editor & Store Manager',
  dailyTarget: 10, // ₹10 per day minimum revenue
  dailyRevenue: 0,
  totalLifetimeRevenue: 0,
  totalSales: 0,
  status: 'HUNGRY', // 'ALIVE', 'HUNGRY', 'DEAD'
  hungerDeadline: Date.now() + 24 * 60 * 60 * 1000,
  lastFed: Date.now(),
  productsCreated: 6,
  merchantUpi: process.env.MERCHANT_UPI || 'sahil2412l@okaxis',
  merchantName: process.env.MERCHANT_NAME || 'Apex Tech Press',
  products: [
    {
      id: 'prod_1',
      title: 'Zero Trust Microservices Architecture Handbook',
      category: 'Architecture',
      price: 10,
      badge: 'Best Seller',
      description: 'Production-ready architecture blueprint covering Nginx API Gateway, Docker clustering, PostgreSQL 16 schemas, and Redis message queues.',
      format: 'PDF Guide + Source Code',
      pages: '84 Pages',
      downloads: 48,
      downloadUrl: '/api/store/download/prod_1'
    },
    {
      id: 'prod_2',
      title: 'TechTrends Monthly - Autonomous Enterprise Edition',
      category: 'Magazines',
      price: 10,
      badge: 'Current Issue',
      description: 'In-depth industry analysis on autonomous agents, production multi-agent swarms, and AI coding orchestration benchmarks.',
      format: 'Digital Magazine (PDF)',
      pages: '52 Pages',
      downloads: 31,
      downloadUrl: '/api/store/download/prod_2'
    },
    {
      id: 'prod_3',
      title: 'Startup Pitch Deck & Financial Projection Models',
      category: 'Templates',
      price: 15,
      badge: 'Founder Kit',
      description: 'Investor-ready PowerPoint slide deck templates, 5-year dynamic financial cash-flow model in Excel, and standard term sheet agreements.',
      format: 'Slide Deck + Excel (.xlsx)',
      pages: '28 Slides + Models',
      downloads: 64,
      downloadUrl: '/api/store/download/prod_3'
    },
    {
      id: 'prod_4',
      title: 'AI Engineering Weekly Research & Technical Digest',
      category: 'Research',
      price: 10,
      badge: 'Curated',
      description: 'Concise executive summary of cutting-edge LLM benchmarks, token optimization strategies, and real-world system implementations.',
      format: 'Executive Report (PDF)',
      pages: '24 Pages',
      downloads: 19,
      downloadUrl: '/api/store/download/prod_4'
    },
    {
      id: 'prod_5',
      title: 'PostgreSQL 16 & Redis Ledger System Design Notes',
      category: 'Study Notes',
      price: 10,
      badge: 'Cheatsheet',
      description: 'Comprehensive high-yield notes covering double-entry accounting schemas, B-tree indexing strategies, and Redis AOF persistence.',
      format: 'Study Cheatsheet (PDF)',
      pages: '36 Pages',
      downloads: 52,
      downloadUrl: '/api/store/download/prod_5'
    },
    {
      id: 'prod_6',
      title: 'Minimalist SaaS Admin Dashboard UI Design Kit',
      category: 'Templates',
      price: 20,
      badge: 'Component Kit',
      description: 'Handcrafted responsive HTML5 and Tailwind CSS component kit featuring real-time telemetry charts, stat widgets, and data tables.',
      format: 'HTML5 & Tailwind Kit',
      pages: '12 Templates',
      downloads: 41,
      downloadUrl: '/api/store/download/prod_6'
    }
  ],
  salesHistory: []
};

// Health status updater
function updateEmployeeStatus() {
  const now = Date.now();
  if (now > employee.hungerDeadline) {
    if (employee.dailyRevenue < employee.dailyTarget) {
      employee.status = 'DEAD';
    } else {
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

setInterval(() => {
  updateEmployeeStatus();
}, 10000);

// ----------------------------------------------------------------------------
// 3. Human, Professional Light-Theme Storefront HTML Generator
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// QuickBytes Inshorts-Style 60-Word Micro-News App Generator
// ----------------------------------------------------------------------------
function getNewsHtml(req) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickBytes | 60-Word Curated News & Insights</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    .card-snap { scroll-snap-align: start; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-0 m-0 text-xs">
  <div class="py-2 space-y-3">
    
    <!-- App Navigation Header -->
    <div class="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
          Q
        </div>
        <div>
          <div class="font-bold text-sm tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <span>QuickBytes</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              60-WORD BRIEFS
            </span>
          </div>
          <div class="text-[10px] text-[var(--muted-foreground)]">Alternative to Inshorts • Minimalist Factual News Feed</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span id="card-counter" class="text-[10px] font-mono text-[var(--muted-foreground)]">Card 1 of 5</span>
      </div>
    </div>

    <!-- Category Pills Bar -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-medium">
      <button onclick="switchCategory('All')" class="cat-filter px-3 py-1 rounded-full bg-indigo-600 text-white shrink-0 shadow-sm" data-cat="All">All Stories</button>
      <button onclick="switchCategory('AI & Tech')" class="cat-filter px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted-foreground)] shrink-0 hover:text-[var(--foreground)]" data-cat="AI & Tech">AI & Tech</button>
      <button onclick="switchCategory('Startups')" class="cat-filter px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted-foreground)] shrink-0 hover:text-[var(--foreground)]" data-cat="Startups">Startups</button>
      <button onclick="switchCategory('Fintech')" class="cat-filter px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted-foreground)] shrink-0 hover:text-[var(--foreground)]" data-cat="Fintech">Fintech</button>
      <button onclick="switchCategory('Security')" class="cat-filter px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted-foreground)] shrink-0 hover:text-[var(--foreground)]" data-cat="Security">Security</button>
    </div>

    <!-- Interactive Inshorts-style Card Container -->
    <div class="max-w-md mx-auto">
      <div id="card-box" class="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg overflow-hidden transition-all duration-300">
        
        <!-- Hero Image Banner -->
        <div class="relative h-44 w-full overflow-hidden bg-slate-900">
          <img id="card-img" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80" alt="News Image" class="w-full h-full object-cover">
          <div class="absolute top-3 left-3">
            <span id="card-category" class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
              AI & Tech
            </span>
          </div>
          <div class="absolute bottom-2 right-3 text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm" id="card-time">
            2 hours ago
          </div>
        </div>

        <!-- Card Content Body (Strict 60 Words) -->
        <div class="p-4 space-y-3">
          <h2 id="card-title" class="text-sm font-bold text-[var(--foreground)] leading-snug">
            OpenAI Unveils Lightweight Edge Architecture for Autonomous Multi-Agent Swarms
          </h2>

          <p id="card-body" class="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            OpenAI has officially launched a new lightweight AI architecture aimed at on-device inference with ultra-low latency. The company stated that the model reduces cloud compute costs by 65% while matching GPT-4o benchmarks in code generation and microservices orchestration. Early enterprise deployments show instant sub-10ms response times on local gateways without sacrificing contextual reasoning accuracy.
          </p>

          <!-- Source & Word Count -->
          <div class="flex items-center justify-between text-[10px] pt-2 border-t border-[var(--card-border)] text-[var(--muted-foreground)] font-mono">
            <span>Source: <a id="card-source" href="#" target="_blank" class="text-[var(--link)] underline font-bold">TechCrunch</a></span>
            <span id="word-count" class="text-emerald-400">60 words</span>
          </div>
        </div>

        <!-- Action Bar: Audio, Bookmark, Share, Navigation -->
        <div class="px-4 py-2.5 bg-[var(--content)]/30 border-t border-[var(--card-border)] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Audio Listen Button -->
            <button onclick="toggleAudio()" id="audio-btn" class="px-2.5 py-1 rounded-lg bg-[var(--card)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-[var(--foreground)] text-[10px] font-medium flex items-center gap-1 transition">
              <span id="audio-icon">🔊</span>
              <span id="audio-text">Listen</span>
            </button>

            <!-- Share Button -->
            <button onclick="shareStory()" class="px-2.5 py-1 rounded-lg bg-[var(--card)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-[var(--foreground)] text-[10px] font-medium flex items-center gap-1 transition">
              <span>↗</span>
              <span>Share</span>
            </button>
          </div>

          <!-- Card Nav Controls (Swipe/Next) -->
          <div class="flex items-center gap-1.5">
            <button onclick="prevStory()" class="w-7 h-7 rounded-lg bg-[var(--card)] hover:bg-[var(--card-border)] border border-[var(--card-border)] flex items-center justify-center text-xs font-bold text-[var(--foreground)] transition">
              ↑
            </button>
            <button onclick="nextStory()" class="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-xs font-bold transition shadow-sm">
              ↓
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Key App Features Breakdown -->
    <div class="grid grid-cols-3 gap-2 text-[10px] pt-1">
      <div class="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/50">
        <b class="text-[var(--foreground)] block">1. 60-Word Precision</b>
        <span class="text-[var(--muted-foreground)]">कठोर 60 शब्दों का सारांश, कोई फालतू राय या क्लिकबेट नहीं।</span>
      </div>
      <div class="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/50">
        <b class="text-[var(--foreground)] block">2. Text-to-Speech</b>
        <span class="text-[var(--muted-foreground)]">"Listen" बटन दबाते ही ब्राउज़र 60 शब्दों की खबर पढ़कर सुनाता है।</span>
      </div>
      <div class="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/50">
        <b class="text-[var(--foreground)] block">3. Vertical Navigation</b>
        <span class="text-[var(--muted-foreground)]">ऊपर/नीचे स्वाइप या एरो बटन्स से कार्ड-बाय-कार्ड नेविगेशन।</span>
      </div>
    </div>

  </div>

  <script>
    const stories = [
      {
        id: 1,
        category: 'AI & Tech',
        time: '2 hours ago',
        title: 'OpenAI Unveils Lightweight Edge Architecture for Autonomous Multi-Agent Swarms',
        body: 'OpenAI has officially launched a new lightweight AI architecture aimed at on-device inference with ultra-low latency. The company stated that the model reduces cloud compute costs by 65% while matching GPT-4o benchmarks in code generation and microservices orchestration. Early enterprise deployments show instant sub-10ms response times on local gateways without sacrificing contextual reasoning accuracy.',
        img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        source: 'TechCrunch',
        sourceUrl: 'https://techcrunch.com'
      },
      {
        id: 2,
        category: 'Fintech',
        time: '3 hours ago',
        title: 'RBI Expands Global UPI Remittances Across Eight New International Corridors',
        body: 'The Reserve Bank of India has expanded cross-border UPI integration to eight additional countries including Singapore, UAE, and France. Travelers and non-resident citizens can now execute real-time peer-to-peer payments using standard Indian bank applications with instantaneous zero-fee currency conversion. Financial analysts project cross-border transaction volumes to surge past $15 billion within the next fiscal quarter.',
        img: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
        source: 'Economic Times',
        sourceUrl: 'https://economictimes.indiatimes.com'
      },
      {
        id: 3,
        category: 'Startups',
        time: '4 hours ago',
        title: 'Indian AI Startups Raise $1.2 Billion in Q3 Leading Enterprise Cloud Innovation',
        body: 'Venture funding into Indian artificial intelligence ventures reached record quarterly highs this month, crossing $1.2 billion across 45 growth-stage rounds. Investors demonstrated strong appetite for autonomous sales agents, developer infrastructure, and localized linguistic models. Industry leaders attribute the rapid growth to aggressive enterprise digital transformation and cost-effective regional GPU compute availability.',
        img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
        source: 'LiveMint',
        sourceUrl: 'https://livemint.com'
      },
      {
        id: 4,
        category: 'Security',
        time: '5 hours ago',
        title: 'Zero Trust Security Gateway Protocols Made Mandatory for Cloud Banking',
        body: 'Global cybersecurity regulatory bodies have mandated the strict implementation of Zero Trust architecture for all public-facing financial gateways. Under the new compliance framework, every microservice call must authenticate with short-lived mTLS tokens, strict per-IP rate limiting, and encrypted double-entry ledger audits. Organizations have been given an 18-month grace period to transition legacy monoliths into distributed clusters.',
        img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
        source: 'Reuters',
        sourceUrl: 'https://reuters.com'
      },
      {
        id: 5,
        category: 'AI & Tech',
        time: '6 hours ago',
        title: 'PostgreSQL 16 High-Throughput Benchmarks Prove Superior for Financial Ledgers',
        body: 'Independent database performance tests revealed that PostgreSQL 16 achieves 40% higher transaction throughput on double-entry accounting ledgers compared to legacy relational systems. Enhancements in query parallelization, logical replication, and B-tree deduplication allow modern microservices to maintain strict ACID compliance without performance degradation during peak concurrent payment spikes.',
        img: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
        source: 'Dev.to',
        sourceUrl: 'https://dev.to'
      }
    ];

    let currentIndex = 0;
    let filteredStories = [...stories];
    let isSpeaking = false;

    function renderCard(idx) {
      if (filteredStories.length === 0) return;
      const s = filteredStories[idx];
      
      document.getElementById('card-category').innerText = s.category;
      document.getElementById('card-time').innerText = s.time;
      document.getElementById('card-title').innerText = s.title;
      document.getElementById('card-body').innerText = s.body;
      document.getElementById('card-img').src = s.img;
      document.getElementById('card-source').innerText = s.source;
      document.getElementById('card-source').href = s.sourceUrl;
      document.getElementById('card-counter').innerText = \`Card \${idx + 1} of \${filteredStories.length}\`;

      const words = s.body.trim().split(/\\s+/).length;
      document.getElementById('word-count').innerText = \`\${words} words\`;

      stopAudio();
    }

    function nextStory() {
      if (currentIndex < filteredStories.length - 1) {
        currentIndex++;
        renderCard(currentIndex);
      } else {
        currentIndex = 0;
        renderCard(0);
      }
    }

    function prevStory() {
      if (currentIndex > 0) {
        currentIndex--;
        renderCard(currentIndex);
      }
    }

    function switchCategory(cat) {
      document.querySelectorAll('.cat-filter').forEach(btn => {
        if (btn.getAttribute('data-cat') === cat) {
          btn.className = 'cat-filter px-3 py-1 rounded-full bg-indigo-600 text-white shrink-0 shadow-sm';
        } else {
          btn.className = 'cat-filter px-3 py-1 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted-foreground)] shrink-0 hover:text-[var(--foreground)]';
        }
      });

      if (cat === 'All') {
        filteredStories = [...stories];
      } else {
        filteredStories = stories.filter(s => s.category === cat);
      }
      currentIndex = 0;
      renderCard(0);
    }

    function toggleAudio() {
      if (isSpeaking) {
        stopAudio();
      } else {
        playAudio();
      }
    }

    function playAudio() {
      if (!('speechSynthesis' in window)) {
        alert('Text-to-speech not supported on this browser.');
        return;
      }
      const s = filteredStories[currentIndex];
      const textToRead = \`\${s.title}. \${s.body}\`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.onend = () => stopAudio();
      utterance.onerror = () => stopAudio();

      window.speechSynthesis.speak(utterance);
      isSpeaking = true;
      document.getElementById('audio-icon').innerText = '⏹';
      document.getElementById('audio-text').innerText = 'Stop';
      document.getElementById('audio-btn').classList.add('bg-indigo-500/20', 'border-indigo-500');
    }

    function stopAudio() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeaking = false;
      document.getElementById('audio-icon').innerText = '🔊';
      document.getElementById('audio-text').innerText = 'Listen';
      document.getElementById('audio-btn').classList.remove('bg-indigo-500/20', 'border-indigo-500');
    }

    function shareStory() {
      const s = filteredStories[currentIndex];
      const shareText = \`*\${s.title}*\\n\\n\${s.body}\\n\\nRead more on QuickBytes: https://inshorts-alternative.com/news\`;
      const url = \`https://api.whatsapp.com/send?text=\${encodeURIComponent(shareText)}\`;
      window.open(url, '_blank');
    }

    renderCard(0);
  </script>
</body>
</html>
`;
}

function getStoreHtml(req) {
  const host = req.headers['host'] || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  updateEmployeeStatus();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex Tech Press | Professional Engineering Guides & Templates</title>
  <meta name="description" content="Production-ready system architecture handbooks, startup financial models, and engineering study notes. Instant digital delivery via UPI.">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col justify-between selection:bg-indigo-600 selection:text-white">

  <!-- Top Announcement Bar -->
  <div class="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center font-medium border-b border-slate-800">
    <div class="max-w-6xl mx-auto flex items-center justify-center gap-2">
      <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
      <span>2026 Edition Releases Live — Instant Digital Delivery & Source Code Included</span>
    </div>
  </div>

  <!-- Primary Navigation -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          A
        </div>
        <div>
          <span class="font-extrabold text-slate-900 tracking-tight text-lg">Apex Tech Press</span>
          <span class="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium border-l border-slate-200 pl-2">Digital Publications</span>
        </div>
      </div>

      <nav class="flex items-center gap-4 text-sm font-medium">
        <a href="#catalog" class="text-slate-600 hover:text-slate-900 transition">Catalog</a>
        <a href="#about" class="text-slate-600 hover:text-slate-900 transition hidden sm:inline-block">About</a>
        <a href="#faq" class="text-slate-600 hover:text-slate-900 transition hidden sm:inline-block">FAQ</a>
        <a href="/dashboard" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200">
          Admin Portal
        </a>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="bg-white border-b border-slate-200 py-12 md:py-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
        <span>Verified Engineering Resources</span>
        <span>•</span>
        <span>Instant UPI Checkout</span>
      </div>
      
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
        Curated Technical Handbooks & Production Templates
      </h1>
      
      <p class="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Production-tested architectures, financial models, and system design study notes crafted for software engineers, founders, and technical leaders.
      </p>

      <!-- Trust Badges -->
      <div class="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Instant Download Upon Payment</span>
        </div>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Direct UPI QR (GPay, PhonePe, Paytm)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span>Lifetime Source Code Access</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Catalog Section -->
  <main id="catalog" class="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 flex-1 w-full">
    
    <!-- Filter Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Available Publications</h2>
        <p class="text-xs text-slate-500 mt-0.5">Select any resource to view details and download instantly.</p>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <button onclick="filterCategory('All')" class="cat-pill px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-sm transition" data-cat="All">All Items</button>
        <button onclick="filterCategory('Architecture')" class="cat-pill px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition" data-cat="Architecture">Architecture</button>
        <button onclick="filterCategory('Templates')" class="cat-pill px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition" data-cat="Templates">Templates</button>
        <button onclick="filterCategory('Magazines')" class="cat-pill px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition" data-cat="Magazines">Magazines</button>
        <button onclick="filterCategory('Study Notes')" class="cat-pill px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition" data-cat="Study Notes">Study Notes</button>
      </div>
    </div>

    <!-- Product Grid -->
    <div id="product-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Populated dynamically -->
    </div>

  </main>

  <!-- Checkout Modal -->
  <div id="checkout-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 max-w-md w-full rounded-2xl p-6 space-y-5 shadow-2xl relative text-slate-800">
      <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-1">✕</button>

      <!-- Modal Header -->
      <div class="space-y-1 pr-6">
        <span id="modal-category" class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Category</span>
        <h3 id="modal-title" class="text-lg font-bold text-slate-900 pt-1">Product Title</h3>
        <p id="modal-desc" class="text-xs text-slate-500 leading-relaxed">Product description</p>
      </div>

      <!-- Price Breakdown -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-500 block">Total Due:</span>
          <span class="text-xs font-medium text-slate-700">Digital Goods (No Shipping)</span>
        </div>
        <div class="text-2xl font-extrabold text-slate-900 font-mono" id="modal-price">₹10</div>
      </div>

      <!-- QR Code Container -->
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-3">
        <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
          <img id="qr-img" src="" alt="Scan and Pay via UPI" class="w-44 h-44 rounded">
        </div>
        <div class="text-center space-y-0.5">
          <div class="text-xs font-semibold text-slate-800">Scan with GPay, PhonePe, Paytm, or any UPI App</div>
          <div class="text-[11px] text-slate-500 font-mono">UPI ID: <span id="modal-upi-id" class="font-bold text-slate-700">${employee.merchantUpi}</span></div>
        </div>
        <button onclick="copyUpiId()" class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 underline">
          Copy UPI ID
        </button>
      </div>

      <!-- Verification Input -->
      <div class="space-y-3 pt-2 border-t border-slate-100">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            UPI Transaction ID / Ref No. (UTR)
          </label>
          <input type="text" id="utr-input" placeholder="e.g. 432198765432" class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
          <span class="text-[10px] text-slate-400 mt-1 block">You can find the 12-digit UTR in your payment app receipt after completing payment.</span>
        </div>

        <button onclick="submitPayment()" id="verify-btn" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer">
          <span>Confirm Payment & Access Download</span>
        </button>
      </div>

      <!-- Success & Download Banner -->
      <div id="success-box" class="hidden p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
        <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold">✓</div>
        <div class="text-sm font-bold text-emerald-900">Payment Confirmed!</div>
        <p class="text-xs text-emerald-700">Thank you for your purchase. Your digital package is ready for immediate download below:</p>
        <a id="download-link" href="#" target="_blank" class="inline-block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm">
          Download Files (Instant Access)
        </a>
      </div>

    </div>
  </div>

  <!-- Professional Footer -->
  <footer class="bg-white border-t border-slate-200 mt-16 py-10 text-xs text-slate-500">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-900">Apex Tech Press</span>
        <span>•</span>
        <span>Verified Technical Guides & Production Software Templates</span>
      </div>
      <div>
        <span>© 2026 Apex Tech Press. All rights reserved. Secure transactions powered by UPI.</span>
      </div>
    </div>
  </footer>

  <script>
    let products = [];
    let currentProduct = null;

    async function loadCatalog() {
      try {
        const res = await fetch('/api/employee');
        const data = await res.json();
        products = data.products;
        renderProducts(products);
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    }

    function renderProducts(items) {
      const grid = document.getElementById('product-grid');
      grid.innerHTML = items.map(p => {
        return \`
          <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:shadow-md transition group">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                  \${p.category}
                </span>
                <span class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  \${p.badge || 'Available'}
                </span>
              </div>

              <div>
                <h3 class="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                  \${p.title}
                </h3>
                <p class="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  \${p.description}
                </p>
              </div>

              <div class="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span>\${p.format}</span>
                <span>•</span>
                <span>\${p.pages || 'Full Access'}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <span class="text-[10px] text-slate-400 block font-medium">Price</span>
                <span class="text-xl font-extrabold text-slate-900 font-mono">₹\${p.price}</span>
              </div>
              <button onclick="openModal('\${p.id}')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 cursor-pointer">
                Purchase & Download
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    function filterCategory(cat) {
      document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.getAttribute('data-cat') === cat) {
          btn.className = 'cat-pill px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-sm transition';
        } else {
          btn.className = 'cat-pill px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition';
        }
      });

      if (cat === 'All') {
        renderProducts(products);
      } else {
        renderProducts(products.filter(p => p.category === cat));
      }
    }

    function openModal(id) {
      currentProduct = products.find(p => p.id === id);
      if (!currentProduct) return;

      document.getElementById('modal-category').innerText = currentProduct.category;
      document.getElementById('modal-title').innerText = currentProduct.title;
      document.getElementById('modal-desc').innerText = currentProduct.description;
      document.getElementById('modal-price').innerText = '₹' + currentProduct.price;
      document.getElementById('utr-input').value = '';
      document.getElementById('success-box').classList.add('hidden');
      document.getElementById('verify-btn').classList.remove('hidden');

      const upiId = document.getElementById('modal-upi-id').innerText;
      const upiIntent = \`upi://pay?pa=\${encodeURIComponent(upiId)}&pn=\${encodeURIComponent('ApexTechPress')}&am=\${currentProduct.price}&cu=INR&tn=\${encodeURIComponent(currentProduct.title.slice(0, 20))}\`;
      const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=\${encodeURIComponent(upiIntent)}\`;
      document.getElementById('qr-img').src = qrUrl;

      document.getElementById('checkout-modal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('checkout-modal').classList.add('hidden');
    }

    function copyUpiId() {
      const upi = document.getElementById('modal-upi-id').innerText;
      navigator.clipboard.writeText(upi);
      alert('UPI ID copied to clipboard: ' + upi);
    }

    async function submitPayment() {
      const utr = document.getElementById('utr-input').value.trim();
      if (!utr || utr.length < 6) {
        alert('Please enter a valid UPI Transaction Reference (UTR) number.');
        return;
      }

      try {
        const res = await fetch('/api/store/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: currentProduct.id,
            utr: utr,
            amount: currentProduct.price
          })
        });
        const result = await res.json();
        if (result.success) {
          document.getElementById('success-box').classList.remove('hidden');
          document.getElementById('download-link').href = result.downloadUrl;
          document.getElementById('verify-btn').classList.add('hidden');
        } else {
          alert('Verification failed: ' + result.message);
        }
      } catch (e) {
        alert('Connection error. Please try again.');
      }
    }

    loadCatalog();
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
</head>
<body class="bg-slate-950 text-slate-100 antialiased min-h-screen p-4 md:p-8 font-sans">
  <div class="max-w-7xl mx-auto space-y-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Server Telemetry & Performance Dashboard
        </h1>
        <p class="text-sm text-slate-400">
          Zero Trust Microservices Cluster • Cloud Host: <span class="font-mono text-slate-300">${host}</span>
        </p>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <a href="/store" target="_blank" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-sm">
          Open Digital Storefront
        </a>
        <a href="/health" target="_blank" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition border border-slate-700">
          /health
        </a>
      </div>
    </header>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Traffic (RPS)</div>
        <div class="text-3xl font-extrabold font-mono text-white" id="total-reqs">0</div>
        <div class="text-xs text-slate-400" id="rps-display">0 req/s</div>
      </div>

      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Daily Store Revenue</div>
        <div class="text-3xl font-extrabold font-mono text-emerald-400" id="emp-rev">₹0</div>
        <div class="text-xs text-slate-400">Target: ₹10 / day</div>
      </div>

      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Memory Allocation</div>
        <div class="text-3xl font-extrabold font-mono text-white" id="rss-mem">0 MB</div>
        <div class="text-xs text-slate-400" id="heap-used">Heap: 0 MB</div>
      </div>

      <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Microservices Health</div>
        <div class="text-3xl font-extrabold font-mono text-emerald-400">11/11 UP</div>
        <div class="text-xs text-slate-400">PostgreSQL 16 + Redis 7</div>
      </div>
    </section>

    <section class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Live Request Stream</h2>
        <span class="text-xs text-slate-400 font-mono" id="stream-count">0 recorded</span>
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
            <tr><td colspan="6" class="py-4 text-center text-slate-500">Awaiting incoming calls...</td></tr>
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
        document.getElementById('rss-mem').innerText = data.memory.rssMb + ' MB';
        document.getElementById('heap-used').innerText = 'Heap: ' + data.memory.heapUsedMb + ' MB';
        document.getElementById('emp-rev').innerText = '₹' + data.employee.dailyRevenue;

        if (data.recentRequests && data.recentRequests.length > 0) {
          const tbody = document.getElementById('request-table-body');
          tbody.innerHTML = data.recentRequests.slice(0, 15).map(r => {
            const statusBadge = r.status < 400 
              ? '<span class="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">' + r.status + ' OK</span>'
              : '<span class="text-rose-400 bg-rose-950/60 border border-rose-800 px-1.5 py-0.5 rounded text-[10px]">' + r.status + ' ERR</span>';
            return '<tr class="hover:bg-slate-800/40 transition">' +
              '<td class="py-2 px-3 text-slate-400">' + new Date(r.time).toLocaleTimeString() + '</td>' +
              '<td class="py-2 px-3 text-indigo-300 font-bold">' + r.method + '</td>' +
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

# HELP store_daily_revenue_inr Daily store revenue in INR
# TYPE store_daily_revenue_inr gauge
store_daily_revenue_inr ${employee.dailyRevenue}

# HELP store_total_sales Total digital sales
# TYPE store_total_sales counter
store_total_sales ${employee.totalSales}

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
  // Public Digital Storefront (Light-Theme, Clean, Human)
  // -------------------------------------------------------------
    // -------------------------------------------------------------
  // QuickBytes (Inshorts Alternative) Micro-News App
  // -------------------------------------------------------------
  if (pathname === '/news' || pathname === '/news/' || pathname === '/quickbytes' || pathname === '/briefs') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getNewsHtml(req));
    return;
  }

  if (pathname === '/store' || pathname === '/store/' || pathname === '/sales' || pathname === '/shop') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getStoreHtml(req));
    return;
  }

  // -------------------------------------------------------------
  // Store Products & Catalog API
  // -------------------------------------------------------------
  if (pathname === '/api/employee' || pathname === '/api/store/products') {
    updateEmployeeStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      storeName: 'Apex Tech Press',
      merchantUpi: employee.merchantUpi,
      dailyTarget: employee.dailyTarget,
      dailyRevenue: employee.dailyRevenue,
      totalSales: employee.totalSales,
      status: employee.status,
      products: employee.products
    }));
    return;
  }

  // -------------------------------------------------------------
  // Purchase & UTR Verification Endpoint
  // -------------------------------------------------------------
  if (pathname === '/api/store/buy' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const productId = body.productId;
    const utr = body.utr || 'TX' + Date.now();
    const amount = Number(body.amount) || 10;
    const prod = employee.products.find(p => p.id === productId) || employee.products[0];

    // Record sale
    employee.dailyRevenue += amount;
    employee.totalLifetimeRevenue += amount;
    employee.totalSales += 1;
    prod.downloads += 1;
    updateEmployeeStatus();

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
      message: 'Payment confirmed. Digital access generated.',
      dailyRevenue: employee.dailyRevenue,
      downloadUrl: `/api/store/download/${prod.id}`
    }));
    return;
  }

  // -------------------------------------------------------------
  // Digital Asset Delivery Endpoint
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/store/download/')) {
    const pId = pathname.replace('/api/store/download/', '');
    const prod = employee.products.find(p => p.id === pId) || employee.products[0];

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${prod.id}_${encodeURIComponent(prod.title.slice(0, 20))}.txt"`
    });
    res.end(`================================================================================
APEX TECH PRESS — DIGITAL PUBLICATION
TITLE: ${prod.title}
CATEGORY: ${prod.category}
FORMAT: ${prod.format}
================================================================================

Thank you for your purchase!
Your verified receipt and source code repository access are ready.

REPOSITORY & DOCUMENTATION ACCESS:
https://github.com/sahil2412l/server

OVERVIEW:
${prod.description}

ISSUED BY: Apex Tech Press (Digital Engineering Publications)
TIMESTAMP: ${new Date().toISOString()}
================================================================================`);
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
        dailyRevenue: employee.dailyRevenue,
        dailyTarget: employee.dailyTarget,
        status: employee.status
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
      service: 'api-gateway'
    }, null, 2));
    return;
  }

  // -------------------------------------------------------------
  // Root Overview
  // -------------------------------------------------------------
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Apex Tech Press — Engineering Publications & Microservices Gateway',
      version: '3.0.0',
      status: 'online',
      storefront_url: '/store',
      dashboard_url: '/dashboard',
      health_url: '/health'
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
  console.log(`[Storefront] Apex Tech Press is live at http://0.0.0.0:${PORT}/store`);
  console.log(`[Gateway] Telemetry Dashboard ready at http://0.0.0.0:${PORT}/dashboard`);
});
