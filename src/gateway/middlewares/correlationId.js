import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID Middleware
 * Assigns or propagates a unique correlation ID to trace requests across the gateway and internal services
 */
export const correlationIdMiddleware = (req, res, next) => {
  const correlationId =
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', correlationId);

  next();
};

