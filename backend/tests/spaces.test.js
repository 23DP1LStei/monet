import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, closeDatabase, query } from '../src/config/db.js';
import app from '../src/index.js';
import { spaceService } from '../src/services/spaceService.js';

let server;
let baseUrl;

async function getSpaces(path = '/api/spaces') {
  const response = await fetch(`${baseUrl}${path}`);
  return { status: response.status, data: await response.json() };
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_DRIVER = 'sqlite';
  process.env.DB_SQLITE_PATH = ':memory:';
  await initDatabase();

  // Tikai testu atmiņas datubāze. Projekta MySQL/SQLite shēmu nemaina.
  await query(`CREATE TABLE coworking_spaces (
    space_id INTEGER PRIMARY KEY, creator_id INTEGER NOT NULL,
    space_name TEXT NOT NULL, address TEXT NOT NULL, space_description TEXT,
    available_spots INTEGER NOT NULL DEFAULT 1,
    price_per_hour DECIMAL(10,2) NOT NULL, price_per_day DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TEXT NOT NULL
  )`);
  await query(`CREATE TABLE photos (
    photo_id INTEGER PRIMARY KEY, space_id INTEGER NOT NULL, photo_path TEXT NOT NULL
  )`);
  await query(`CREATE TABLE reviews (
    review_id INTEGER PRIMARY KEY, reservation_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL, space_id INTEGER NOT NULL, rating INTEGER NOT NULL,
    comment TEXT, created_at TEXT NOT NULL
  )`);

  for (const row of [
    [1, 'Riga Workspace', 'Brīvības iela 10, Riga', 5.5, 29, true],
    [2, 'Tallinn Desk', 'Telliskivi 10, Tallinn', 4, 22, true],
    [3, 'Hidden Workspace', 'Riga', 1, 2, false],
    [4, 'Special Workspace', '100%_! iela, Riga', 0, 0, true],
  ]) {
    await query(`INSERT INTO coworking_spaces
      (space_id, creator_id, space_name, address, price_per_hour, price_per_day, is_active, created_at)
      VALUES (?, 1, ?, ?, ?, ?, ?, '2026-10-12 10:00:00')`,
      [...row.slice(0, 5), Number(row[5])]);
  }
  await query('INSERT INTO photos VALUES (2, 1, ?), (1, 1, ?), (3, 2, ?)',
    ['/images/second.jpg', '/images/first.jpg', '/images/tallinn.jpg']);
  await query(`INSERT INTO reviews
    (review_id, reservation_id, user_id, space_id, rating, created_at)
    VALUES (1, 1, 1, 1, 5, '2026-10-12'), (2, 2, 2, 1, 4, '2026-10-12'),
           (3, 3, 3, 1, 4, '2026-10-12'), (4, 4, 1, 2, 2, '2026-10-12')`);

  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
  await closeDatabase();
});

test('Telpu saraksts ir publisks un atgriež tikai aktīvās telpas', async () => {
  const res = await getSpaces();
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.deepEqual(res.data.spaces.map((space) => space.space_id), [1, 2, 4]);
  assert.deepEqual(res.data.pagination, { limit: 20, offset: 0, count: 3 });
});

test('Kartīte satur cenas, pirmo attēlu un precīzu vērtējumu bez foto dublikātiem', async () => {
  const res = await getSpaces();
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.spaces[0], {
    space_id: 1,
    space_name: 'Riga Workspace',
    address: 'Brīvības iela 10, Riga',
    price_per_hour: 5.5,
    price_per_day: 29,
    price: 29,
    price_period: 'day',
    photo_path: '/images/first.jpg',
    average_rating: 4.33,
    review_count: 3,
  });
  assert.equal(res.data.spaces[1].photo_path, '/images/tallinn.jpg');
  assert.equal(res.data.spaces[1].average_rating, 2);
  assert.equal(res.data.spaces[1].review_count, 1);
});

test('Telpa bez attēla un atsauksmēm saglabājas sarakstā; nulles cena saglabājas', async () => {
  const res = await getSpaces();
  const space = res.data.spaces.find((item) => item.space_id === 4);
  assert.equal(space.photo_path, null);
  assert.equal(space.average_rating, null);
  assert.equal(space.review_count, 0);
  assert.equal(space.price, 0);
});

test('Lokācijas meklēšana izmanto adresi un apstrādā atstarpes un burtu reģistru', async () => {
  const res = await getSpaces('/api/spaces?location=%20rIgA%20');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.spaces.map((space) => space.space_id), [1, 4]);
});

test('LIKE simboli lokācijā tiek meklēti kā teksts', async () => {
  for (const location of ['%', '_', '!', '100%_!']) {
    const res = await getSpaces(`/api/spaces?location=${encodeURIComponent(location)}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.spaces.map((space) => space.space_id), [4]);
  }
});

test('SQL injekcijas teksts nemaina atlasi', async () => {
  const res = await getSpaces(`/api/spaces?location=${encodeURIComponent("' OR 1=1 --")}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.spaces, []);
});

test('Stundas periods izvēlas stundas cenu', async () => {
  const res = await getSpaces('/api/spaces?period=hour');
  assert.equal(res.status, 200);
  assert.equal(res.data.spaces[0].price, 5.5);
  assert.equal(res.data.spaces[0].price_period, 'hour');
});

test('Lapošana atgriež pareizo telpu un tukšu sarakstu aiz pēdējās lapas', async () => {
  const res = await getSpaces('/api/spaces?limit=1&offset=1');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.spaces.map((space) => space.space_id), [2]);
  assert.deepEqual(res.data.pagination, { limit: 1, offset: 1, count: 1 });
  const empty = await getSpaces('/api/spaces?offset=100');
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.data.spaces, []);
});

test('Neatrasta lokācija atgriež 200 un tukšu sarakstu', async () => {
  const res = await getSpaces('/api/spaces?location=Unknown');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.spaces, []);
});

test('Pieņem atļautās parametru robežvērtības un kombinētus filtrus', async () => {
  const res = await getSpaces('/api/spaces?location=riga&period=hour&limit=1&offset=1');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.spaces.map((space) => space.space_id), [4]);
  assert.equal(res.data.spaces[0].price_period, 'hour');

  for (const params of ['limit=100&offset=0&period=day', `location=${'x'.repeat(255)}`]) {
    const boundary = await getSpaces(`/api/spaces?${params}`);
    assert.equal(boundary.status, 200, params);
  }
});

test('Noraida nederīgus un atkārtotus parametrus pirms servisa izsaukšanas', async (t) => {
  const serviceMock = t.mock.method(spaceService, 'listSpaces', async () => {
    assert.fail('Nederīgi parametri nedrīkst nonākt telpu servisā.');
  });
  for (const params of [
    'location=', 'location=%20', `location=${'x'.repeat(256)}`,
    'location=a&location=b', 'location[x]=a', 'period=week', 'period=hour&period=day',
    'limit=0', 'limit=101', 'limit=1.5', 'limit=abc', 'limit=1&limit=2',
    'offset=-1', 'offset=9007199254740992', 'offset=1e2', 'offset=',
    'limit=1%20OR%201=1', 'unknown=value', 'toString=value',
    'period[x]=hour', 'limit[x]=1', 'offset=1&offset=2',
  ]) {
    const res = await getSpaces(`/api/spaces?${params}`);
    assert.equal(res.status, 400, params);
    assert.equal(res.data.success, false);
    assert.ok(res.data.errors.length > 0);
    assert.equal(typeof res.data.errors[0].message, 'string');
  }
  assert.equal(serviceMock.mock.callCount(), 0);
});

test('Nesaskaņotos filtrus nenoklusē un norāda, kas trūkst', async () => {
  for (const [params, field] of [
    ['city=Riga', 'city'], ['type=meeting_room', 'type'],
    ['date=2026-10-20', 'date'], ['period=month', 'period'],
  ]) {
    const res = await getSpaces(`/api/spaces?${params}`);
    assert.equal(res.status, 400);
    assert.equal(res.data.errors[0].field, field);
    assert.match(res.data.errors[0].message, /jāsaskaņo/);
  }
});

test('Izcelto telpu API skaidri norāda, ka atlases noteikums vēl jāsaskaņo', async () => {
  const res = await getSpaces('/api/spaces/featured');
  assert.equal(res.status, 501);
  assert.equal(res.data.success, false);
  assert.match(res.data.message, /kritērijs/);
});

test('Izcelto telpu API arī validē parametrus', async () => {
  const res = await getSpaces('/api/spaces/featured?limit=0');
  assert.equal(res.status, 400);
});

test('Pilsētu API neizsecina pilsētu no nestrukturētas adreses', async () => {
  const res = await getSpaces('/api/spaces/cities');
  assert.equal(res.status, 501);
  assert.match(res.data.message, /city/);
});

test('Paredzētās 501 atbildes neizvada kļūdas vai stack arī izstrādes režīmā', async (t) => {
  const previousEnv = process.env.NODE_ENV;
  const errorMock = t.mock.method(console, 'error', () => {});
  process.env.NODE_ENV = 'development';
  try {
    for (const path of ['/api/spaces/featured', '/api/spaces/cities']) {
      const res = await getSpaces(path);
      assert.equal(res.status, 501);
      assert.deepEqual(Object.keys(res.data).sort(), ['message', 'success']);
    }
    assert.equal(errorMock.mock.callCount(), 0);
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
});

test('Telpu maršruti saglabā esošo autentifikācijas darbību caur HTTP', async () => {
  const unauthorized = await getSpaces('/api/auth/me');
  assert.equal(unauthorized.status, 401);

  const payload = {
    username: 'spaces_test', fname: 'Anna', surname: 'Liepa',
    email: 'spaces_test@example.com', phone_number: '+37120000099', password: 'Password123',
  };
  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  assert.equal(registration.status, 201);
  const registered = await registration.json();
  assert.equal(registered.user.role_name, 'user');
  assert.equal(registered.user.password_hash, undefined);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  });
  assert.equal(login.status, 200);
  const loggedIn = await login.json();
  const profile = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loggedIn.token}` },
  });
  assert.equal(profile.status, 200);
  const profileData = await profile.json();
  assert.equal(profileData.user.user_id, registered.user.user_id);
  assert.equal(profileData.user.email, payload.email);
  assert.equal(profileData.user.password_hash, undefined);
  const spaces = await getSpaces();
  assert.equal(spaces.status, 200);
});

test('Datubāzes kļūda atgriež 500 bez SQL detaļu noplūdes', async (t) => {
  // Pēc pārbaudes atjauno tabulu un tās datus, lai tests nebūtu atkarīgs no secības.
  await query('ALTER TABLE reviews RENAME TO reviews_test_backup');
  t.mock.method(console, 'error', () => {});
  try {
    const res = await getSpaces();
    assert.equal(res.status, 500);
    assert.deepEqual(res.data, { success: false, message: 'Neizdevās iegūt telpu sarakstu.' });
  } finally {
    await query('ALTER TABLE reviews_test_backup RENAME TO reviews');
  }
  const recovered = await getSpaces();
  assert.equal(recovered.status, 200);
  assert.equal(recovered.data.spaces[0].review_count, 3);
});
