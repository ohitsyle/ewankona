// server/middlewares/logger.js
// Request logging middleware

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`→ ${req.method} ${req.originalUrl}`);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';

    console.log(`← ${req.method} ${req.originalUrl} ${statusColor}${status}\x1b[0m ${duration}ms`);
  });

  next();
};
