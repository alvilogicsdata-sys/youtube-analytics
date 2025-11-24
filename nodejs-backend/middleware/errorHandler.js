const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log error for debugging

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      details: err.message 
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Unauthorized', 
      details: 'Invalid or expired token' 
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      message: 'Database connection failed', 
      details: 'Unable to connect to the database' 
    });
  }

  // Default error
  res.status(500).json({ 
    message: 'Internal Server Error', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;