import { Router } from 'express';
import { authController } from '../controllers/authController.js';

const router = Router();

// GET /api/roles - atgriež visas sistēmas lietotāju lomas
router.get('/', authController.getRoles);

export default router;
