export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const emoji = status >= 400 ? '⚠️' : '⚡';
    console.log(`${emoji} [${req.method}] ${req.originalUrl} - ${status} (${duration}ms)`);
  });
  next();
};
