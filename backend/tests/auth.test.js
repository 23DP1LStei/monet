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

test('2. Reģistrācija - Veiksmīga reģistrācija ar derīgiem datiem atbilstoši specifikācijai', async () => {
  const payload = {
    username: 'janis123',
    fname: 'Jānis',
    surname: 'Bērziņš',
    email: 'janis@mail.com',
    phone_number: '+37120000000',
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
  assert.equal(res.data.user.phone_number, '+37120000000');
  assert.equal(res.data.user.role_name, 'user');
  assert.equal(res.data.user.password_hash, undefined); // Paroles hešs nekad nedrīkst tikt atgriezts
});

test('3. Reģistrācija - Neveiksmīga, ja parole ir īsāka par 7 simboliem', async () => {
  const payload = {
    username: 'shortpass',
    fname: 'Anna',
    surname: 'Liepa',
    email: 'anna@mail.com',
    phone_number: '+37120000001',
    password: 'Pass1', // tikai 5 simboli
  };

  const res = await runMiddlewareChain([validateRegister, authController.register], { body: payload });
  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
  const passError = res.data.errors.find((e) => e.field === 'password');
  assert.ok(passError);
});

test('4. Reģistrācija - Neveiksmīga, ja parole nesatur gan burtus, gan ciparus', async () => {
  // Tikai burti
  const payloadOnlyLetters = {
    username: 'letters',
    fname: 'Anna',
    surname: 'Liepa',
    email: 'anna1@mail.com',
    phone_number: '+37120000002',
    password: 'PasswordOnly',
  };
  const res1 = await runMiddlewareChain([validateRegister, authController.register], { body: payloadOnlyLetters });
  assert.equal(res1.status, 400);

  // Tikai cipari
  const payloadOnlyDigits = {
    username: 'digits',
    fname: 'Anna',
    surname: 'Liepa',
    email: 'anna2@mail.com',
    phone_number: '+37120000003',
    password: '12345678',
  };
  const res2 = await runMiddlewareChain([validateRegister, authController.register], { body: payloadOnlyDigits });
  assert.equal(res2.status, 400);
});

test('5. Reģistrācija - Neveiksmīga, ja lietotājvārds pārsniedz 20 simbolus', async () => {
  const payload = {
    username: 'lietotajvards_gars_vairak_par_20_simboliem',
    fname: 'Anna',
    surname: 'Liepa',
    email: 'anna3@mail.com',
    phone_number: '+37120000004',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateRegister, authController.register], { body: payload });
  assert.equal(res.status, 400);
  assert.equal(res.data.success, false);
  const userError = res.data.errors.find((e) => e.field === 'username');
  assert.ok(userError);
});

test('6. Reģistrācija - Neveiksmīga, ja tālruņa numura formāts ir nederīgs', async () => {
  const payload = {
    username: 'phoneinvalid',
    fname: 'Anna',
    surname: 'Liepa',
    email: 'anna4@mail.com',
    phone_number: 'nederigs_numurs!',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateRegister, authController.register], { body: payload });
  assert.equal(res.status, 400);
  const phoneErr = res.data.errors.find((e) => e.field === 'phone_number');
  assert.ok(phoneErr);
});

test('7. Reģistrācija - Konflikts 409, ja lietotājvārds, e-pasts vai tālrunis jau eksistē', async () => {
  // Dublēts lietotājvārds
  const dupUser = {
    username: 'janis123',
    fname: 'Cits',
    surname: 'Cits',
    email: 'other1@mail.com',
    phone_number: '+37120000005',
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
    phone_number: '+37120000006',
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
    phone_number: '+37120000000',
    password: 'Password123',
  };
  const resPhone = await runMiddlewareChain([validateRegister, authController.register], { body: dupPhone });
  assert.equal(resPhone.status, 409);
  assert.equal(resPhone.data.field, 'phone_number');
});

test('8. Pieteikšanās (Login) - Veiksmīga ar pareizu e-pastu un paroli', async () => {
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

test('9. Pieteikšanās (Login) - Veiksmīga ar lietotājvārdu un paroli', async () => {
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

test('10. Pieteikšanās (Login) - Neveiksmīga ar nepareizu paroli (401)', async () => {
  const payload = {
    email: 'janis@mail.com',
    password: 'NepareizaParole123',
  };

  const res = await runMiddlewareChain([validateLogin, authController.login], { body: payload });
  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);
});

test('11. Pieteikšanās (Login) - Neveiksmīga ar neeksistējošu lietotāju (401)', async () => {
  const payload = {
    email: 'neeksiste@mail.com',
    password: 'Password123',
  };

  const res = await runMiddlewareChain([validateLogin, authController.login], { body: payload });
  assert.equal(res.status, 401);
  assert.equal(res.data.success, false);
});

test('12. Aizsargātais profils - GET /api/auth/me ar derīgu Bearer marķieri atgriež profilu', async () => {
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
  assert.equal(profileRes.data.user.phone_number, '+37120000000');
});

test('13. Aizsargātais profils - Noraida neautorizētu pieprasījumu bez marķiera (401)', async () => {
  const profileRes = await runMiddlewareChain([authenticateToken, authController.getProfile], {
    headers: {},
  });
  assert.equal(profileRes.status, 401);
  assert.equal(profileRes.data.success, false);
});

test('14. RBAC autorizācija - Bloķē lietotāju bez nepieciešamās lomas (403)', async () => {
  const loginRes = await runMiddlewareChain([validateLogin, authController.login], {
    body: { email: 'janis@mail.com', password: 'Password123' },
  });
  const token = loginRes.data.token;

  // Galapunkts pieprasa 'admin' lomu
  const mockAdminHandler = (req, res) => res.json({ success: true, message: 'Administratora panelis atvērts.' });
  const adminRes = await runMiddlewareChain(
    [authenticateToken, authorizeRoles('admin'), mockAdminHandler],
    { headers: { authorization: `Bearer ${token}` } }
  );

  assert.equal(adminRes.status, 403);
  assert.equal(adminRes.data.success, false);
  assert.equal(adminRes.data.message, 'Piekļuve liegta: jums nav nepieciešamo tiesību šīs darbības veikšanai.');
});

test('15. Izrakstīšanās (Logout) - POST /api/auth/logout atgriež veiksmīgu rezultātu', async () => {
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
