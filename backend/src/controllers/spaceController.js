import { spaceService, reservationService, reviewService, NotFoundError, ValidationError, ConflictError } from '../services/spaceService.js';

// ─── Spaces ───────────────────────────────────────────────────────────────────

/**
 * GET /api/spaces
 * Atlasa aktīvās telpas ar filtriem.
 * Query params: location, city, type, period (hour|day),
 *               price_min, price_max, instant_book, limit, offset
 */
export async function listSpaces(req, res, next) {
  try {
    const {
      location = '',
      city = '',
      type,
      period = 'day',
      price_min,
      price_max,
      instant_book,
      amenities,
      limit = '20',
      offset = '0',
    } = req.query;

    // Validācija
    const errors = [];

    const validPeriods = ['hour', 'day'];
    if (!validPeriods.includes(period)) {
      errors.push({ field: 'period', message: 'Cenu periodam jābūt hour vai day.' });
    }

    const validTypes = ['hot-desk', 'dedicated', 'private-office', 'meeting-room'];
    if (type && !validTypes.includes(type)) {
      errors.push({ field: 'type', message: `Telpas veids jābūt: ${validTypes.join(', ')}.` });
    }

    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'limit jābūt veselam skaitlim no 1 līdz 100.' });
    }
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      errors.push({ field: 'offset', message: 'offset jābūt veselam skaitlim >= 0.' });
    }

    let priceMinNum;
    let priceMaxNum;
    if (price_min !== undefined) {
      priceMinNum = Number(price_min);
      if (isNaN(priceMinNum) || priceMinNum < 0) {
        errors.push({ field: 'price_min', message: 'price_min jābūt pozitīvam skaitlim.' });
      }
    }
    if (price_max !== undefined) {
      priceMaxNum = Number(price_max);
      if (isNaN(priceMaxNum) || priceMaxNum < 0) {
        errors.push({ field: 'price_max', message: 'price_max jābūt pozitīvam skaitlim.' });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Nederīgi parametri.', errors });
    }

    const spaces = await spaceService.listSpaces({
      location: location.trim(),
      city: city.trim(),
      type: type || null,
      period,
      price_min: priceMinNum,
      price_max: priceMaxNum,
      instant_book: instant_book === 'true' || instant_book === '1',
      amenities: amenities || null,
      limit: limitNum,
      offset: offsetNum,
    });

    return res.status(200).json({
      success: true,
      count: spaces.length,
      data: spaces,
      spaces,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: spaces.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/spaces/:id
 * Iegūst detalizētu informāciju par konkrētu telpu, ieskaitot fotoattēlus un atsauksmes kopsavilkumu.
 */
export async function getSpaceById(req, res, next) {
  try {
    const spaceId = Number(req.params.id);
    if (!Number.isInteger(spaceId) || spaceId < 1) {
      return res.status(400).json({ success: false, message: 'Nederīgs telpas identifikators.' });
    }

    const space = await spaceService.getSpaceById(spaceId);

    return res.status(200).json({ success: true, data: space });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/spaces/:id/reviews
 * Iegūst atsauksmes par konkrētu telpu (ar lapošanu).
 * Query: limit, offset
 */
export async function getSpaceReviews(req, res, next) {
  try {
    const spaceId = Number(req.params.id);
    if (!Number.isInteger(spaceId) || spaceId < 1) {
      return res.status(400).json({ success: false, message: 'Nederīgs telpas identifikators.' });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const offset = Number(req.query.offset) || 0;

    const reviews = await spaceService.getSpaceReviews(spaceId, { limit, offset });

    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
}

// ─── Reservations ─────────────────────────────────────────────────────────────

/**
 * POST /api/reservations
 * Izveido jaunu rezervāciju (prasa autentifikāciju, loma: user vai landlord).
 * Body: { space_id, reservation_type, guest_count, start_time, end_time }
 */
export async function createReservation(req, res, next) {
  try {
    const { space_id, reservation_type, guest_count, start_time, end_time } = req.body;
    const user_id = req.user.user_id;

    const errors = [];

    if (!space_id || !Number.isInteger(Number(space_id)) || Number(space_id) < 1) {
      errors.push({ field: 'space_id', message: 'space_id ir obligāts un jābūt pozitīvam skaitlim.' });
    }
    if (!start_time) {
      errors.push({ field: 'start_time', message: 'start_time ir obligāts.' });
    }
    if (!end_time) {
      errors.push({ field: 'end_time', message: 'end_time ir obligāts.' });
    }
    if (reservation_type && !['individual', 'group'].includes(reservation_type)) {
      errors.push({ field: 'reservation_type', message: "reservation_type jābūt 'individual' vai 'group'." });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Nederīgi ievades dati.', errors });
    }

    const reservation = await reservationService.createReservation({
      space_id: Number(space_id),
      user_id,
      reservation_type: reservation_type || 'individual',
      guest_count: Number(guest_count) || 1,
      start_time,
      end_time,
    });

    return res.status(201).json({
      success: true,
      message: 'Rezervācija veiksmīgi izveidota.',
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations/my
 * Iegūst autorizētā lietotāja rezervācijas.
 * Query: status (pending|confirmed|canceled), limit, offset
 */
export async function getMyReservations(req, res, next) {
  try {
    const user_id = req.user.user_id;
    const { status, limit = '20', offset = '0' } = req.query;

    const reservations = await reservationService.getMyReservations(user_id, {
      status,
      limit: Math.min(Number(limit) || 20, 100),
      offset: Number(offset) || 0,
    });

    return res.status(200).json({ success: true, count: reservations.length, data: reservations });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/reservations/:id/cancel
 * Atceļ rezervāciju (tikai tās īpašnieks vai admin).
 */
export async function cancelReservation(req, res, next) {
  try {
    const reservationId = Number(req.params.id);
    if (!Number.isInteger(reservationId) || reservationId < 1) {
      return res.status(400).json({ success: false, message: 'Nederīgs rezervācijas identifikators.' });
    }

    const result = await reservationService.cancelReservation(
      reservationId,
      req.user.user_id,
      req.user.role_name
    );

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * POST /api/reviews
 * Pievieno atsauksmi pēc pabeigtas rezervācijas.
 * Body: { reservation_id, rating (1-5), comment (optional) }
 */
export async function createReview(req, res, next) {
  try {
    const { reservation_id, rating, comment } = req.body;
    const user_id = req.user.user_id;

    const errors = [];
    if (!reservation_id || !Number.isInteger(Number(reservation_id)) || Number(reservation_id) < 1) {
      errors.push({ field: 'reservation_id', message: 'reservation_id ir obligāts.' });
    }
    if (rating === undefined || rating === null) {
      errors.push({ field: 'rating', message: 'rating ir obligāts (1-5).' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Nederīgi ievades dati.', errors });
    }

    const review = await reviewService.createReview({
      reservation_id: Number(reservation_id),
      user_id,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: 'Atsauksme veiksmīgi pievienota.',
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Managed Spaces & Dashboard (Host / Admin) ──────────────────────────────

/**
 * GET /api/spaces/managed
 */
export async function getManagedSpaces(req, res, next) {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role_name;
    const spaces = await spaceService.getManagedSpaces(userId, userRole);

    const activeSpaces = spaces.filter(s => s.is_active === 1).length;
    const pendingRequests = spaces.reduce((acc, s) => acc + (Number(s.pending_bookings) || 0), 0);
    const totalSpots = spaces.reduce((acc, s) => acc + (Number(s.available_spots) || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        total_spaces: spaces.length,
        active_spaces: activeSpaces,
        pending_requests: pendingRequests,
        total_spots: totalSpots,
      },
      data: spaces,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/spaces/managed/reservations
 */
export async function getManagedReservations(req, res, next) {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role_name;
    const reservations = await spaceService.getManagedReservations(userId, userRole);

    return res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/spaces/managed
 */
export async function createManagedSpace(req, res, next) {
  try {
    const userId = req.user.user_id;
    const space = await spaceService.createSpace(req.body, userId);
    return res.status(201).json({
      success: true,
      message: 'Telpa veiksmīgi izveidota.',
      data: space,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/spaces/managed/:id
 */
export async function updateManagedSpace(req, res, next) {
  try {
    const spaceId = Number(req.params.id);
    const userId = req.user.user_id;
    const userRole = req.user.role_name;

    const space = await spaceService.updateSpace(spaceId, req.body, userId, userRole);
    return res.status(200).json({
      success: true,
      message: 'Telpa veiksmīgi atjaunināta.',
      data: space,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/spaces/managed/:id
 */
export async function deleteManagedSpace(req, res, next) {
  try {
    const spaceId = Number(req.params.id);
    const userId = req.user.user_id;
    const userRole = req.user.role_name;

    const result = await spaceService.deleteSpace(spaceId, userId, userRole);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/spaces/managed/reservations/:id
 */
export async function updateManagedReservation(req, res, next) {
  try {
    const reservationId = Number(req.params.id);
    const { status } = req.body;
    const userId = req.user.user_id;
    const userRole = req.user.role_name;

    const result = await spaceService.updateReservationStatus(reservationId, status, userId, userRole);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
