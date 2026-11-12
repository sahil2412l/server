/**
 * NoSQL Injection Protection Middleware
 * Recursively removes MongoDB query selector operators (keys starting with '$' or containing '.')
 */

const cleanInput = (payload) => {
  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] = cleanInput(payload[i]);
    }
  } else if (payload !== null && typeof payload === 'object') {
    for (const key of Object.keys(payload)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete payload[key];
      } else {
        payload[key] = cleanInput(payload[key]);
      }
    }
  }
  return payload;
};

export const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) cleanInput(req.body);
  if (req.query) cleanInput(req.query);
  if (req.params) cleanInput(req.params);
  next();
};

