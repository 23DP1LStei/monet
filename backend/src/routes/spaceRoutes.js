import { Router } from 'express';
import {
  listSpaces,
  getSpaceById,
  getSpaceReviews,
  createReservation,
  getMyReservations,
  cancelReservation,
  createReview,
  getManagedSpaces,
  getManagedReservations,
  createManagedSpace,
  updateManagedSpace,
  deleteManagedSpace,
  updateManagedReservation,
} from '../controllers/spaceController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// ─── Telpu publiskie un pārvaldības galapunkti ─────────────────────────────────

// GET /api/spaces/managed — pārvaldīto telpu saraksts (landlord/admin)
router.get('/managed', authenticateToken, getManagedSpaces);

// GET /api/spaces/managed/reservations — ienākošās rezervācijas (landlord/admin)
router.get('/managed/reservations', authenticateToken, getManagedReservations);

// POST /api/spaces/managed — jauna telpa (user/landlord/admin)
router.post('/managed', authenticateToken, authorizeRoles('user', 'landlord', 'admin'), createManagedSpace);

// PUT /api/spaces/managed/:id — rediģēt telpu
router.put('/managed/:id', authenticateToken, authorizeRoles('user', 'landlord', 'admin'), updateManagedSpace);

// DELETE /api/spaces/managed/:id — dzēst telpu
router.delete('/managed/:id', authenticateToken, authorizeRoles('user', 'landlord', 'admin'), deleteManagedSpace);

// PATCH /api/spaces/managed/reservations/:id — atjaunināt rezervācijas statusu
router.patch('/managed/reservations/:id', authenticateToken, authorizeRoles('user', 'landlord', 'admin'), updateManagedReservation);

// GET /api/spaces — telpu saraksts ar filtriem (city, type, price_min, price_max, instant_book, ...)
router.get('/', listSpaces);

// GET /api/spaces/:id — viena telpas detalizēta informācija (ar foto un atsauksmju kopsavilkumu)
router.get('/:id', getSpaceById);

// GET /api/spaces/:id/reviews — telpas atsauksmes (lapošana: limit, offset)
router.get('/:id/reviews', getSpaceReviews);

// ─── Rezervāciju galapunkti (prasa autentifikāciju) ───────────────────────────

// POST /api/reservations — jauna rezervācija (body: space_id, reservation_type, guest_count, start_time, end_time)
router.post('/reservations', authenticateToken, authorizeRoles('guest', 'user', 'landlord', 'admin'), createReservation);

// GET /api/reservations/my — autorizētā lietotāja rezervācijas (query: status, limit, offset)
router.get('/reservations/my', authenticateToken, getMyReservations);

// PATCH /api/reservations/:id/cancel — atcelt rezervāciju
router.patch('/reservations/:id/cancel', authenticateToken, cancelReservation);

// ─── Atsauksmju galapunkts (prasa autentifikāciju) ────────────────────────────

// POST /api/reviews — jauna atsauksme pēc pabeigtas rezervācijas
// Body: { reservation_id, rating (1-5), comment? }
router.post('/reviews', authenticateToken, authorizeRoles('guest', 'user', 'landlord', 'admin'), createReview);

export default router;
