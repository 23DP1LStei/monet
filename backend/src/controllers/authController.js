import { authService, ConflictError, AuthenticationError } from '../services/authService.js';

const AUTH_COOKIE = 'monet_auth';
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const authController = {
  /**
   * POST /api/auth/register
   * Reģistrē jaunu lietotāja kontu
   */
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);
      res.cookie(AUTH_COOKIE, token, authCookieOptions);

      return res.status(201).json({
        success: true,
        message: 'Lietotājs veiksmīgi reģistrēts.',
        user,
      });
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(409).json({
          success: false,
          message: err.message,
          field: err.field,
        });
      }
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * Autentificē lietotāju un izsniedz JWT marķieri
   */
  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);
      res.cookie(AUTH_COOKIE, token, authCookieOptions);

      return res.status(200).json({
        success: true,
        message: 'Veiksmīga autorizācija.',
        user,
      });
    } catch (err) {
      if (err instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   * Atgriež pašreizējā autentificētā lietotāja profilu
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Lietotājs nav atrasts.',
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   * Izraksta lietotāju no sistēmas
   */
  async logout(req, res) {
    res.clearCookie(AUTH_COOKIE, authCookieOptions);
    return res.status(200).json({
      success: true,
      message: 'Veiksmīgi izrakstījies no sistēmas.',
    });
  },

  /**
   * GET /api/roles
   * Atgriež sistēmā pieejamās lietotāju lomas
   */
  async getRoles(req, res, next) {
    try {
      const roles = await authService.listRoles();
      return res.status(200).json({
        success: true,
        roles,
      });
    } catch (err) {
      next(err);
    }
  },
};
