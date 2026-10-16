import { Router } from 'express';
import {
  listSpaces,
  getSpaceById,
  getSpaceReviews,
  createReservation,
  getMyReservations,
  cancelReservation,
  createReview,
} from '../controllers/spaceController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// ─── Telpu publiskie galapunkti ────────────────────────────────────────────────

// GET /api/spaces — telpu saraksts ar filtriem (city, type, price_min, price_max, instant_book, ...)
router.get('/', listSpaces);

// GET /api/spaces/:id — viena telpas detalizēta informācija (ar foto un atsauksmju kopsavilkumu)
router.get('/:id', getSpaceById);

// GET /api/spaces/:id/reviews — telpas atsauksmes (lapošana: limit, offset)
router.get('/:id/reviews', getSpaceReviews);

// ─── Rezervāciju galapunkti (prasa autentifikāciju) ───────────────────────────

// POST /api/reservations — jauna rezervācija (body: space_id, reservation_type, guest_count, start_time, end_time)
router.post('/reservations', authenticateToken, authorizeRoles('user', 'landlord', 'admin'), createReservation);

// GET /api/reservations/my — autorizētā lietotāja rezervācijas (query: status, limit, offset)
router.get('/reservations/my', authenticateToken, getMyReservations);

// PATCH /api/reservations/:id/cancel — atcelt rezervāciju
router.patch('/reservations/:id/cancel', authenticateToken, cancelReservation);

// ─── Atsauksmju galapunkts (prasa autentifikāciju) ────────────────────────────

// POST /api/reviews — jauna atsauksme pēc pabeigtas rezervācijas
// Body: { reservation_id, rating (1-5), comment? }
router.post('/reviews', authenticateToken, authorizeRoles('user', 'landlord', 'admin'), createReview);

export default router;
