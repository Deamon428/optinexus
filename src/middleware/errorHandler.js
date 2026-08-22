export const errorHandler = (err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Logistics Engine Error',
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  });
};
