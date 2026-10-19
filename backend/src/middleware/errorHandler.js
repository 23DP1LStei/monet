/**
 * Globālā kļūdu apstrādes starpprogrammatūra
 * Apstrādā gan standarta Express kļūdas, gan pielāgotos kļūdu tipus
 * (NotFoundError, ValidationError, ConflictError, AuthenticationError)
 */
export function errorHandler(err, req, res, next) {
  // Nepareizs JSON pieprasījumā
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Nederīgs JSON pieprasījuma formāts.',
    });
  }

  // Visiem pielāgotiem kļūdu tipiem ir statusCode
  const statusCode = err.statusCode || 500;

  const body = {
    success: false,
    message: err.message || 'Sistēmas iekšējā kļūda.',
  };

  // ValidationError var saturēt masīvu ar lauku kļūdām
  if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
    body.errors = err.errors;
  }

  // ConflictError var saturēt lauka nosaukumu
  if (err.field) {
    body.field = err.field;
  }

  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  if (statusCode === 500) {
    console.error('Neapstrādāta servera kļūda:', err);
  }

  return res.status(statusCode).json(body);
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
