import { query } from '../config/db.js';
import { parseAmenities, serializeAmenities } from './spaceService.js';

export const adminService = {
  async getStats() {
    const { rows: userCount } = await query('SELECT COUNT(*) AS count FROM users');
    const { rows: spaceCount } = await query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
             SUM(available_spots) AS spots
      FROM coworking_spaces
    `);
    const { rows: resCount } = await query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN reservation_status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
             SUM(CASE WHEN reservation_status = 'pending' THEN 1 ELSE 0 END) AS pending,
             SUM(CASE WHEN reservation_status = 'confirmed' THEN amount ELSE 0 END) AS revenue
      FROM reservations
    `);

    return {
      total_users: Number(userCount[0]?.count || 0),
      total_spaces: Number(spaceCount[0]?.total || 0),
      active_spaces: Number(spaceCount[0]?.active || 0),
      total_spots: Number(spaceCount[0]?.spots || 0),
      total_reservations: Number(resCount[0]?.total || 0),
      confirmed_reservations: Number(resCount[0]?.confirmed || 0),
      pending_requests: Number(resCount[0]?.pending || 0),
      total_revenue: Number(resCount[0]?.revenue || 0).toFixed(2),
    };
  },

  async getAllUsers() {
    const { rows } = await query(`
      SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number,
             u.role_id, r.role_name, u.created_at,
             (SELECT COUNT(*) FROM reservations res WHERE res.user_id = u.user_id) AS total_reservations,
             (SELECT COUNT(*) FROM coworking_spaces sp WHERE sp.creator_id = u.user_id) AS total_spaces
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      ORDER BY u.user_id ASC
    `);
    return rows;
  },

  async updateUser(userId, data) {
    const { rows: existing } = await query('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!existing || existing.length === 0) {
      throw new Error('Lietotājs nav atrasts.');
    }
    const current = existing[0];

    const fname = data.fname !== undefined ? data.fname.trim() : current.fname;
    const surname = data.surname !== undefined ? data.surname.trim() : current.surname;
    const username = data.username !== undefined ? data.username.trim() : current.username;
    const email = data.email !== undefined ? data.email.trim().toLowerCase() : current.email;
    const phone = data.phone_number !== undefined ? data.phone_number.trim() : current.phone_number;
    let roleId = current.role_id;

    if (data.role_name) {
      const { rows: rRows } = await query('SELECT role_id FROM roles WHERE role_name = ?', [data.role_name.toLowerCase()]);
      if (rRows && rRows.length > 0) roleId = rRows[0].role_id;
    } else if (data.role_id !== undefined) {
      roleId = Number(data.role_id);
    }

    await query(
      `UPDATE users
       SET fname = ?, surname = ?, username = ?, email = ?, phone_number = ?, role_id = ?
       WHERE user_id = ?`,
      [fname, surname, username, email, phone, roleId, userId]
    );

    const { rows: updated } = await query(`
      SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number,
             u.role_id, r.role_name, u.created_at
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = ?
    `, [userId]);

    return updated[0];
  },

  async deleteUser(userId) {
    await query('DELETE FROM payment_history WHERE reservation_id IN (SELECT reservation_id FROM reservations WHERE user_id = ?)', [userId]);
    await query('DELETE FROM reviews WHERE user_id = ?', [userId]);
    await query('DELETE FROM reservations WHERE user_id = ?', [userId]);
    
    // Also delete any spaces created by this user
    const { rows: userSpaces } = await query('SELECT space_id FROM coworking_spaces WHERE creator_id = ?', [userId]);
    for (const sp of userSpaces) {
      await adminService.deleteSpace(sp.space_id);
    }
    
    await query('DELETE FROM users WHERE user_id = ?', [userId]);
    return { success: true, message: 'Lietotājs veiksmīgi dzēsts.' };
  },

  async getAllSpaces() {
    const { rows } = await query(`
      SELECT s.space_id, s.creator_id, s.space_name, s.city, s.address, s.space_type,
             s.space_description, s.available_spots, s.price_per_hour, s.price_per_day,
             s.is_instant_book, s.is_active, s.amenities, s.created_at,
             u.fname AS creator_fname, u.surname AS creator_surname, u.email AS creator_email,
             (SELECT p.photo_path FROM photos p WHERE p.space_id = s.space_id ORDER BY p.photo_id ASC LIMIT 1) AS photo_path,
             (SELECT COUNT(*) FROM reservations res WHERE res.space_id = s.space_id) AS total_bookings,
             (SELECT COUNT(*) FROM reservations res WHERE res.space_id = s.space_id AND res.reservation_status = 'pending') AS pending_bookings
      FROM coworking_spaces s
      LEFT JOIN users u ON u.user_id = s.creator_id
      ORDER BY s.space_id DESC
    `);
    return rows.map((r) => ({
      ...r,
      amenities: parseAmenities(r.amenities),
    }));
  },

  async updateSpace(spaceId, data) {
    const { rows: existing } = await query('SELECT * FROM coworking_spaces WHERE space_id = ?', [spaceId]);
    if (!existing || existing.length === 0) {
      throw new Error('Telpa nav atrasta.');
    }
    const space = existing[0];

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

  async deleteSpace(spaceId) {
    await query('DELETE FROM photos WHERE space_id = ?', [spaceId]);
    await query('DELETE FROM reviews WHERE space_id = ?', [spaceId]);
    await query('DELETE FROM payment_history WHERE reservation_id IN (SELECT reservation_id FROM reservations WHERE space_id = ?)', [spaceId]);
    await query('DELETE FROM reservations WHERE space_id = ?', [spaceId]);
    await query('DELETE FROM coworking_spaces WHERE space_id = ?', [spaceId]);
    return { success: true, message: 'Telpa veiksmīgi dzēsta.' };
  },

  async getAllReservations() {
    const { rows } = await query(`
      SELECT res.reservation_id, res.space_id, res.user_id, res.reservation_type,
             res.guest_count, res.amount, res.start_time, res.end_time,
             res.reservation_status, res.created_at,
             s.space_name, s.address, s.city,
             u.fname, u.surname, u.email, u.phone_number, u.username
      FROM reservations res
      JOIN coworking_spaces s ON s.space_id = res.space_id
      JOIN users u ON u.user_id = res.user_id
      ORDER BY res.reservation_id DESC
    `);
    return rows;
  },

  async updateReservationStatus(reservationId, status) {
    const validStatuses = ['confirmed', 'canceled', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new Error('Nederīgs statuss.');
    }
    await query(
      'UPDATE reservations SET reservation_status = ? WHERE reservation_id = ?',
      [status, reservationId]
    );
    return { success: true, message: `Rezervācijas statuss nomainīts uz ${status}.` };
  },
};
