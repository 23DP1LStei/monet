import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
} from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Publiskie maršruti
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Aizsargātie maršruti (nepieciešams derīgs JWT marķieris)
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateUpdateProfile, authController.updateProfile);
router.put('/password', authenticateToken, validateChangePassword, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);

export default router;
