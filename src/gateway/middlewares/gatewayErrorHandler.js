/**
 * Gateway Global Error Handler
 * Standardizes API Gateway error responses conforming to RFC 7807 Problem Details
 */
export const gatewayErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  const errorResponse = {
    type: `https://api.gateway.errors/${statusCode}`,
    title: err.name || 'Internal Gateway Error',
    status: statusCode,
    detail: err.message || 'An unexpected error occurred processing your gateway request.',
    instance: req.originalUrl,
    correlationId: req.correlationId || 'none',
    timestamp: new Date().toISOString(),
    tenantId: req.tenant?.id || 'unknown',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

