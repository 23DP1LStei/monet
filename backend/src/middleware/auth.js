import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'monet_coworking_secret_jwt_key_2026';

/**
 * Starpprogrammatūra (middleware) pieprasījumu autentificēšanai, izmantojot JWT marķieri
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieHeader = req.headers.cookie || '';
  const authCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('monet_auth='));
  const cookieToken = authCookie ? authCookie.slice('monet_auth='.length) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Piekļuve liegta: trūkst autorizācijas marķiera (token).',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Nederīgs vai beidzies autorizācijas marķieris (token).',
      error: err.message,
    });
  }
}

/**
 * Starpprogrammatūra piekļuves ierobežošanai pēc lietotāja lomām (RBAC)
 * @param  {...string} allowedRoles Lomas, kurām atļauts piekļūt maršrutam
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Lietotājs nav autentificēts.',
      });
    }

    const userRole = (req.user.role_name || '').toLowerCase();
    const hasRole = allowedRoles.map((r) => r.toLowerCase()).includes(userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Piekļuve liegta: jums nav nepieciešamo tiesību šīs darbības veikšanai.',
      });
    }

    next();
  };
}

/**
 * Palīgfunkcija parakstīta JWT marķiera ģenerēšanai
 */
export function generateToken(payload) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
