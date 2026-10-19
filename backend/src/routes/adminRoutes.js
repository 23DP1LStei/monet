import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Aizsargāti administratora un vadības maršruti
router.use(authenticateToken, authorizeRoles('user', 'landlord', 'admin'));

// Platform Stats
router.get('/stats', adminController.getStats);

// Users Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Spaces Management
router.get('/spaces', adminController.getAllSpaces);
router.post('/spaces', adminController.createSpace);
router.put('/spaces/:id', adminController.updateSpace);
router.delete('/spaces/:id', adminController.deleteSpace);

// Reservations Management
router.get('/reservations', adminController.getAllReservations);
router.patch('/reservations/:id', adminController.updateReservationStatus);

export default router;
