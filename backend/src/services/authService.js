import bcrypt from 'bcryptjs';
import { query, getDriverName } from '../config/db.js';
import { generateToken } from '../middleware/auth.js';

export class ConflictError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.field = field;
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

/**
 * Formatē pašreizējo UTC laiku kā 'YYYY-MM-DD HH:mm:ss',
 * kas ir saderīgs gan ar MySQL DATETIME, gan SQLite formātu
 */
function currentSqlDatetime() {
  const d = new Date();
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export const authService = {
  /**
   * Reģistrē jaunu lietotāju sistēmā
   * @param {Object} data Lietotāja ievades dati
   */
  async register(data) {
    const {
      username,
      fname,
      surname,
      email,
      phone_number,
      password,
      role = 'user',
    } = data;

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone_number.trim();

    // 1. Pārbauda unikālo lauku esamību (username, email, phone_number)
    const { rows: existingUsers } = await query(
      'SELECT user_id, username, email, phone_number FROM users WHERE username = ? OR email = ? OR phone_number = ?',
      [trimmedUsername, trimmedEmail, trimmedPhone]
    );

    if (existingUsers && existingUsers.length > 0) {
      for (const u of existingUsers) {
        if (u.username.toLowerCase() === trimmedUsername.toLowerCase()) {
          throw new ConflictError('Lietotājvārds jau ir aizņemts.', 'username');
        }
        if (u.email.toLowerCase() === trimmedEmail) {
          throw new ConflictError('E-pasta adrese jau ir reģistrēta.', 'email');
        }
        if (u.phone_number === trimmedPhone) {
          throw new ConflictError('Tālruņa numurs jau ir reģistrēts.', 'phone_number');
        }
      }
    }

    // 2. Nosaka lomas identifikatoru (role_id)
    let roleId = 2; // Noklusējuma loma 'user'
    let roleName = 'user';
    const { rows: roleRows } = await query(
      'SELECT role_id, role_name FROM roles WHERE role_name = ?',
      [role.toLowerCase()]
    );

    if (roleRows && roleRows.length > 0) {
      roleId = roleRows[0].role_id;
      roleName = roleRows[0].role_name;
    }

    // 3. Hešē paroli ar bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const createdAt = currentSqlDatetime();

    // 4. Saglabā jauno lietotāju datubāzē
    let insertResult;
    try {
      insertResult = await query(
        `INSERT INTO users (username, fname, surname, email, phone_number, role_id, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trimmedUsername,
          fname.trim(),
          surname.trim(),
          trimmedEmail,
          trimmedPhone,
          roleId,
          passwordHash,
          createdAt,
        ]
      );
    } catch (dbErr) {
      const errMsg = dbErr.message || '';
      if (errMsg.includes('users.email') || errMsg.includes("key 'email'") || (dbErr.code === 'ER_DUP_ENTRY' && errMsg.includes('email'))) {
        throw new ConflictError('E-pasta adrese jau ir reģistrēta.', 'email');
      }
      if (errMsg.includes('users.username') || errMsg.includes("key 'username'") || (dbErr.code === 'ER_DUP_ENTRY' && errMsg.includes('username'))) {
        throw new ConflictError('Lietotājvārds jau ir aizņemts.', 'username');
      }
      if (errMsg.includes('users.phone_number') || errMsg.includes("key 'phone_number'") || (dbErr.code === 'ER_DUP_ENTRY' && errMsg.includes('phone_number'))) {
        throw new ConflictError('Tālruņa numurs jau ir reģistrēts.', 'phone_number');
      }
      throw dbErr;
    }

    let newUserId = insertResult.insertId;
    if (!newUserId) {
      const { rows } = await query('SELECT user_id FROM users WHERE email = ?', [trimmedEmail]);
      if (rows && rows.length > 0) {
        newUserId = rows[0].user_id;
      }
    }

    // 5. Iegūst izveidotā lietotāja datus (bez password_hash)
    const { rows: userRows } = await query(
      `SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number, u.role_id, r.role_name, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [newUserId]
    );

    const user = userRows[0];
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
    });

    return { user, token };
  },

  /**
   * Autentificē lietotāju pēc e-pasta (vai lietotājvārda) un paroles
   * @param {Object} credentials Lietotāja akreditācijas dati
   */
  async login(credentials) {
    const { email, identifier, username, password } = credentials;
    const loginId = (email || identifier || username || '').trim().toLowerCase();

    // Meklē lietotāju pēc e-pasta vai lietotājvārda
    const { rows } = await query(
      `SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number, u.role_id, u.password_hash, u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.email) = ? OR LOWER(u.username) = ?`,
      [loginId, loginId]
    );

    if (!rows || rows.length === 0) {
      throw new AuthenticationError('Nepareizs e-pasts vai parole.');
    }

    const userRecord = rows[0];

    // Pārbauda paroles hešu
    const isPasswordValid = await bcrypt.compare(password, userRecord.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Nepareizs e-pasts vai parole.');
    }

    // Noņem paroles hešu no atbildes objekta
    const { password_hash, ...user } = userRecord;

    // Ģenerē JWT marķieri
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
    });

    return { user, token };
  },

  /**
   * Iegūst lietotāja profilu pēc user_id
   * @param {number} userId Lietotāja identifikators
   */
  async getProfile(userId) {
    const { rows } = await query(
      `SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number, u.role_id, r.role_name, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    return rows[0];
  },

  /**
   * Atgriež visu sistēmas lomu sarakstu
   */
  async listRoles() {
    const { rows } = await query(
      'SELECT role_id, role_name FROM roles ORDER BY role_id ASC'
    );
    return rows;
  },

  /**
   * Atjaunina lietotāja profilu (vārds, uzvārds, lietotājvārds, e-pasts, tālrunis)
   */
  async updateProfile(userId, data) {
    const { rows: currentUsers } = await query(
      `SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number, u.role_id, r.role_name, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (!currentUsers || currentUsers.length === 0) {
      throw new AuthenticationError('Lietotājs nav atrasts.');
    }

    const current = currentUsers[0];

    const username = (data.username !== undefined ? data.username.trim() : current.username);
    const fname = (data.fname !== undefined ? data.fname.trim() : current.fname);
    const surname = (data.surname !== undefined ? data.surname.trim() : current.surname);
    const email = (data.email !== undefined ? data.email.trim().toLowerCase() : current.email);
    const phone_number = (data.phone_number !== undefined ? data.phone_number.trim() : current.phone_number);

    // Pārbauda unikalitāti starp citiem lietotājiem
    const { rows: conflictUsers } = await query(
      `SELECT user_id, username, email, phone_number
       FROM users
       WHERE (LOWER(username) = ? OR LOWER(email) = ? OR phone_number = ?) AND user_id != ?`,
      [username.toLowerCase(), email.toLowerCase(), phone_number, userId]
    );

    if (conflictUsers && conflictUsers.length > 0) {
      for (const u of conflictUsers) {
        if (u.username.toLowerCase() === username.toLowerCase()) {
          throw new ConflictError('Lietotājvārds jau ir aizņemts.', 'username');
        }
        if (u.email.toLowerCase() === email.toLowerCase()) {
          throw new ConflictError('E-pasta adrese jau ir reģistrēta.', 'email');
        }
        if (u.phone_number === phone_number) {
          throw new ConflictError('Tālruņa numurs jau ir reģistrēts.', 'phone_number');
        }
      }
    }

    await query(
      `UPDATE users
       SET username = ?, fname = ?, surname = ?, email = ?, phone_number = ?
       WHERE user_id = ?`,
      [username, fname, surname, email, phone_number, userId]
    );

    const { rows: updatedRows } = await query(
      `SELECT u.user_id, u.username, u.fname, u.surname, u.email, u.phone_number, u.role_id, r.role_name, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );

    const updatedUser = updatedRows[0];
    const token = generateToken({
      user_id: updatedUser.user_id,
      username: updatedUser.username,
      email: updatedUser.email,
      role_id: updatedUser.role_id,
      role_name: updatedUser.role_name,
    });

    return { user: updatedUser, token };
  },

  /**
   * Maina lietotāja paroli ar pašreizējās paroles pārbaudi
   */
  async changePassword(userId, { current_password, new_password }) {
    const { rows } = await query(
      'SELECT user_id, password_hash FROM users WHERE user_id = ?',
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new AuthenticationError('Lietotājs nav atrasts.');
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('Pašreizējā parole ir nepareiza.');
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(new_password, saltRounds);

    await query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [newHash, userId]
    );

    return { success: true, message: 'Parole veiksmīgi atjaunināta.' };
  },
};
