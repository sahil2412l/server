/**
 * Web Application Firewall (WAF) & Ingress Security Filter
 * Implements the "Firewall / CDN" perimeter protection layer in the Best-Practice Architecture
 */

// Malicious signature patterns
const SQLI_PATTERNS = [
  /(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|EXECUTE)\b.*?\b(FROM|INTO|TABLE|DATABASE)\b)/i,
  /(\bOR\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/i,
  /(--\s*$|\/\*.*?\*\/|;\s*SHUTDOWN)/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.[\/\\]|\%2e\%2e[\/\\])/i,
  /(\/etc\/passwd|c:\\windows\\system32)/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /(;\s*(cat|ls|dir|rm|netstat|whoami|curl|wget|powershell|cmd)\b)/i,
  /(\|\s*(bash|sh|cmd|powershell)\b)/i,
];

const SCANNER_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /w3af/i,
  /acunetix/i,
  /dirbuster/i,
  /nessus/i,
  /nmap/i,
];

const inspectString = (str) => {
  if (typeof str !== 'string') return null;

  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(str)) return 'SQL Injection detected';
  }

  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(str)) return 'Path Traversal detected';
  }

  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(str)) return 'Command Injection detected';
  }

  return null;
};

const inspectObject = (obj, depth = 0) => {
  if (!obj || depth > 5) return null;

  for (const [key, val] of Object.entries(obj)) {
    // Check key
    const keyCheck = inspectString(key);
    if (keyCheck) return keyCheck;

    // Check value
    if (typeof val === 'string') {
      const valCheck = inspectString(val);
      if (valCheck) return valCheck;
    } else if (typeof val === 'object' && val !== null) {
      const nestedCheck = inspectObject(val, depth + 1);
      if (nestedCheck) return nestedCheck;
    }
  }

  return null;
};

/**
 * WAF Middleware
 */
export const wafMiddleware = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';

  // 1. Scanner / Attack Tool Detection
  for (const scannerRegex of SCANNER_USER_AGENTS) {
    if (scannerRegex.test(userAgent)) {
      return res.status(403).json({
        success: false,
        error: 'Firewall Blocked: Automated vulnerability scanner detected.',
        correlationId: req.correlationId,
        waf: 'BLOCKED_SCANNER',
      });
    }
  }

  // 2. Query String Inspection
  const queryViolation = inspectObject(req.query);
  if (queryViolation) {
    return res.status(403).json({
      success: false,
      error: `Firewall Blocked: Malicious query payload (${queryViolation}).`,
      correlationId: req.correlationId,
      waf: 'BLOCKED_QUERY_INSPECTION',
    });
  }

  // 3. Body Inspection (excluding pre-sanitized or specific auth credentials)
  if (req.body && typeof req.body === 'object') {
    // Don't inspect password field directly with generic regexes that could false-positive on complex passwords
    const bodyCopy = { ...req.body };
    delete bodyCopy.password;

    const bodyViolation = inspectObject(bodyCopy);
    if (bodyViolation) {
      return res.status(403).json({
        success: false,
        error: `Firewall Blocked: Malicious payload (${bodyViolation}).`,
        correlationId: req.correlationId,
        waf: 'BLOCKED_PAYLOAD_INSPECTION',
      });
    }
  }

  // Set WAF Pass headers
  res.setHeader('X-WAF-Protection', 'Active');
  res.setHeader('X-WAF-Status', 'PASS');

  next();
};
