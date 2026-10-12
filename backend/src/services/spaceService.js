import { query } from '../config/db.js';

export const spaceService = {
  /**
   * Atlasa aktīvās telpas. Filtri ir pārbaudīti validateSpaceQuery.
   * Attēli un atsauksmes tiek atlasīti atsevišķi, lai nedublētu telpas.
   */
  async listSpaces({ location, period, limit, offset }) {
    const params = [];
    let locationFilter = '';

    if (location) {
      // LIKE speciālie simboli tiek meklēti kā parasts teksts.
      const search = `%${location.replace(/[!%_]/g, '!$&')}%`;
      locationFilter = "AND LOWER(s.address) LIKE LOWER(?) ESCAPE '!'";
      params.push(search);
    }

    // LIMIT/OFFSET tekstā ievieto tikai pārbaudītus veselus skaitļus.
    // Meklēšanas teksts vienmēr tiek nodots kā SQL parametrs.
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
        !Number.isSafeInteger(offset) || offset < 0) {
      throw new Error('Nederīgi lapošanas parametri.');
    }

    const { rows } = await query(
      `SELECT s.space_id, s.space_name, s.address, s.price_per_hour, s.price_per_day,
              (SELECT p.photo_path FROM photos p
               WHERE p.space_id = s.space_id ORDER BY p.photo_id ASC LIMIT 1) AS photo_path,
              r.average_rating, COALESCE(r.review_count, 0) AS review_count
       FROM coworking_spaces s
       LEFT JOIN (
         SELECT space_id, ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS review_count
         FROM reviews GROUP BY space_id
       ) r ON r.space_id = s.space_id
       WHERE s.is_active = TRUE ${locationFilter}
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
        address: row.address,
        price_per_hour: pricePerHour,
        price_per_day: pricePerDay,
        price: period === 'hour' ? pricePerHour : pricePerDay,
        price_period: period,
        photo_path: row.photo_path ?? null,
        average_rating: row.average_rating === null ? null : Number(row.average_rating),
        review_count: Number(row.review_count),
      };
    });
  },
};
