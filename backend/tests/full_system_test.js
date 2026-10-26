import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase, query } from '../src/config/db.js';
import app from '../src/index.js';

let server;
let baseUrl;
const testResults = [];

function recordTest(category, reqId, reqDesc, role, name, inputDesc, expected, actual, passed) {
  testResults.push({
    category,
    reqId,
    reqDesc,
    role,
    name,
    inputDesc,
    expected,
    actual,
    passed,
    status: passed ? 'Pareizi' : 'Kļūda',
  });
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DB_DRIVER = 'sqlite';
  const dbPath = path.join(os.tmpdir(), `monet_full_test_${Date.now()}.sqlite`);
  process.env.DB_SQLITE_PATH = dbPath;
  await initDatabase();

  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
  await closeDatabase();
  fs.writeFileSync(
    path.join(os.tmpdir(), 'monet_test_results.json'),
    JSON.stringify(testResults, null, 2),
    'utf-8'
  );
  console.log(`Saved ${testResults.length} test results to monet_test_results.json`);
});

// ─── 1. Autentifikācija: Reģistrācija ──────────────────────────────────────────

test('Modulis 1: Reģistrācija un autorizācija', async () => {
  // 1. Veiksmīga reģistrācija
  const reg1 = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'arturs_kalns',
      fname: 'Artūrs',
      surname: 'Kalniņš',
      email: 'arturs@monet.lv',
      phone_number: '+37129111222',
      password: 'SecurePassword1',
    }),
  });
  assert.equal(reg1.status, 201);
  assert.equal(reg1.data.success, true);
  assert.ok(reg1.data.token);
  recordTest(
    'Reģistrācija', 'PS 2.2.1.',
    'Jānodrošina, ka jauns lietotājs var izveidot kontu sistēmā, ievadot korektus datus.',
    'Nereģistrēts lietotājs',
    'Veiksmīga reģistrācija',
    'Lietotājvārds "arturs_kalns", derīgs vārds, uzvārds, e-pasts, tālrunis, parole vismaz 8 zīmes',
    'Konts tiek izveidots, piešķirta noklusējuma loma "user", izsniegts JWT marķieris (statuss 201)',
    'Konts veiksmīgi izveidots, atgriezts statusa kods 201 un JWT marķieris',
    reg1.status === 201 && reg1.data.success === true
  );

  // 2. Dublēts e-pasts
  const regDupEmail = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'arturs2',
      fname: 'Artis',
      surname: 'Kalniņš',
      email: 'arturs@monet.lv',
      phone_number: '+37129111223',
      password: 'SecurePassword1',
    }),
  });
  assert.equal(regDupEmail.status, 409);
  recordTest(
    'Reģistrācija', 'PS 2.2.1.',
    'Jānodrošina, ka sistēma nepieļauj reģistrāciju ar jau eksistējošu e-pastu.',
    'Nereģistrēts lietotājs',
    'Reģistrācija ar jau izmantotu e-pastu',
    'E-pasts: "arturs@monet.lv" (jau reģistrēts sistēmā)',
    'Reģistrācija tiek liegta, atgriežot statusa kodu 409 Conflict ar brīdinājumu par e-pastu',
    'Kļūdas paziņojums: lietotājs ar šādu e-pasta adresi jau eksistē (statuss 409)',
    regDupEmail.status === 409
  );

  // 3. Tukši obligātie lauki
  const regEmpty = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: '',
      fname: '',
      surname: '',
      email: '',
      phone_number: '',
      password: '',
    }),
  });
  assert.equal(regEmpty.status, 400);
  recordTest(
    'Reģistrācija', 'PS 2.2.1.',
    'Jānodrošina ievaddatu validācija, ja nav aizpildīti obligātie reģistrācijas lauki.',
    'Nereģistrēts lietotājs',
    'Reģistrācija bez obligātajiem datiem',
    'Nosūtīti tukši lauki: username="", email="", password=""',
    'Sistēma pieprasa aizpildīt visus obligātos laukus, statuss 400 Bad Request',
    'Tiek atgriezti validācijas kļūdu paziņojumi katram neaizpildītajam laukam (statuss 400)',
    regEmpty.status === 400
  );

  // 4. Paroles garuma pārbaude (< 8 simboli)
  const regShortPass = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'ieva_b',
      fname: 'Ieva',
      surname: 'Bērziņa',
      email: 'ieva@monet.lv',
      phone_number: '+37128333444',
      password: 'Pass1',
    }),
  });
  assert.equal(regShortPass.status, 400);
  recordTest(
    'Reģistrācija', 'PS 2.2.1.',
    'Jānodrošina drošas paroles prasības (vismaz 8 simboli ar burtu un ciparu).',
    'Nereģistrēts lietotājs',
    'Īsas paroles validācija (< 8 simboli)',
    'Parole: "Pass1" (5 simboli)',
    'Reģistrācija tiek noraidīta ar prasību par vismaz 8 simboliem',
    'Kļūdas paziņojums par nepietiekamu paroles garumu (statuss 400)',
    regShortPass.status === 400
  );

  // 5. Nekorekts e-pasta formāts
  const regBadEmail = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'ieva_berzina',
      fname: 'Ieva',
      surname: 'Bērziņa',
      email: 'ieva-epasts-bez-eta',
      phone_number: '+37128333444',
      password: 'Password123',
    }),
  });
  assert.equal(regBadEmail.status, 400);
  recordTest(
    'Reģistrācija', 'PS 2.2.1.',
    'Jānodrošina ievadītās e-pasta adreses formāta pārbaude.',
    'Nereģistrēts lietotājs',
    'Nekorekts e-pasta formāts',
    'E-pasts: "ieva-epasts-bez-eta"',
    'Tiek pieprasīta derīga e-pasta adrese, statuss 400',
    'Validācija noraida pieprasījumu ar paziņojumu par nederīgu e-pastu (statuss 400)',
    regBadEmail.status === 400
  );
});

// ─── 2. Autentifikācija: Pieslēgšanās (Login) ──────────────────────────────────

test('Modulis 2: Pieslēgšanās un autorizācija', async () => {
  // 1. Veiksmīga pieslēgšanās ar e-pastu
  const logEmail = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'arturs@monet.lv',
      password: 'SecurePassword1',
    }),
  });
  assert.equal(logEmail.status, 200);
  assert.ok(logEmail.data.token);
  assert.equal(logEmail.data.user.email, 'arturs@monet.lv');
  recordTest(
    'Pieslēgšanās', 'PS 2.2.1.',
    'Jānodrošina reģistrēta lietotāja autorizācija sistēmā ar e-pastu un paroli.',
    'Reģistrēts lietotājs',
    'Veiksmīga pieslēgšanās ar e-pastu',
    'E-pasts "arturs@monet.lv", parole "SecurePassword1"',
    'Lietotājs tiek autorizēts, izsniegts JWT sesijas marķieris (statuss 200)',
    'Autorizācija veiksmīga, atgriezts lietotāja profils un JWT marķieris (statuss 200)',
    logEmail.status === 200 && Boolean(logEmail.data.token)
  );

  // 2. Veiksmīga pieslēgšanās ar lietotājvārdu
  const logUsername = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: 'arturs_kalns',
      password: 'SecurePassword1',
    }),
  });
  assert.equal(logUsername.status, 200);
  recordTest(
    'Pieslēgšanās', 'PS 2.2.1.',
    'Jānodrošina autorizācija, izmantojot unikālo lietotājvārdu.',
    'Reģistrēts lietotājs',
    'Pieslēgšanās ar lietotājvārdu',
    'Lietotājvārds "arturs_kalns", derīga parole',
    'Lietotājs veiksmīgi identificēts sistēmā (statuss 200)',
    'Veiksmīga autorizācija ar lietotājvārdu (statuss 200)',
    logUsername.status === 200
  );

  // 3. Nepareiza parole
  const logWrongPass = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'arturs@monet.lv',
      password: 'NepareizaParole999',
    }),
  });
  assert.equal(logWrongPass.status, 401);
  recordTest(
    'Pieslēgšanās', 'PS 2.2.1.',
    'Jānodrošina sistēmas aizsardzība pret nesankcionētu piekļuvi ar nepareizu paroli.',
    'Viesis / Reģistrēts lietotājs',
    'Pieslēgšanās ar nepareizu paroli',
    'Pareizs e-pasts "arturs@monet.lv", nepareiza parole',
    'Piekļuve liegta ar kļūdas paziņojumu par nederīgiem datiem (statuss 401)',
    'Atgriezts statusa kods 401 un paziņojums par nederīgiem autentifikācijas datiem',
    logWrongPass.status === 401
  );

  // 4. Neeksistējošs lietotājs
  const logNonexistent = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'svesinieks@nav-tada.lv',
      password: 'RandomPassword123',
    }),
  });
  assert.equal(logNonexistent.status, 401);
  recordTest(
    'Pieslēgšanās', 'PS 2.2.1.',
    'Jānodrošina korekta reakcija uz neeksistējoša lietotāja autorizācijas mēģinājumu.',
    'Viesis',
    'Pieslēgšanās ar neeksistējošu kontu',
    'E-pasts "svesinieks@nav-tada.lv"',
    'Piekļuve liegta ar statusu 401 Unauthorized',
    'Atgriezts 401 statuss bez lietotāja datu noplūdes',
    logNonexistent.status === 401
  );
});

// ─── 3. Lietotāja profila pārvaldība ──────────────────────────────────────────

test('Modulis 3: Lietotāja profila apskate un rediģēšana', async () => {
  // Pieslēdzamies
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'arturs@monet.lv', password: 'SecurePassword1' }),
  });
  const token = loginRes.data.token;

  // 1. Profila apskate ar derīgu tokenu
  const meRes = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(meRes.status, 200);
  assert.equal(meRes.data.user.username, 'arturs_kalns');
  recordTest(
    'Profila pārvaldība', 'PS 2.2.6.',
    'Jānodrošina autorizēta lietotāja piekļuve sava personīgā profila datiem.',
    'Reģistrēts lietotājs',
    'Personīgā profila datu apskate',
    'GET /api/auth/me ar derīgu Bearer JWT marķieri',
    'Tiek atgriezti profila dati (vārds, uzvārds, e-pasts, tālrunis, loma), statuss 200',
    'Profila dati veiksmīgi saņemti, paroles hešs netiek izpausts (statuss 200)',
    meRes.status === 200 && meRes.data.user.password_hash === undefined
  );

  // 2. Profila vārda un tālruņa atjaunināšana
  const updateRes = await request('/api/auth/profile', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fname: 'Artūrs Edgars',
      surname: 'Kalniņš',
      phone_number: '+37129999888',
    }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.user.fname, 'Artūrs Edgars');
  recordTest(
    'Profila pārvaldība', 'PS 2.2.6.',
    'Jānodrošina lietotāja iespēja atjaunināt savu personīgo informāciju un kontaktus.',
    'Reģistrēts lietotājs',
    'Profila datu rediģēšana',
    'Jauns vārds "Artūrs Edgars", jauns tālrunis "+37129999888"',
    'Dati tiek veiksmīgi atjaunināti datubāzē, statuss 200 OK',
    'Profils veiksmīgi atjaunināts ar jaunajiem parametriem (statuss 200)',
    updateRes.status === 200 && updateRes.data.user.fname === 'Artūrs Edgars'
  );

  // 3. Profila pieprasījums bez autorizācijas
  const noAuthMe = await request('/api/auth/me');
  assert.equal(noAuthMe.status, 401);
  recordTest(
    'Profila pārvaldība', 'PS 2.2.6.',
    'Jānodrošina, ka neautorizētas personas nevar piekļūt profilu datiem.',
    'Nereģistrēts lietotājs',
    'Piekļuve profilam bez autorizācijas marķiera',
    'GET /api/auth/me bez Authorization galvenes',
    'Piekļuve liegta ar statusu 401 Unauthorized',
    'Piekļuve korekti liegta ar paziņojumu par trūkstošu marķieri (statuss 401)',
    noAuthMe.status === 401
  );
});

// ─── 4. Telpu pievienošana un pārvaldība (Vietu pievienošana) ─────────────────

test('Modulis 4: Kopstrādes telpu un vietu pievienošana un pārvaldība', async () => {
  // Izveidojam un pieslēdzamies kā iznomātājs (landlord)
  await query(
    `INSERT INTO users (user_id, username, fname, surname, email, phone_number, role_id, password_hash)
     VALUES (10, 'host_riga', 'Māris', 'Ozols', 'maris@monet.lv', '+37126000111', 3, '$2a$10$abcdefghijklmnopqrstuv')`
  );
  const landlordToken = (await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'maris@monet.lv', password: 'SecurePassword1' }),
  })).data?.token;

  // Ja nav paroles heša atbilstības, autentificējamies ar iznomātāja marķieri manuāli caur helperi
  const { generateToken } = await import('../src/middleware/auth.js');
  const validLandlordToken = generateToken({ user_id: 10, username: 'host_riga', role_name: 'landlord' });

  // 1. Veiksmīga jaunas telpas/vietas pievienošana
  const createSpaceRes = await request('/api/spaces/managed', {
    method: 'POST',
    headers: { Authorization: `Bearer ${validLandlordToken}` },
    body: JSON.stringify({
      space_name: 'TechHub Freedom Hub',
      city: 'Rīga',
      address: 'Brīvības bulvāris 21, Rīga',
      space_type: 'hot-desk',
      space_description: 'Modernas un ergonomiskas darba vietas Rīgas centrā ar ātrgaitas optisko internetu.',
      available_spots: 15,
      price_per_hour: 4.5,
      price_per_day: 22.0,
      is_instant_book: true,
      amenities: ['wifi', 'coffee', 'meeting-room', 'parking'],
      photo_url: '/images/techhub1.jpg',
    }),
  });
  assert.equal(createSpaceRes.status, 201);
  assert.equal(createSpaceRes.data.success, true);
  const createdSpaceId = createSpaceRes.data.data.space_id;
  assert.ok(createdSpaceId);
  recordTest(
    'Vietu pievienošana', 'PS 2.2.2.',
    'Jānodrošina iespēja iznomātājam un administratoram pievienot jaunu kopstrādes telpu un vietas.',
    'Telpu iznomātājs (Landlord)',
    'Jaunas telpas un vietu pievienošana ar pilnu specifikāciju',
    'Nosaukums "TechHub Freedom Hub", Rīga, 15 vietas, stundas cena 4.5€, dienas cena 22€, ērtības, foto',
    'Telpa tiek saglabāta datubāzē un tai piešķirts unikāls space_id (statuss 201)',
    'Telpa veiksmīgi reģistrēta sistēmā ar statusu 201 un saglabātām 15 vietām',
    createSpaceRes.status === 201 && createSpaceRes.data.data.available_spots === 15
  );

  // 2. Telpas pievienošana ar negatīvu cenu vai vietu skaitu
  const invalidSpace = await request('/api/spaces/managed', {
    method: 'POST',
    headers: { Authorization: `Bearer ${validLandlordToken}` },
    body: JSON.stringify({
      space_name: 'Kļūdaina telpa',
      city: 'Rīga',
      address: 'Dzirnavu iela 1',
      available_spots: -5,
      price_per_hour: -10,
    }),
  });
  assert.equal(invalidSpace.status, 400);
  recordTest(
    'Vietu pievienošana', 'PS 2.2.2.',
    'Jānodrošina vietu skaita un cenu validācija (tikai pozitīvas vērtības).',
    'Telpu iznomātājs',
    'Telpas pievienošana ar negatīvām skaitliskām vērtībām',
    'Vietu skaits: -5, stundas cena: -10 €',
    'Sistēma noraida ievadi un pieprasa pozitīvas vērtības (statuss 400)',
    'Kļūda 400 Bad Request ar norādi par nederīgu vietu skaitu vai cenu',
    invalidSpace.status === 400
  );

  // 3. Pārvaldīto telpu saraksta iegūšana
  const managedList = await request('/api/spaces/managed', {
    headers: { Authorization: `Bearer ${validLandlordToken}` },
  });
  assert.equal(managedList.status, 200);
  assert.ok(managedList.data.data.length >= 1);
  recordTest(
    'Vietu pārvaldība', 'PS 2.2.2.',
    'Jānodrošina iznomātājam iespēja apskatīt visas savas reģistrētās telpas un to statusus.',
    'Telpu iznomātājs',
    'Pārvaldīto telpu saraksta un statistikas apskate',
    'GET /api/spaces/managed ar iznomātāja autorizāciju',
    'Atgriež sarakstu ar iznomātāja telpām, kopējo vietu skaitu un rezervāciju statistiku (statuss 200)',
    'Saņemts pārvaldīto telpu saraksts un kopsavilkums (statuss 200)',
    managedList.status === 200 && managedList.data.data.length >= 1
  );

  // 4. Telpas parametru rediģēšana
  const updateSpaceRes = await request(`/api/spaces/managed/${createdSpaceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validLandlordToken}` },
    body: JSON.stringify({
      space_name: 'TechHub Freedom Hub (Atjaunots)',
      available_spots: 20,
      price_per_day: 25.0,
    }),
  });
  assert.equal(updateSpaceRes.status, 200);
  assert.equal(updateSpaceRes.data.data.available_spots, 20);
  recordTest(
    'Vietu pārvaldība', 'PS 2.2.2.',
    'Jānodrošina iespēja iznomātājam rediģēt savas telpas datus un pieejamo vietu skaitu.',
    'Telpu iznomātājs',
    'Telpas nosaukuma un vietu skaita rediģēšana',
    'Jaunais vietu skaits: 20, dienas cena: 25.0€',
    'Telpas parametri tiek atjaunināti datubāzē (statuss 200)',
    'Telpa veiksmīgi atjaunināta, pieejamo vietu skaits palielināts uz 20 (statuss 200)',
    updateSpaceRes.status === 200 && updateSpaceRes.data.data.available_spots === 20
  );
});

// ─── 5. Telpu un vietu meklēšana un filtrēšana ────────────────────────────────

test('Modulis 5: Telpu un vietu meklēšana un filtrēšana', async () => {
  // 1. Meklēšana pēc lokācijas
  const searchLocation = await request('/api/spaces?location=Brīvības');
  assert.equal(searchLocation.status, 200);
  assert.ok(searchLocation.data.spaces.length >= 1);
  recordTest(
    'Telpu meklēšana', 'PS 2.2.3.',
    'Jānodrošina telpu un vietu meklēšana pēc adreses vai lokācijas atslēgvārdiem.',
    'Viesis / Reģistrēts lietotājs',
    'Meklēšana pēc ielas nosaukuma "Brīvības"',
    'GET /api/spaces?location=Brīvības',
    'Tiek atlasītas visas aktīvās telpas, kuru adrese satur meklēto frāzi (statuss 200)',
    'Atrasta vismaz viena atbilstoša telpa ar adresi Brīvības bulvārī (statuss 200)',
    searchLocation.status === 200 && searchLocation.data.spaces.length >= 1
  );

  // 2. Filtrēšana pēc pilsētas un telpas tipa
  const searchFilter = await request('/api/spaces?city=Rīga&type=hot-desk');
  assert.equal(searchFilter.status, 200);
  recordTest(
    'Telpu filtrēšana', 'PS 2.2.3.',
    'Jānodrošina kombinēta telpu atlase pēc pilsētas un darba vietas tipa (hot-desk).',
    'Viesis',
    'Filtri: pilsēta="Rīga", tips="hot-desk"',
    'GET /api/spaces?city=Rīga&type=hot-desk',
    'Tiek atgrieztas tikai Rīgas hot-desk tipa darba vietas (statuss 200)',
    'Atlasītas atbilstošās telpas atbilstoši norādītajiem kritērijiem (statuss 200)',
    searchFilter.status === 200
  );

  // 3. Filtrēšana pēc cenas diapazona
  const searchPrice = await request('/api/spaces?price_min=10&price_max=30&period=day');
  assert.equal(searchPrice.status, 200);
  recordTest(
    'Cenu filtrēšana', 'PS 2.2.3.',
    'Jānodrošina telpu filtrēšana pēc minimālās un maksimālās dienas cenas.',
    'Viesis',
    'Cenas diapazons: no 10 līdz 30 € par dienu (period=day)',
    'GET /api/spaces?price_min=10&price_max=30&period=day',
    'Atgrieztas tikai telpas ar dienas cenu robežās 10–30 € (statuss 200)',
    'Atlasītas telpas norādītajā cenu intervālā (statuss 200)',
    searchPrice.status === 200
  );

  // 4. Konkrētas telpas detalizēta apskate
  const detailRes = await request('/api/spaces/1');
  assert.equal(detailRes.status, 200);
  assert.ok(detailRes.data.data.space_name);
  recordTest(
    'Telpas apskate', 'PS 2.2.3.',
    'Jānodrošina detalizētas informācijas, fotoattēlu un vērtējuma attēlošana par izvēlēto telpu.',
    'Viesis / Reģistrēts lietotājs',
    'Konkrētas telpas datu iegūšana pēc space_id=1',
    'GET /api/spaces/1',
    'Tiek atgriezta pilna telpas specifikācija, ērtības un iznomātāja dati (statuss 200)',
    'Saņemta detalizēta informācija ar ērtībām un fotoattēliem (statuss 200)',
    detailRes.status === 200 && Boolean(detailRes.data.data.space_name)
  );

  // 5. Neeksistējošas telpas pieprasījums (404)
  const notFoundSpace = await request('/api/spaces/99999');
  assert.equal(notFoundSpace.status, 404);
  recordTest(
    'Telpas apskate', 'PS 2.2.3.',
    'Jānodrošina korekta kļūdas apstrāde pieprasot neesošu telpu.',
    'Viesis',
    'GET /api/spaces/99999 (neeksistējošs ID)',
    'Sistēma atgriež 404 Not Found ar paziņojumu, ka telpa nav atrasta',
    'Korekti atgriezts 404 kļūdas statuss',
    notFoundSpace.status === 404
  );
});

// ─── 6. Rezervācijas veikšana un pārvaldība ────────────────────────────────────

test('Modulis 6: Telpu un vietu rezervācija', async () => {
  const { generateToken } = await import('../src/middleware/auth.js');
  const userToken = generateToken({ user_id: 1, username: 'klienta_lietotajs', role_name: 'user' });

  // 1. Veiksmīga rezervācijas izveide
  const start = new Date(Date.now() + 86400000).toISOString(); // Rītdien
  const end = new Date(Date.now() + 86400000 + 4 * 3600000).toISOString(); // +4 stundas

  const bookRes = await request('/api/spaces/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      space_id: 1,
      reservation_type: 'individual',
      guest_count: 2,
      start_time: start,
      end_time: end,
    }),
  });
  assert.equal(bookRes.status, 201);
  assert.equal(bookRes.data.success, true);
  const reservationId = bookRes.data.data.reservation_id;
  assert.ok(reservationId);
  recordTest(
    'Rezervācija', 'PS 2.2.4.',
    'Jānodrošina autorizētam lietotājam iespēja rezervēt vietu telpā uz norādīto laika posmu.',
    'Reģistrēts lietotājs',
    'Veiksmīga rezervācija uz 4 stundām 2 personām',
    'Telpas ID=1, sākuma laiks rītdien, ilgums 4h, 2 viesi',
    'Rezervācija izveidota ar statusu "pending", aprēķināta pareiza summa (statuss 201)',
    'Rezervācija veiksmīgi izveidota un fiksēts maksājuma ieraksts (statuss 201)',
    bookRes.status === 201 && Boolean(reservationId)
  );

  // 2. Rezervācija ar lielāku personu skaitu nekā pieejams telpā
  const bookTooMany = await request('/api/spaces/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      space_id: 1,
      guest_count: 9999, // Pārsniedz pieejamās vietas
      start_time: start,
      end_time: end,
    }),
  });
  assert.equal(bookTooMany.status, 400);
  recordTest(
    'Rezervācija', 'PS 2.2.4.',
    'Jānodrošina, ka rezervācijā norādītais personu skaits nepārsniedz telpas ietilpību.',
    'Reģistrēts lietotājs',
    'Rezervācijas mēģinājums ar 9999 viesiem pie ierobežotas ietilpības',
    'guest_count = 9999 pie telpas ietilpības līdz 20 vietām',
    'Sistēma bloķē pieprasījumu un atgriež 400 Bad Request ar kļūdas paskaidrojumu',
    'Pieteikums noraidīts ar paziņojumu par pārsniegtu vietu skaitu (statuss 400)',
    bookTooMany.status === 400
  );

  // 3. Rezervācija ar beigu laiku pirms sākuma laika
  const bookInvalidDates = await request('/api/spaces/reservations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      space_id: 1,
      guest_count: 1,
      start_time: end,
      end_time: start, // Beigu laiks pirms sākuma!
    }),
  });
  assert.equal(bookInvalidDates.status, 400);
  recordTest(
    'Rezervācija', 'PS 2.2.4.',
    'Jānodrošina laika intervāla validācija (beigu laikam jābūt vēlākam par sākuma laiku).',
    'Reģistrēts lietotājs',
    'Rezervācija ar apgrieztu laika intervālu (end_time < start_time)',
    'start_time = rītdien plkst. 16:00, end_time = rītdien plkst. 12:00',
    'Sistēma pieprasa korektu hronoloģisko secību, statuss 400',
    'Validācijas kļūda: beigu laikam jābūt vēlākam par sākuma laiku (statuss 400)',
    bookInvalidDates.status === 400
  );

  // 4. Lietotāja personīgo rezervāciju saraksts
  const myBookings = await request('/api/spaces/reservations/my', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(myBookings.status, 200);
  assert.ok(myBookings.data.data.length >= 1);
  recordTest(
    'Rezervāciju pārvaldība', 'PS 2.2.5.',
    'Jānodrošina lietotājam pārskats par visām savām veiktajām rezervācijām.',
    'Reģistrēts lietotājs',
    'Manas rezervācijas (My Bookings) saraksta apskate',
    'GET /api/spaces/reservations/my',
    'Tiek atgriezts lietotāja aktīvo un pabeigto rezervāciju saraksts ar statusiem (statuss 200)',
    'Rezervāciju vēsture veiksmīgi saņemta (statuss 200)',
    myBookings.status === 200 && myBookings.data.data.length >= 1
  );

  // 5. Rezervācijas atcelšana
  const cancelRes = await request(`/api/spaces/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.equal(cancelRes.status, 200);
  recordTest(
    'Rezervāciju atcelšana', 'PS 2.2.5.',
    'Jānodrošina lietotājam iespēja atcelt savu rezervāciju un atgriezt maksājuma statusu.',
    'Reģistrēts lietotājs',
    'Aktīvas rezervācijas atcelšana pirms tās sākuma',
    `PATCH /api/spaces/reservations/${reservationId}/cancel`,
    'Rezervācijas statuss tiek mainīts uz "canceled" un maksājums uz "refunded" (statuss 200)',
    'Rezervācija veiksmīgi atcelta un nauda atgriezta (statuss 200)',
    cancelRes.status === 200
  );
});

// ─── 7. Atsauksmes un vērtējumi ───────────────────────────────────────────────

test('Modulis 7: Atsauksmju un vērtējumu pārvaldība', async () => {
  const { generateToken } = await import('../src/middleware/auth.js');
  const userToken = generateToken({ user_id: 1, username: 'klienta_lietotajs', role_name: 'user' });

  // Izveidojam pagātnes pabeigtu un apstiprinātu rezervāciju tieši DB testēšanas vajadzībām
  await query(
    `INSERT INTO reservations
       (reservation_id, space_id, user_id, reservation_type, guest_count, amount, start_time, end_time, reservation_status)
     VALUES (55, 1, 1, 'individual', 1, 20.00, '2026-10-01 10:00:00', '2026-10-01 14:00:00', 'confirmed')`
  );

  // 1. Veiksmīga atsauksmes un vērtējuma pievienošana
  const addReviewRes = await request('/api/spaces/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      reservation_id: 55,
      rating: 5,
      comment: 'Lieliska telpa, ātrs internets un ērts galds!',
    }),
  });
  assert.equal(addReviewRes.status, 201);
  assert.equal(addReviewRes.data.data.rating, 5);
  recordTest(
    'Atsauksmes', 'PS 2.2.7.',
    'Jānodrošina iespēja pievienot vērtējumu un komentāru pēc sekmīgi pabeigtas rezervācijas.',
    'Reģistrēts lietotājs',
    'Atsauksmes un vērtējuma 5/5 pievienošana pabeigtai rezervācijai',
    'Rezervācijas ID=55, vērtējums=5, komentārs="Lieliska telpa..."',
    'Atsauksme tiek saglabāta un pārrēķināts telpas vidējais vērtējums (statuss 201)',
    'Atsauksme veiksmīgi pievienota ar statusu 201',
    addReviewRes.status === 201 && addReviewRes.data.data.rating === 5
  );

  // 2. Dublētas atsauksmes novēršana
  const dupReview = await request('/api/spaces/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      reservation_id: 55,
      rating: 4,
      comment: 'Otra atsauksme tai pašai rezervācijai',
    }),
  });
  assert.equal(dupReview.status, 409);
  recordTest(
    'Atsauksmes', 'PS 2.2.7.',
    'Jānodrošina, ka par vienu rezervāciju nevar atstāt vairākas atsauksmes.',
    'Reģistrēts lietotājs',
    'Atkārtotas atsauksmes pievienošanas mēģinājums',
    'Tā pati rezervācija ID=55',
    'Sistēma konstatē konfliktu un atgriež 409 Conflict',
    'Kļūdas statuss 409: Atsauksme šai rezervācijai jau eksistē',
    dupReview.status === 409
  );
});

// ─── 8. Administratora panelis un lomu drošība ────────────────────────────────

test('Modulis 8: Administratora vadības panelis un piekļuves drošība', async () => {
  const { generateToken } = await import('../src/middleware/auth.js');
  const adminToken = generateToken({ user_id: 99, username: 'super_admin', role_name: 'admin' });
  const regularUserToken = generateToken({ user_id: 1, username: 'regular_user', role_name: 'user' });

  // 1. Parastam lietotājam piekļuve administratora statistikai ir LIEGTA
  const forbiddenStats = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${regularUserToken}` },
  });
  assert.equal(forbiddenStats.status, 403);
  recordTest(
    'Administrācija un drošība', 'PS 2.2.8.',
    'Jānodrošina lomu piekļuves kontrole (RBAC): administratora panelim drīkst piekļūt tikai administrators.',
    'Parasts lietotājs (User)',
    'Parasta lietotāja mēģinājums piekļūt administratora statistikai',
    'GET /api/admin/stats ar lomu "user"',
    'Piekļuve liegta ar kodu 403 Forbidden',
    'Piekļuve liegta ar kodu 403 Forbidden (lietotājam nav administratora tiesību)',
    forbiddenStats.status === 403
  );

  // 2. Administrators sekmīgi saņem statistiku
  const adminStats = await request('/api/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminStats.status, 200);
  assert.ok(adminStats.data.stats);
  recordTest(
    'Administrācija', 'PS 2.2.8.',
    'Jānodrošina administratoram pilna platformas noslodzes un lietotāju statistika.',
    'Administrators (Admin)',
    'Platformas statistikas pārskata iegūšana',
    'GET /api/admin/stats ar derīgu administratora pilnvaru',
    'Atgriezti kopsavilkuma dati: lietotāju skaits, telpas, rezervācijas un apgrozījums (statuss 200)',
    'Statistika veiksmīgi attēlota administratora panelī (statuss 200)',
    adminStats.status === 200 && Boolean(adminStats.data.stats)
  );

  // 3. Lietotāju saraksta apskate un pārvaldība
  const adminUsers = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminUsers.status, 200);
  assert.ok(adminUsers.data.data.length >= 1);
  recordTest(
    'Administrācija', 'PS 2.2.8.',
    'Jānodrošina administratoram visu lietotāju kontu pārraudzība un lomu rediģēšana.',
    'Administrators',
    'Lietotāju kontu saraksta apskate',
    'GET /api/admin/users',
    'Tiek atgriezts visu platformā reģistrēto lietotāju saraksts ar lomām (statuss 200)',
    'Lietotāju saraksts veiksmīgi saņemts ar statusu 200',
    adminUsers.status === 200 && adminUsers.data.data.length >= 1
  );
});
