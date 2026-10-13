/**
 * Globālā kļūdu apstrādes starpprogrammatūra
 */
export function errorHandler(err, req, res, next) {
  console.error('Neapstrādāta servera kļūda:', err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Nederīgs JSON pieprasījuma formāts.',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Sistēmas iekšējā kļūda.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Neatrasto resursu apstrādes starpprogrammatūra
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resurss ${req.originalUrl} nav atrasts.`,
  });
}
