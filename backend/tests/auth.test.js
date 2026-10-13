import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, query } from '../src/config/db.js';
import { authController } from '../src/controllers/authController.js';
import { validateRegister, validateLogin } from '../src/middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../src/middleware/auth.js';

let testDbPath;

// Palīgfunkcija Express starpprogrammatūras ķēdes asinhronai izpildei
async function runMiddlewareChain(middlewares, { body = {}, headers = {}, params = {}, user = null } = {}) {
  const req = { body, headers, params, user };
  let statusCode = 200;
  let responseData = null;

  return new Promise((resolve) => {
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        resolve({ status: statusCode, data: responseData, req });
        return this;
      },
    };

    let index = 0;
    const next = (err) => {
      if (err) {
        statusCode = err.statusCode || 500;
        responseData = { success: false, message: err.message, field: err.field };
        resolve({ status: statusCode, data: responseData, req });
        return;
      }
      index++;
      if (index < middlewares.length) {
        Promise.resolve(middlewares[index](req, res, next)).catch(next);
      } else {
        resolve({ status: statusCode, data: responseData, req });
      }
    };

    Promise.resolve(middlewares[0](req, res, next)).catch(next);
  });
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_DRIVER = 'sqlite';
  testDbPath = path.join(os.tmpdir(), `monet_test_${Date.now()}.sqlite`);
  process.env.DB_SQLITE_PATH = testDbPath;
  await initDatabase();
});

test.after(async () => {
  await closeDatabase();
  if (testDbPath && fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch {}
  }
});

test('1. Sistēmas lomas - getRoles atgriež noklusējuma lomas (guest, user, landlord, admin)', async () => {
  const res = await runMiddlewareChain([authController.getRoles]);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.roles));
  const roleNames = res.data.roles.map((r) => r.role_name);
  assert.ok(roleNames.includes('guest'));
  assert.ok(roleNames.includes('user'));
  assert.ok(roleNames.includes('landlord'));
  assert.ok(roleNames.includes('admin'));
});

test('2. Reģistrācija - Veiksmīga reģistrācija ar derīgiem datiem atbilstoši jaunajiem parametriem', async () => {
  const payload = {
    username: 'janis123',
    fname: 'Jānis',
    surname: 'Bērziņš',
    email: 'janis@mail.com',
    phone_number: '+371(20)00000',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateRegister, authController.register], { body: payload });
  assert.equal(res.status, 201);
  assert.equal(res.data.success, true);
  assert.equal(res.data.message, 'Lietotājs veiksmīgi reģistrēts.');
  assert.ok(res.data.token);
  assert.equal(res.data.user.username, 'janis123');
  assert.equal(res.data.user.fname, 'Jānis');
  assert.equal(res.data.user.surname, 'Bērziņš');
  assert.equal(res.data.user.email, 'janis@mail.com');
  assert.equal(res.data.user.phone_number, '+371(20)00000');
  assert.equal(res.data.user.role_name, 'user');
  assert.equal(res.data.user.password_hash, undefined);
});

test('3. Reģistrācija - Lietotājvārda (username) validācija: min 3, max 20, burti un vismaz viens cipars', async () => {
  // Pārāk īss (< 3 simboli)
  const resShort = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'j1', fname: 'Anna', surname: 'Liepa', email: 'a1@mail.com', phone_number: '+37120000001', password: 'Password123' },
  });
  assert.equal(resShort.status, 400);
  assert.ok(resShort.data.errors.some((e) => e.field === 'username'));

  // Pārāk garš (> 20 simboli)
  const resLong = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'lietotajvards12345678901', fname: 'Anna', surname: 'Liepa', email: 'a2@mail.com', phone_number: '+37120000002', password: 'Password123' },
  });
  assert.equal(resLong.status, 400);
  assert.ok(resLong.data.errors.some((e) => e.field === 'username'));

  // Bez cipariem (tikai burti)
  const resNoDigits = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'annaliepa', fname: 'Anna', surname: 'Liepa', email: 'a3@mail.com', phone_number: '+37120000003', password: 'Password123' },
  });
  assert.equal(resNoDigits.status, 400);
  assert.ok(resNoDigits.data.errors.some((e) => e.field === 'username'));
});

test('4. Reģistrācija - Vārda (fname) un uzvārda (surname) validācija: līdz 50, bez cipariem', async () => {
  // Vārds ar cipariem
  const resFnameDigits = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user123', fname: 'Anna2', surname: 'Liepa', email: 'f1@mail.com', phone_number: '+37120000004', password: 'Password123' },
  });
  assert.equal(resFnameDigits.status, 400);
  assert.ok(resFnameDigits.data.errors.some((e) => e.field === 'fname'));

  // Uzvārds ar cipariem
  const resLnameDigits = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user124', fname: 'Anna', surname: 'Liepa9', email: 'f2@mail.com', phone_number: '+37120000005', password: 'Password123' },
  });
  assert.equal(resLnameDigits.status, 400);
  assert.ok(resLnameDigits.data.errors.some((e) => e.field === 'surname'));
});

test('5. Reģistrācija - E-pasta (email) validācija: max 50 simboli un formāta pārbaude', async () => {
  // Nederīgs formāts
  const resBadEmail = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user125', fname: 'Anna', surname: 'Liepa', email: 'bademail_without_at', phone_number: '+37120000006', password: 'Password123' },
  });
  assert.equal(resBadEmail.status, 400);
  assert.ok(resBadEmail.data.errors.some((e) => e.field === 'email'));

  // Pārāk garš e-pasts (> 50 simboli)
  const longEmail = 'a'.repeat(45) + '@domain.com'; // 56 simboli
  const resLongEmail = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user126', fname: 'Anna', surname: 'Liepa', email: longEmail, phone_number: '+37120000007', password: 'Password123' },
  });
  assert.equal(resLongEmail.status, 400);
  assert.ok(resLongEmail.data.errors.some((e) => e.field === 'email'));
});

test('6. Reģistrācija - Tālruņa numura (phone_number) validācija: min 7, max 15, zīmes +, (, ), -', async () => {
  // Pārāk īss (< 7 simboli)
  const resShortPhone = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user127', fname: 'Anna', surname: 'Liepa', email: 'p1@mail.com', phone_number: '+371', password: 'Password123' },
  });
  assert.equal(resShortPhone.status, 400);
  assert.ok(resShortPhone.data.errors.some((e) => e.field === 'phone_number'));

  // Pārāk garš (> 15 simboli)
  const resLongPhone = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user128', fname: 'Anna', surname: 'Liepa', email: 'p2@mail.com', phone_number: '+37120000000000000', password: 'Password123' },
  });
  assert.equal(resLongPhone.status, 400);
  assert.ok(resLongPhone.data.errors.some((e) => e.field === 'phone_number'));

  // Nederīgas rakstzīmes
  const resBadChars = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user129', fname: 'Anna', surname: 'Liepa', email: 'p3@mail.com', phone_number: '+371200abc!', password: 'Password123' },
  });
  assert.equal(resBadChars.status, 400);
  assert.ok(resBadChars.data.errors.some((e) => e.field === 'phone_number'));
});

test('7. Reģistrācija - Paroles (password) validācija: min 8, max 50, burti un vismaz viens cipars', async () => {
  // Pārāk īsa parole (< 8 simboli)
  const resShortPass = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user130', fname: 'Anna', surname: 'Liepa', email: 'pw1@mail.com', phone_number: '+37120000008', password: 'Pass123' }, // 7 simboli
  });
  assert.equal(resShortPass.status, 400);
  assert.ok(resShortPass.data.errors.some((e) => e.field === 'password'));

  // Pārāk gara parole (> 50 simboli)
  const resLongPass = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user131', fname: 'Anna', surname: 'Liepa', email: 'pw2@mail.com', phone_number: '+37120000009', password: 'P1' + 'a'.repeat(50) },
  });
  assert.equal(resLongPass.status, 400);
  assert.ok(resLongPass.data.errors.some((e) => e.field === 'password'));

  // Bez cipariem
  const resNoDigitsPass = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user132', fname: 'Anna', surname: 'Liepa', email: 'pw3@mail.com', phone_number: '+37120000010', password: 'PasswordWithoutDigits' },
  });
  assert.equal(resNoDigitsPass.status, 400);
  assert.ok(resNoDigitsPass.data.errors.some((e) => e.field === 'password'));

  // Bez burtiem (tikai cipari)
  const resNoLettersPass = await runMiddlewareChain([validateRegister, authController.register], {
    body: { username: 'user133', fname: 'Anna', surname: 'Liepa', email: 'pw4@mail.com', phone_number: '+37120000011', password: '1234567890' },
  });
  assert.equal(resNoLettersPass.status, 400);
  assert.ok(resNoLettersPass.data.errors.some((e) => e.field === 'password'));
});

test('8. Reģistrācija - Konflikts 409, ja lietotājvārds, e-pasts vai tālrunis jau eksistē', async () => {
  // Dublēts lietotājvārds
  const dupUser = {
    username: 'janis123',
    fname: 'Cits',
    surname: 'Cits',
    email: 'other1@mail.com',
    phone_number: '+37120000012',
    password: 'Password123',
  };
  const resUser = await runMiddlewareChain([validateRegister, authController.register], { body: dupUser });
  assert.equal(resUser.status, 409);
  assert.equal(resUser.data.field, 'username');

  // Dublēts e-pasts
  const dupEmail = {
    username: 'unique_user1',
    fname: 'Cits',
    surname: 'Cits',
    email: 'janis@mail.com',
    phone_number: '+37120000013',
    password: 'Password123',
  };
  const resEmail = await runMiddlewareChain([validateRegister, authController.register], { body: dupEmail });
  assert.equal(resEmail.status, 409);
  assert.equal(resEmail.data.field, 'email');

  // Dublēts tālruņa numurs
  const dupPhone = {
    username: 'unique_user2',
    fname: 'Cits',
    surname: 'Cits',
    email: 'other2@mail.com',
    phone_number: '+371(20)00000',
    password: 'Password123',
  };
  const resPhone = await runMiddlewareChain([validateRegister, authController.register], { body: dupPhone });
  assert.equal(resPhone.status, 409);
  assert.equal(resPhone.data.field, 'phone_number');
});

test('9. Pieteikšanās (Login) - Veiksmīga ar pareizu e-pastu un paroli', async () => {
  const payload = {
    email: 'janis@mail.com',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateLogin, authController.login], { body: payload });
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.message, 'Veiksmīga autorizācija.');
  assert.ok(res.data.token);
  assert.equal(res.data.user.email, 'janis@mail.com');
  assert.equal(res.data.user.role_name, 'user');
});

test('10. Pieteikšanās (Login) - Veiksmīga ar lietotājvārdu un paroli', async () => {
  const payload = {
    identifier: 'janis123',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateLogin, authController.login], { body: payload });
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.token);
  assert.equal(res.data.user.username, 'janis123');
});

test('11. Pieteikšanās (Login) - Neveiksmīga ar nepareizu paroli (401)', async () => {
  const payload = {
    email: 'janis@mail.com',
    password: 'NepareizaParole123',
  };

  const res = await runMiddlewareChain([validateLogin, authController.login], { body: payload });
  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);
});

test('12. Pieteikšanās (Login) - Neveiksmīga ar neeksistējošu lietotāju (401)', async () => {
  const payload = {
    email: 'neeksiste@mail.com',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateLogin, authController.login], { body: payload });
  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);
});

test('13. Aizsargātais profils - GET /api/auth/me ar derīgu Bearer marķieri atgriež profilu', async () => {
  const loginRes = await runMiddlewareChain([validateLogin, authController.login], {
    body: { email: 'janis@mail.com', password: 'Password123' },
  });
  const token = loginRes.data.token;

  const profileRes = await runMiddlewareChain(
    [authenticateToken, authController.getProfile],
    { headers: { authorization: `Bearer ${token}` } }
  );

  assert.equal(profileRes.status, 200);
  assert.equal(profileRes.data.success, true);
  assert.equal(profileRes.data.user.username, 'janis123');
  assert.equal(profileRes.data.user.email, 'janis@mail.com');
  assert.equal(profileRes.data.user.fname, 'Jānis');
  assert.equal(profileRes.data.user.surname, 'Bērziņš');
  assert.equal(profileRes.data.user.phone_number, '+371(20)00000');
});

test('14. Aizsargātais profils - Noraida neautorizētu pieprasījumu bez marķiera (401)', async () => {
  const profileRes = await runMiddlewareChain([authenticateToken, authController.getProfile], {
    headers: {},
  });
  assert.equal(profileRes.status, 401);
  assert.equal(profileRes.data.success, false);
});

test('15. RBAC autorizācija - Bloķē lietotāju bez nepieciešamās lomas (403)', async () => {
  const loginRes = await runMiddlewareChain([validateLogin, authController.login], {
    body: { email: 'janis@mail.com', password: 'Password123' },
  });
  const token = loginRes.data.token;

  const mockAdminHandler = (req, res) => res.json({ success: true, message: 'Administratora panelis atvērts.' });
  const adminRes = await runMiddlewareChain(
    [authenticateToken, authorizeRoles('admin'), mockAdminHandler],
    { headers: { authorization: `Bearer ${token}` } }
  );

  assert.equal(adminRes.status, 403);
  assert.equal(adminRes.data.success, false);
  assert.equal(adminRes.data.message, 'Piekļuve liegta: jums nav nepieciešamo tiesību šīs darbības veikšanai.');
});

test('16. Izrakstīšanās (Logout) - POST /api/auth/logout atgriež veiksmīgu rezultātu', async () => {
  const loginRes = await runMiddlewareChain([validateLogin, authController.login], {
    body: { email: 'janis@mail.com', password: 'Password123' },
  });
  const token = loginRes.data.token;

  const logoutRes = await runMiddlewareChain([authenticateToken, authController.logout], {
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(logoutRes.status, 200);
  assert.equal(logoutRes.data.success, true);
  assert.equal(logoutRes.data.message, 'Veiksmīgi izrakstījies no sistēmas.');
});

test('17. Datubāzes līmeņa ierobežojumi (CHECK constraints) - bloķē nekorektus datus tiešā vaicājumā', async () => {
  // Pārbauda, ka datubāze noraida vārdu ar cipariem
  await assert.rejects(async () => {
    await query(
      `INSERT INTO users (username, fname, surname, email, phone_number, role_id, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['dbuser1', 'Anna123', 'Ozola', 'anna_db1@mail.com', '+37120000099', 2, 'hash123']
    );
  }, /CHECK constraint failed/);

  // Pārbauda, ka datubāze noraida lietotājvārdu, kas īsāks par 3 simboliem
  await assert.rejects(async () => {
    await query(
      `INSERT INTO users (username, fname, surname, email, phone_number, role_id, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['ab', 'Anna', 'Ozola', 'anna_db2@mail.com', '+37120000098', 2, 'hash123']
    );
  }, /CHECK constraint failed/);
});
