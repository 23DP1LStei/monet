import { query } from '../config/db.js';

/**
 * Pielāgots kļūdas tips - telpa nav atrasta
 */
export class NotFoundError extends Error {
  constructor(message = 'Nav atrasts.') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

/**
 * Pielāgots kļūdas tips - konfliktējoša rezervācija
 */
export class ConflictError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.field = field;
  }
}

/**
 * Pielāgots kļūdas tips - nederīgi ievades dati
 */
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

// ─── Palīgfunkcijas ──────────────────────────────────────────────────────────

/**
 * Formatē datumu kā 'YYYY-MM-DD HH:mm:ss' (MySQL/SQLite saderīgs)
 */
function toSqlDatetime(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) throw new ValidationError('Nederīgs datuma formāts.');
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Aprēķina rezervācijas summu atkarībā no laika intervāla un telpas cenām
 */
function calcAmount(startTime, endTime, pricePerHour, pricePerDay) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  if (diffMs <= 0) throw new ValidationError('Beigu laikam jābūt vēlākam par sākuma laiku.');

  const diffHours = diffMs / (1000 * 60 * 60);
  // Ja ilgāk par 6h — izmanto dienas cenu (proporcionāli)
  if (diffHours >= 6) {
    const days = Math.ceil(diffHours / 24);
    return parseFloat((days * pricePerDay).toFixed(2));
  }
  return parseFloat((diffHours * pricePerHour).toFixed(2));
}

/**
 * Palīgfunkcija: droši parsē ērtību sarakstu no JSON vai string
 */
export function parseAmenities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof raw === 'string' ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
}

/**
 * Palīgfunkcija: serializē ērtību sarakstu uz JSON string glabāšanai DB
 */
export function serializeAmenities(raw) {
  if (!raw) return '[]';
  if (Array.isArray(raw)) return JSON.stringify(raw);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
    } catch {}
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return JSON.stringify(items);
  }
  return '[]';
}

// ─── Space Service ────────────────────────────────────────────────────────────

export const spaceService = {
  /**
   * Atlasa aktīvās telpas ar filtrēšanu un lapošanu.
   * Atbalstītie filtri: location, city, type, period, price_min, price_max, instant_book, amenities, limit, offset
   */
  async listSpaces({ location, city, type, period, price_min, price_max, instant_book, amenities, limit, offset }) {
    const params = [];
    const conditions = ['s.is_active = TRUE'];

    if (location) {
      const search = `%${location.replace(/[!%_]/g, '!$&')}%`;
      conditions.push("LOWER(s.address) LIKE LOWER(?) ESCAPE '!'");
      params.push(search);
    }

    if (city) {
      const search = `%${city.replace(/[!%_]/g, '!$&')}%`;
      conditions.push("LOWER(s.city) LIKE LOWER(?) ESCAPE '!'");
      params.push(search);
    }

    if (type) {
      conditions.push('s.space_type = ?');
      params.push(type);
    }

    if (price_min !== undefined) {
      const col = period === 'hour' ? 's.price_per_hour' : 's.price_per_day';
      conditions.push(`${col} >= ?`);
      params.push(price_min);
    }

    if (price_max !== undefined) {
      const col = period === 'hour' ? 's.price_per_hour' : 's.price_per_day';
      conditions.push(`${col} <= ?`);
      params.push(price_max);
    }

    if (instant_book === true) {
      conditions.push('s.is_instant_book = TRUE');
    }

    if (amenities) {
      const reqAmenities = Array.isArray(amenities)
        ? amenities
        : String(amenities).split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);

      for (const item of reqAmenities) {
        conditions.push("LOWER(COALESCE(s.amenities, '[]')) LIKE ?");
        params.push(`%"${item}"%`);
      }
    }

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
        !Number.isSafeInteger(offset) || offset < 0) {
      throw new ValidationError('Nederīgi lapošanas parametri.');
    }

    const whereClause = conditions.join(' AND ');

    const { rows } = await query(
      `SELECT s.space_id, s.space_name, s.city, s.address, s.space_type,
              s.available_spots, s.price_per_hour, s.price_per_day,
              s.is_instant_book, s.amenities,
              (SELECT p.photo_path FROM photos p
               WHERE p.space_id = s.space_id ORDER BY p.photo_id ASC LIMIT 1) AS photo_path,
              r.average_rating, COALESCE(r.review_count, 0) AS review_count
       FROM coworking_spaces s
       LEFT JOIN (
         SELECT space_id, ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS review_count
         FROM reviews GROUP BY space_id
       ) r ON r.space_id = s.space_id
       WHERE ${whereClause}
       ORDER BY s.space_id ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return rows.map((row) => {
      const pricePerHour = Number(row.price_per_hour);
      const pricePerDay = Number(row.price_per_day);
      return {
        space_id: row.space_id,
        space_name: row.space_name,
        city: row.city || '',
        address: row.address,
        space_type: row.space_type || 'hot-desk',
        available_spots: Number(row.available_spots),
        price_per_hour: pricePerHour,
        price_per_day: pricePerDay,
        price: period === 'hour' ? pricePerHour : pricePerDay,
        price_period: period || 'day',
        is_instant_book: Boolean(row.is_instant_book),
        amenities: parseAmenities(row.amenities),
        photo_path: row.photo_path ?? null,
        average_rating: row.average_rating === null ? null : Number(row.average_rating),
        review_count: Number(row.review_count),
      };
    });
  },

  /**
   * Atlasa konkrētu telpu pēc space_id (ar fotoattēliem un atsauksmēm)
   */
  async getSpaceById(spaceId) {
    const { rows: spaceRows } = await query(
      `SELECT s.space_id, s.space_name, s.city, s.address, s.space_type,
              s.space_description, s.available_spots,
              s.price_per_hour, s.price_per_day,
              s.is_instant_book, s.is_active, s.amenities, s.created_at,
              u.user_id AS creator_id, u.username AS creator_username,
              r.average_rating, COALESCE(r.review_count, 0) AS review_count
       FROM coworking_spaces s
       JOIN users u ON u.user_id = s.creator_id
       LEFT JOIN (
         SELECT space_id, ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS review_count
         FROM reviews GROUP BY space_id
       ) r ON r.space_id = s.space_id
       WHERE s.space_id = ? AND s.is_active = TRUE`,
      [spaceId]
    );

    if (!spaceRows || spaceRows.length === 0) {
      throw new NotFoundError('Telpa nav atrasta vai nav pieejama.');
    }

    const space = spaceRows[0];

    // Iegūst visus fotoattēlus
    const { rows: photos } = await query(
      'SELECT photo_id, photo_path FROM photos WHERE space_id = ? ORDER BY photo_id ASC',
      [spaceId]
    );

    return {
      space_id: space.space_id,
      space_name: space.space_name,
      city: space.city || '',
      address: space.address,
      space_type: space.space_type || 'hot-desk',
      space_description: space.space_description || '',
      available_spots: Number(space.available_spots),
      price_per_hour: Number(space.price_per_hour),
      price_per_day: Number(space.price_per_day),
      is_instant_book: Boolean(space.is_instant_book),
      amenities: parseAmenities(space.amenities),
      created_at: space.created_at,
      creator: {
        user_id: space.creator_id,
        username: space.creator_username,
      },
      average_rating: space.average_rating === null ? null : Number(space.average_rating),
      review_count: Number(space.review_count),
      photos: photos.map((p) => ({ photo_id: p.photo_id, photo_path: p.photo_path })),
    };
  },

  /**
   * Atlasa telpu atsauksmes
   */
  async getSpaceReviews(spaceId, { limit = 10, offset = 0 } = {}) {
    // Pārliecinās, ka telpa eksistē
    const { rows: check } = await query(
      'SELECT space_id FROM coworking_spaces WHERE space_id = ? AND is_active = TRUE',
      [spaceId]
    );
    if (!check || check.length === 0) {
      throw new NotFoundError('Telpa nav atrasta.');
    }

    const { rows } = await query(
      `SELECT rv.review_id, rv.rating, rv.comment, rv.created_at,
              u.user_id, u.username, u.fname, u.surname
       FROM reviews rv
       JOIN users u ON u.user_id = rv.user_id
       WHERE rv.space_id = ?
       ORDER BY rv.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [spaceId]
    );

    return rows.map((r) => ({
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment || '',
      created_at: r.created_at,
      user: {
        user_id: r.user_id,
        username: r.username,
        name: `${r.fname} ${r.surname}`,
      },
    }));
  },
};

// ─── Reservation Service ──────────────────────────────────────────────────────

export const reservationService = {
  /**
   * Izveido jaunu rezervāciju
   */
  async createReservation({ space_id, user_id, reservation_type, guest_count, start_time, end_time }) {
    // 1. Pārbauda telpas esamību un cenas
    const { rows: spaceRows } = await query(
      'SELECT space_id, price_per_hour, price_per_day, available_spots, is_active FROM coworking_spaces WHERE space_id = ?',
      [space_id]
    );
    if (!spaceRows || spaceRows.length === 0 || !spaceRows[0].is_active) {
      throw new NotFoundError('Telpa nav atrasta vai nav pieejama.');
    }
    const space = spaceRows[0];

    // 2. Pārbauda laika intervālu
    const sqlStart = toSqlDatetime(start_time);
    const sqlEnd = toSqlDatetime(end_time);
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (endDate <= startDate) {
      throw new ValidationError('Beigu laikam jābūt vēlākam par sākuma laiku.');
    }

    // 3. Pārbauda viesu skaitu
    const count = Number(guest_count) || 1;
    if (count < 1 || count > Number(space.available_spots)) {
      throw new ValidationError(
        `Viesu skaitam jābūt no 1 līdz ${space.available_spots}.`
      );
    }

    // 4. Pārbauda pārklāšanos ar citām rezervācijām
    const { rows: overlapping } = await query(
      `SELECT reservation_id FROM reservations
       WHERE space_id = ?
         AND reservation_status != 'canceled'
         AND start_time < ? AND end_time > ?`,
      [space_id, sqlEnd, sqlStart]
    );
    if (overlapping && overlapping.length > 0) {
      throw new ConflictError('Izvēlētais laika intervāls jau ir rezervēts.', 'start_time');
    }

    // 5. Aprēķina summu
    const amount = calcAmount(start_time, end_time, space.price_per_hour, space.price_per_day);

    // 6. Saglabā rezervāciju
    const now = toSqlDatetime(new Date());
    const { insertId } = await query(
      `INSERT INTO reservations
         (space_id, user_id, reservation_type, guest_count, amount, start_time, end_time, reservation_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [space_id, user_id, reservation_type || 'individual', count, amount, sqlStart, sqlEnd, now]
    );

    const reservationId = insertId;

    // 7. Ievieto maksājuma ierakstu
    await query(
      `INSERT INTO payment_history (reservation_id, amount, payment_status, created_at)
       VALUES (?, ?, 'successful', ?)`,
      [reservationId, amount, now]
    );

    // 8. Atjaunina rezervācijas statusu uz 'confirmed'
    await query(
      `UPDATE reservations SET reservation_status = 'confirmed' WHERE reservation_id = ?`,
      [reservationId]
    );

    // 9. Atgriež izveidoto rezervāciju ar telpas detaļām
    return await reservationService.getReservationById(reservationId);
  },

  /**
   * Iegūst atsevišķu rezervāciju pēc ID (ar telpas un lietotāja datiem)
   */
  async getReservationById(reservationId) {
    const { rows } = await query(
      `SELECT r.reservation_id, r.reservation_type, r.guest_count, r.amount,
              r.start_time, r.end_time, r.reservation_status, r.created_at,
              s.space_id, s.space_name, s.city, s.address,
              s.price_per_hour, s.price_per_day,
              (SELECT p.photo_path FROM photos p WHERE p.space_id = s.space_id ORDER BY p.photo_id ASC LIMIT 1) AS photo_path
       FROM reservations r
       JOIN coworking_spaces s ON s.space_id = r.space_id
       WHERE r.reservation_id = ?`,
      [reservationId]
    );

    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    return {
      reservation_id: row.reservation_id,
      reservation_type: row.reservation_type,
      guest_count: Number(row.guest_count),
      amount: Number(row.amount),
      start_time: row.start_time,
      end_time: row.end_time,
      reservation_status: row.reservation_status,
      created_at: row.created_at,
      space: {
        space_id: row.space_id,
        space_name: row.space_name,
        city: row.city || '',
        address: row.address,
        price_per_hour: Number(row.price_per_hour),
        price_per_day: Number(row.price_per_day),
        photo_path: row.photo_path ?? null,
      },
    };
  },

  /**
   * Iegūst konkrēta lietotāja rezervācijas ar neobligātu statusa filtru
   */
  async getMyReservations(userId, { status, limit = 20, offset = 0 } = {}) {
    const params = [userId];
    let statusFilter = '';

    if (status && ['pending', 'confirmed', 'canceled'].includes(status)) {
      statusFilter = 'AND r.reservation_status = ?';
      params.push(status);
    }

    if (!Number.isSafeInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) {
      throw new ValidationError('Nederīgi lapošanas parametri.');
    }

    const { rows } = await query(
      `SELECT r.reservation_id, r.reservation_type, r.guest_count, r.amount,
              r.start_time, r.end_time, r.reservation_status, r.created_at,
              s.space_id, s.space_name, s.city, s.address, s.space_type,
              (SELECT p.photo_path FROM photos p WHERE p.space_id = s.space_id ORDER BY p.photo_id ASC LIMIT 1) AS photo_path,
              rv.review_id,
              u.fname AS host_fname, u.surname AS host_surname, u.email AS host_email, u.phone_number AS host_phone
       FROM reservations r
       JOIN coworking_spaces s ON s.space_id = r.space_id
       LEFT JOIN users u ON u.user_id = s.creator_id
       LEFT JOIN reviews rv ON rv.reservation_id = r.reservation_id
       WHERE r.user_id = ? ${statusFilter}
       ORDER BY r.start_time DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    return rows.map((row) => ({
      reservation_id: row.reservation_id,
      reservation_type: row.reservation_type,
      guest_count: Number(row.guest_count),
      amount: Number(row.amount),
      start_time: row.start_time,
      end_time: row.end_time,
      reservation_status: row.reservation_status,
      created_at: row.created_at,
      has_review: !!row.review_id,
      space: {
        space_id: row.space_id,
        space_name: row.space_name,
        city: row.city || '',
        address: row.address,
        space_type: row.space_type || 'hot-desk',
        photo_path: row.photo_path ?? null,
        host: {
          name: row.host_fname ? `${row.host_fname} ${row.host_surname}` : 'Monet Host',
          email: row.host_email || 'support@monet.lv',
          phone: row.host_phone || '+371 20 000 002',
        },
      },
    }));
  },

  /**
   * Atceļ rezervāciju (tikai tās īpašnieks vai admin)
   */
  async cancelReservation(reservationId, userId, userRole) {
    const { rows } = await query(
      'SELECT reservation_id, user_id, reservation_status FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundError('Rezervācija nav atrasta.');
    }

    const reservation = rows[0];

    if (reservation.user_id !== userId && userRole !== 'admin') {
      throw new ValidationError('Jūs nevarat atcelt šo rezervāciju.');
    }

    if (reservation.reservation_status === 'canceled') {
      throw new ConflictError('Rezervācija jau ir atcelta.');
    }

    await query(
      `UPDATE reservations SET reservation_status = 'canceled' WHERE reservation_id = ?`,
      [reservationId]
    );

    // Atjauno maksājuma statusu uz refunded
    await query(
      `UPDATE payment_history SET payment_status = 'refunded' WHERE reservation_id = ?`,
      [reservationId]
    );

    return { message: 'Rezervācija veiksmīgi atcelta.' };
  },
};

// ─── Review Service ───────────────────────────────────────────────────────────

export const reviewService = {
  /**
   * Pievieno atsauksmi pēc pabeigtas rezervācijas
   */
  async createReview({ reservation_id, user_id, rating, comment }) {
    // 1. Pārbauda, vai rezervācija pieder šim lietotājam un ir pabeigta
    const { rows: resRows } = await query(
      `SELECT reservation_id, user_id, space_id, reservation_status, end_time
       FROM reservations WHERE reservation_id = ?`,
      [reservation_id]
    );

    if (!resRows || resRows.length === 0) {
      throw new NotFoundError('Rezervācija nav atrasta.');
    }

    const res = resRows[0];

    if (res.user_id !== user_id) {
      throw new ValidationError('Jūs nevarat pievienot atsauksmi šai rezervācijai.');
    }

    if (res.reservation_status !== 'confirmed') {
      throw new ValidationError('Atsauksmi var pievienot tikai apstiprinātai rezervācijai.');
    }

    const endTime = new Date(res.end_time);
    if (endTime > new Date()) {
      throw new ValidationError('Atsauksmi var pievienot tikai pēc rezervācijas beigām.');
    }

    // 2. Pārbauda, vai atsauksme jau eksistē
    const { rows: existing } = await query(
      'SELECT review_id FROM reviews WHERE reservation_id = ?',
      [reservation_id]
    );
    if (existing && existing.length > 0) {
      throw new ConflictError('Atsauksme šai rezervācijai jau eksistē.', 'reservation_id');
    }

    // 3. Validē vērtējumu
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new ValidationError('Vērtējumam jābūt veselam skaitlim no 1 līdz 5.');
    }

    // 4. Saglabā atsauksmi
    const now = toSqlDatetime(new Date());
    const { insertId } = await query(
      `INSERT INTO reviews (reservation_id, user_id, space_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reservation_id, user_id, res.space_id, ratingNum, comment || null, now]
    );

    const { rows: reviewRows } = await query(
      `SELECT rv.review_id, rv.rating, rv.comment, rv.created_at,
              u.user_id, u.username, u.fname, u.surname
       FROM reviews rv
       JOIN users u ON u.user_id = rv.user_id
       WHERE rv.review_id = ?`,
      [insertId]
    );

    const r = reviewRows[0];
    return {
      review_id: r.review_id,
      rating: r.rating,
      comment: r.comment || '',
      created_at: r.created_at,
      user: {
        user_id: r.user_id,
        username: r.username,
        name: `${r.fname} ${r.surname}`,
      },
    };
  },

  /**
   * Iegūst pārvaldītās telpas (landlord savas, admin visas)
   */
  async getManagedSpaces(userId, userRole) {
    let sql = `
      SELECT s.space_id, s.creator_id, s.space_name, s.city, s.address, s.space_type,
             s.space_description, s.available_spots, s.price_per_hour, s.price_per_day,
             s.is_instant_book, s.is_active, s.amenities, s.created_at,
             (SELECT p.photo_path FROM photos p WHERE p.space_id = s.space_id ORDER BY p.photo_id ASC LIMIT 1) AS photo_path,
             (SELECT COUNT(*) FROM reservations res WHERE res.space_id = s.space_id) AS total_bookings,
             (SELECT COUNT(*) FROM reservations res WHERE res.space_id = s.space_id AND res.reservation_status = 'pending') AS pending_bookings
      FROM coworking_spaces s
    `;
    const params = [];

    if (userRole !== 'admin') {
      sql += ' WHERE s.creator_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY s.space_id DESC';

    const { rows } = await query(sql, params);
    return rows.map((r) => ({
      ...r,
      amenities: parseAmenities(r.amenities),
    }));
  },

  /**
   * Iegūst ienākošās rezervācijas (landlord savu telpu rezervācijas, admin visas)
   */
  async getManagedReservations(userId, userRole) {
    let sql = `
      SELECT res.reservation_id, res.space_id, res.user_id, res.reservation_type,
             res.guest_count, res.amount, res.start_time, res.end_time,
             res.reservation_status, res.created_at,
             s.space_name, s.address, s.city,
             u.fname, u.surname, u.email, u.phone_number, u.username
      FROM reservations res
      JOIN coworking_spaces s ON s.space_id = res.space_id
      JOIN users u ON u.user_id = res.user_id
    `;
    const params = [];

    if (userRole !== 'admin') {
      sql += ' WHERE s.creator_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY res.reservation_id DESC';

    const { rows } = await query(sql, params);
    return rows;
  },

  /**
   * Izveido jaunu telpu
   */
  async createSpace(data, userId) {
    const {
      space_name,
      city = 'Riga',
      address,
      space_type = 'hot-desk',
      space_description = '',
      available_spots = 10,
      price_per_hour = 5.0,
      price_per_day = 25.0,
      photo_url = '',
      amenities = [],
    } = data;

    if (!space_name || !address) {
      throw new ValidationError('Telpas nosaukums un adrese ir obligāti.');
    }

    if (available_spots !== undefined) {
      const spotsNum = Number(available_spots);
      if (!Number.isInteger(spotsNum) || spotsNum <= 0) {
        throw new ValidationError('Pieejamo vietu skaitam jābūt pozitīvam veselam skaitlim.');
      }
    }

    if (price_per_hour !== undefined) {
      const priceNum = Number(price_per_hour);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new ValidationError('Stundas cenai jābūt pozitīvam skaitlim vai nullei.');
      }
    }

    if (price_per_day !== undefined) {
      const priceNum = Number(price_per_day);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new ValidationError('Dienas cenai jābūt pozitīvam skaitlim vai nullei.');
      }
    }

    const amenitiesJson = serializeAmenities(amenities);
    const now = toSqlDatetime(new Date());
    const { insertId } = await query(
      `INSERT INTO coworking_spaces
       (creator_id, space_name, city, address, space_type, space_description, available_spots, price_per_hour, price_per_day, is_instant_book, is_active, amenities, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      [
        userId,
        space_name.trim(),
        city.trim(),
        address.trim(),
        space_type,
        space_description.trim(),
        Number(available_spots) || 1,
        Number(price_per_hour) || 0,
        Number(price_per_day) || 0,
        amenitiesJson,
        now,
      ]
    );

    if (photo_url && photo_url.trim()) {
      await query(
        'INSERT INTO photos (space_id, photo_path) VALUES (?, ?)',
        [insertId, photo_url.trim()]
      );
    }

    const { rows } = await query('SELECT * FROM coworking_spaces WHERE space_id = ?', [insertId]);
    return {
      ...rows[0],
      amenities: parseAmenities(rows[0]?.amenities),
    };
  },

  /**
   * Rediģē esošu telpu
   */
  async updateSpace(spaceId, data, userId, userRole) {
    const { rows: existing } = await query('SELECT * FROM coworking_spaces WHERE space_id = ?', [spaceId]);
    if (!existing || existing.length === 0) {
      throw new NotFoundError('Telpa nav atrasta.');
    }

    const space = existing[0];
    if (userRole !== 'admin' && space.creator_id !== userId) {
      throw new ValidationError('Jums nav tiesību rediģēt šo telpu.');
    }

    const name = data.space_name !== undefined ? data.space_name.trim() : space.space_name;
    const address = data.address !== undefined ? data.address.trim() : space.address;
    const city = data.city !== undefined ? data.city.trim() : space.city;
    const type = data.space_type !== undefined ? data.space_type : space.space_type;
    const description = data.space_description !== undefined ? data.space_description.trim() : space.space_description;
    const spots = data.available_spots !== undefined ? Number(data.available_spots) : space.available_spots;
    const priceHour = data.price_per_hour !== undefined ? Number(data.price_per_hour) : space.price_per_hour;
    const priceDay = data.price_per_day !== undefined ? Number(data.price_per_day) : space.price_per_day;
    const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : space.is_active;
    const amenitiesJson = data.amenities !== undefined ? serializeAmenities(data.amenities) : space.amenities;

    await query(
      `UPDATE coworking_spaces
       SET space_name = ?, address = ?, city = ?, space_type = ?, space_description = ?,
           available_spots = ?, price_per_hour = ?, price_per_day = ?, is_active = ?, amenities = ?
       WHERE space_id = ?`,
      [name, address, city, type, description, spots, priceHour, priceDay, isActive, amenitiesJson, spaceId]
    );

    const { rows: updated } = await query('SELECT * FROM coworking_spaces WHERE space_id = ?', [spaceId]);
    return {
      ...updated[0],
      amenities: parseAmenities(updated[0]?.amenities),
    };
  },

  /**
   * Dzēš telpu
   */
  async deleteSpace(spaceId, userId, userRole) {
    const { rows: existing } = await query('SELECT * FROM coworking_spaces WHERE space_id = ?', [spaceId]);
    if (!existing || existing.length === 0) {
      throw new NotFoundError('Telpa nav atrasta.');
    }

    const space = existing[0];
    if (userRole !== 'admin' && space.creator_id !== userId) {
      throw new ValidationError('Jums nav tiesību dzēst šo telpu.');
    }

    // Delete associated photos, reviews, payments & reservations
    await query('DELETE FROM photos WHERE space_id = ?', [spaceId]);
    await query('DELETE FROM reviews WHERE space_id = ?', [spaceId]);
    await query('DELETE FROM payment_history WHERE reservation_id IN (SELECT reservation_id FROM reservations WHERE space_id = ?)', [spaceId]);
    await query('DELETE FROM reservations WHERE space_id = ?', [spaceId]);
    await query('DELETE FROM coworking_spaces WHERE space_id = ?', [spaceId]);

    return { success: true, message: 'Telpa veiksmīgi dzēsta.' };
  },

  /**
   * Atjaunina rezervācijas statusu (apstiprina vai noraida)
   */
  async updateReservationStatus(reservationId, status, userId, userRole) {
    const { rows: existing } = await query(
      `SELECT res.*, s.creator_id
       FROM reservations res
       JOIN coworking_spaces s ON s.space_id = res.space_id
       WHERE res.reservation_id = ?`,
      [reservationId]
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundError('Rezervācija nav atrasta.');
    }

    const validStatuses = ['confirmed', 'canceled', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Nederīgs statuss.');
    }

    await query(
      'UPDATE reservations SET reservation_status = ? WHERE reservation_id = ?',
      [status, reservationId]
    );

    return { success: true, message: `Rezervācijas statuss mainīts uz '${status}'.` };
  },
};

// Mirror managed methods to spaceService
spaceService.getManagedSpaces = reviewService.getManagedSpaces;
spaceService.getManagedReservations = reviewService.getManagedReservations;
spaceService.createSpace = reviewService.createSpace;
spaceService.updateSpace = reviewService.updateSpace;
spaceService.deleteSpace = reviewService.deleteSpace;
spaceService.updateReservationStatus = reviewService.updateReservationStatus;

