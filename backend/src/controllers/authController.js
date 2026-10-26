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
      if (typeof res.cookie === 'function') {
        res.cookie(AUTH_COOKIE, token, authCookieOptions);
      }

      return res.status(201).json({
        success: true,
        message: 'Lietotājs veiksmīgi reģistrēts.',
        user,
        token,
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
      if (typeof res.cookie === 'function') {
        res.cookie(AUTH_COOKIE, token, authCookieOptions);
      }

      return res.status(200).json({
        success: true,
        message: 'Veiksmīga autorizācija.',
        user,
        token,
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
    if (typeof res.clearCookie === 'function') {
      res.clearCookie(AUTH_COOKIE, authCookieOptions);
    }
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

  /**
   * PUT /api/auth/profile
   * Atjaunina lietotāja profilu
   */
  async updateProfile(req, res, next) {
    try {
      const { user, token } = await authService.updateProfile(req.user.user_id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Profils veiksmīgi atjaunināts.',
        user,
        token,
      });
    } catch (err) {
      if (err instanceof ConflictError) {
        return res.status(409).json({
          success: false,
          message: err.message,
          field: err.field,
        });
      }
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
   * PUT /api/auth/password
   * Maina lietotāja paroli
   */
  async changePassword(req, res, next) {
    try {
      const result = await authService.changePassword(req.user.user_id, req.body);
      return res.status(200).json(result);
    } catch (err) {
      if (err instanceof AuthenticationError) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next(err);
    }
  },
};
