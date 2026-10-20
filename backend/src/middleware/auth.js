import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'monet_coworking_secret_jwt_key_2026';

/**
 * Starpprogrammatūra (middleware) pieprasījumu autentificēšanai, izmantojot JWT marķieri
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

    // Lomu noteikšana ar rezerves variantiem (role_name, role vai role_id)
    let resolvedRole = req.user.role_name || req.user.role;
    if (!resolvedRole && req.user.role_id) {
      const roleMap = { 1: 'guest', 2: 'user', 3: 'landlord', 4: 'admin' };
      resolvedRole = roleMap[req.user.role_id];
    }
    const userRole = (resolvedRole || '').toLowerCase();
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
