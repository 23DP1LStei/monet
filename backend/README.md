# Monet Kopstrādes Sistēma — Aizmugursistēmas (Backend) API

Sākumlapas telpu API: skatīt [MAIN_PAGE_API.md](MAIN_PAGE_API.md) — aktīvās telpas,
lokācijas meklēšana, cenas, foto un vērtējumi, kā arī vēl saskaņojamās iespējas.

Kopstrādes telpu nomas platformas **Monet** aizmugursistēmas serviss, kas izstrādāts uz **Node.js** un **Express.js** bāzes saskaņā ar dokumentā `monet_posms2.docx` noteiktajām prasībām, datubāzes struktūru un lietotāju lomu modeli.

---

## Satura rādītājs

1. [Arhitektūra un drošība](#1-arhitektūra-un-drošība)
2. [Realizētā funkcionalitāte](#2-realizētā-funkcionalitāte)
3. [Prasību un ievades datu atbilstība](#3-prasību-un-ievades-datu-atbilstība)
4. [Datubāzes fiziskā struktūra](#4-datubāzes-fiziskā-struktūra)
5. [API galapunktu specifikācija](#5-api-galapunktu-specifikācija)
6. [Uzstādīšana un palaišana](#6-uzstādīšana-un-palaišana)
7. [Automatizētā testēšana](#7-automatizētā-testēšana)
8. [Projekta failu struktūra](#8-projekta-failu-struktūra)

---

## 1. Arhitektūra un drošība

### 1.1. Slāņu arhitektūra

Serviss ir veidots pēc daudzslāņu arhitektūras principa:

```
Klienta pieprasījums (HTTP)
        |
        v
   Maršruts (routes/)
        |
        v
  Starpprogrammatūra (middleware/)
  - Validācija (validate.js)
  - JWT pārbaude (auth.js)
        |
        v
  Kontrolieris (controllers/)
        |
        v
  Serviss (services/)
  - Biznesa loģika
  - Paroles hešēšana (bcrypt)
  - JWT izsniegšana
        |
        v
  Datubāzes adapteris (config/db.js)
  - MySQL (primārais)
  - SQLite (rezerves)
        |
        v
   Datubāze (MySQL / SQLite)
```

### 1.2. Drošība

- **Paroles hešēšana**: visas paroles tiek hešētas, izmantojot **bcrypt** algoritmu ar 10 sāls cikliem. Skaidras teksta paroles nekad netiek saglabātas datubāzē.
- **JWT marķieri**: pēc veiksmīgas reģistrācijas vai pieteikšanās tiek izsniegts parakstīts JSON Web Token, kas ir derīgs 7 dienas.
- **Paroles aizsardzība**: lauks `password_hash` tiek noņemts no visām API atbildēm — klientam paroles heš nekad netiek nosūtīts.
- **RBAC (lomu piekļuves kontrole)**: aizsargātie maršruti pārbauda gan JWT derīgumu, gan lietotāja lomu. Ja nepieciešamā loma nav piešķirta, tiek atgriezts `403 Forbidden`.
- **Dublikātu novēršana**: `username`, `email` un `phone_number` ir unikāli datubāzes līmenī (`UNIQUE` ierobežojums). Mēģinājums reģistrēt jau esošu vērtību atgriež `409 Conflict`.

### 1.3. Elastīgais datubāzes adapteris

Serviss pēc noklusējuma pieslēdzas **MySQL** datubāzei. Ja MySQL serveris lokāli nav pieejams, sistēma automātiski aktivizē lokālo **SQLite** krātuvi (`node:sqlite`), ļaujot turpināt izstrādi un testēšanu bez ārējas infrastruktūras.

---

## 2. Realizētā funkcionalitāte

### 2.1. Lietotāju reģistrācija (`POST /api/auth/register`)

- Jauna lietotāja konta izveide ar pilnu ievades datu validāciju.
- Paroles droša hešēšana, izmantojot **bcrypt** algoritmu (10 sāls cikli).
- Noklusētās lomas piešķiršana (`role_id: 2` — `user`).
- Unikālo lauku dublikātu novēršana (`409 Conflict`), ja lietotājvārds, e-pasts vai tālrunis jau ir reģistrēts.
- Parakstīta **JWT marķiera** izsniegšana pēc veiksmīgas reģistrācijas.

### 2.2. Lietotāju autorizācija (`POST /api/auth/login`)

- Pieteikšanās sistēmā, ievadot e-pasta adresi (vai lietotājvārdu) un paroli.
- Paroles heša salīdzināšana, izmantojot `bcrypt.compare`.
- Aizsardzība pret paroles heša noplūdi — lauks `password_hash` tiek izņemts no visām API atbildēm.
- Ja dati nav pareizi, tiek atgriezta kļūda `401 Unauthorized` ar paziņojumu: "Nepareizs e-pasts vai parole."

### 2.3. Autorizētā lietotāja profils (`GET /api/auth/me`)

- Aizsargāts maršruts, kam nepieciešams galvene `Authorization: Bearer <token>`.
- Atgriež lietotāja profilu un viņa sistēmas lomu (`role_name`).

### 2.4. Izrakstīšanās (`POST /api/auth/logout`)

- Aizsargāts maršruts sesijas pabeigšanai klienta pusē.

### 2.5. Sistēmas lomas (`GET /api/roles`)

- Atgriež sistēmā definētās lomas (`guest`, `user`, `landlord`, `admin`).

---

## 3. Prasību un ievades datu atbilstība

Saskaņā ar dokumenta sadaļu **2.1.1 "Ieejas informācijas apraksts"** ir realizētas šādas validācijas pārbaudes:

| Lauks | Datubāzes tips | Prasība | Regex | Kļūdas kods |
|---|---|---|---|---|
| `username` | `VARCHAR(20)` | Min 3, max 20 rakstzīmes (cipari nav obligāti) | `/^[a-zA-Z0-9_.-]{3,20}$/` | `400` / `409` |
| `fname` | `VARCHAR(50)` | Maks. 50 rakstzīmes, bez cipariem | `/^[^\d]+$/` | `400` |
| `surname` | `VARCHAR(50)` | Maks. 50 rakstzīmes, bez cipariem | `/^[^\d]+$/` | `400` |
| `email` | `VARCHAR(50)` | Maks. 50 rakstzīmes, derīgs e-pasta formāts | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `400` / `409` |
| `phone_number` | `VARCHAR(15)` | Min 7, max 15, cipari un `+`, `(`, `)`, `-` | `/^\+?[0-9\s\-()]{7,15}$/` | `400` / `409` |
| `password` | `VARCHAR(255)` | Min 8, max 50, burti un vismaz viens cipars | `/^(?=.*[a-zA-Z])(?=.*\d).{8,50}$/` | `400` |

### Kļūdu atbilžu formāts

**Validācijas kļūda (`400 Bad Request`):**
```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Nederīgs e-pasta adreses formāts." },
    { "field": "password", "message": "Parolei obligāti jāsatur gan burti, gan vismaz viens cipars (8-50 simboli)." }
  ]
}
```

**Konflikts (`409 Conflict`):**
```json
{
  "success": false,
  "field": "email",
  "message": "E-pasta adrese jau ir reģistrēta."
}
```

**Neautorizēts (`401 Unauthorized`):**
```json
{
  "success": false,
  "message": "Nepareizs e-pasts vai parole."
}
```

**Piekļuve liegta (`403 Forbidden`):**
```json
{
  "success": false,
  "message": "Nepietiekamas tiesības šai darbībai."
}
```

---

## 4. Datubāzes fiziskā struktūra

Failā [`src/db/schema.sql`](file:///Users/leb/Documents/monet/backend/src/db/schema.sql) ir definētas visas 7 tabulas atbilstoši dokumenta 5. nodaļai:

- **`roles`** (5.1. tabula): `role_id` (PK, INT AUTO_INC), `role_name` (VARCHAR(20) UNIQUE).
- **`users`** (5.2. tabula): `user_id` (PK, INT AUTO_INC), `username`, `fname`, `surname`, `email` (VARCHAR(50)), `phone_number`, `role_id` (FK), `password_hash`, `created_at` ar datubāzes līmeņa CHECK ierobežojumiem.
- **`coworking_spaces`** (5.3. tabula): `space_id` (PK), `creator_id` (FK), `space_name`, `address`, `space_description`, `available_spots`, `price_per_hour`, `price_per_day`, `is_active`, `created_at`.
- **`photos`** (5.7. tabula): `photo_id` (PK), `space_id` (FK), `photo_path`.
- **`reservations`** (5.4. tabula): `reservation_id` (PK), `space_id` (FK), `user_id` (FK), `reservation_type`, `guest_count`, `amount`, `start_time`, `end_time`, `reservation_status`, `created_at`.
- **`payment_history`** (5.5. tabula): `payment_id` (PK), `reservation_id` (FK), `amount`, `payment_status`, `created_at`.
- **`reviews`** (5.6. tabula): `review_id` (PK), `reservation_id` (FK, UNIQUE), `user_id` (FK), `space_id` (FK), `rating`, `comment`, `created_at`.

### ER diagramma (attiecību shēma)

```
roles
  role_id (PK)
  role_name
      |
      | 1..N
      |
users
  user_id (PK)
  username, fname, surname, email, phone_number
  role_id (FK -> roles.role_id)
  password_hash, created_at
      |
      | 1..N                        1..N
      |                              |
reservations <-------- coworking_spaces
  reservation_id (PK)   space_id (PK)
  space_id (FK)         creator_id (FK -> users.user_id)
  user_id (FK)          space_name, address, ...
  ...                        |
      |                      | 1..N
      | 1..1                 |
      |                   photos
payment_history            photo_id (PK)
  payment_id (PK)          space_id (FK)
  reservation_id (FK)      photo_path
      |
      | 1..1
      |
reviews
  review_id (PK)
  reservation_id (FK, UNIQUE)
  user_id (FK), space_id (FK)
  rating, comment, created_at
```

---

## 5. API galapunktu specifikācija

### 5.1. Reģistrācija

- **Metode:** `POST`
- **Ceļš:** `/api/auth/register`
- **Pieprasījuma pamatteksts (JSON):**
  ```json
  {
    "username": "janis123",
    "fname": "Jānis",
    "surname": "Bērziņš",
    "email": "janis@mail.com",
    "phone_number": "+37120000000",
    "password": "Password123"
  }
  ```
- **Veiksmīga atbilde (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Lietotājs veiksmīgi reģistrēts.",
    "user": {
      "user_id": 1,
      "username": "janis123",
      "fname": "Jānis",
      "surname": "Bērziņš",
      "email": "janis@mail.com",
      "phone_number": "+37120000000",
      "role_id": 2,
      "role_name": "user",
      "created_at": "2026-10-12 10:30:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 5.2. Pieteikšanās

- **Metode:** `POST`
- **Ceļš:** `/api/auth/login`
- **Pieprasījuma pamatteksts (JSON):**
  ```json
  {
    "email": "janis@mail.com",
    "password": "Password123"
  }
  ```
- **Veiksmīga atbilde (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Veiksmīga autorizācija.",
    "user": {
      "user_id": 1,
      "username": "janis123",
      "fname": "Jānis",
      "surname": "Bērziņš",
      "email": "janis@mail.com",
      "phone_number": "+37120000000",
      "role_id": 2,
      "role_name": "user",
      "created_at": "2026-10-12 10:30:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 5.3. Lietotāja profils

- **Metode:** `GET`
- **Ceļš:** `/api/auth/me`
- **Galvene:** `Authorization: Bearer <token>`
- **Veiksmīga atbilde (`200 OK`):**
  ```json
  {
    "success": true,
    "user": {
      "user_id": 1,
      "username": "janis123",
      "fname": "Jānis",
      "surname": "Bērziņš",
      "email": "janis@mail.com",
      "phone_number": "+37120000000",
      "role_id": 2,
      "role_name": "user",
      "created_at": "2026-10-12 10:30:00"
    }
  }
  ```

### 5.4. Izrakstīšanās

- **Metode:** `POST`
- **Ceļš:** `/api/auth/logout`
- **Galvene:** `Authorization: Bearer <token>`
- **Veiksmīga atbilde (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Veiksmīgi izrakstījies no sistēmas."
  }
  ```

### 5.5. Sistēmas lomas

- **Metode:** `GET`
- **Ceļš:** `/api/roles`
- **Veiksmīga atbilde (`200 OK`):**
  ```json
  {
    "success": true,
    "roles": [
      { "role_id": 1, "role_name": "guest" },
      { "role_id": 2, "role_name": "user" },
      { "role_id": 3, "role_name": "landlord" },
      { "role_id": 4, "role_name": "admin" }
    ]
  }
  ```

---

## 6. Uzstādīšana un palaišana

### 6.1. Vides mainīgie (`.env`)

Izveidojiet failu `.env` atbilstoši paraugam `.env.example`:

```env
PORT=3000
NODE_ENV=development

# Datubāzes konfigurācija
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=monet_db

# Rezerves SQLite datubāzes ceļš
DB_SQLITE_PATH=./data/monet.sqlite

# JWT konfigurācija
JWT_SECRET=super_secret_monet_coworking_token_jwt_2026
JWT_EXPIRES_IN=7d
```

### 6.2. Atkarību instalēšana

```bash
npm install
```

### 6.3. Datubāzes inicializēšana (MySQL)

Lai izveidotu datubāzi un tabulas MySQL vidē:

```bash
npm run db:init
```

### 6.4. Servera palaišana

Izstrādes režīmā (ar automātisku koda pārlādi):

```bash
npm run dev
```

Standarta režīmā:

```bash
npm start
```

Serveris būs pieejams adresē: `http://localhost:3000`

---

## 7. Automatizētā testēšana

Projektā ir iekļauts 17 automatizēto integrācijas testu komplekts:

```bash
npm test
```

### Testēšanas rezultāts

```
  1. Sistēmas lomas - getRoles atgriež noklusējuma lomas (guest, user, landlord, admin)
  2. Reģistrācija - Veiksmīga reģistrācija ar derīgiem datiem atbilstoši specifikācijai
  3. Reģistrācija - Veiksmīga reģistrācija ar lietotājvārdu bez cipariem
  4. Reģistrācija - Neveiksmīga, ja parole ir īsāka par 8 simboliem
  5. Reģistrācija - Neveiksmīga, ja parole nesatur gan burtus, gan ciparus
  6. Reģistrācija - Neveiksmīga, ja lietotājvārds pārsniedz 20 simbolus
  7. Reģistrācija - Neveiksmīga, ja tālruņa numura formāts ir nederīgs
  8. Reģistrācija - Konflikts 409, ja lietotājvārds, e-pasts vai tālrunis jau eksistē
  9. Pieteikšanās - Veiksmīga ar pareizu e-pastu un paroli
 10. Pieteikšanās - Veiksmīga ar lietotājvārdu un paroli
 11. Pieteikšanās - Neveiksmīga ar nepareizu paroli (401)
 12. Pieteikšanās - Neveiksmīga ar neeksistējošu lietotāju (401)
 13. Aizsargātais profils - GET /api/auth/me ar derīgu Bearer marķieri atgriež profilu
 14. Aizsargātais profils - Noraida neautorizētu pieprasījumu bez marķiera (401)
 15. RBAC autorizācija - Bloķē lietotāju bez nepieciešamās lomas (403)
 16. Izrakstīšanās - POST /api/auth/logout atgriež veiksmīgu rezultātu
 17. Datubāze - CHECK ierobežojums noraida nepareizi formatētus datus datubāzes līmenī

tests 17 | pass 17 | fail 0
```

---

## 8. Projekta failu struktūra

```
backend/
├── .env                              # Vides mainīgo konfigurācija
├── .env.example                      # Vides mainīgo paraugs
├── .gitignore                        # Git ignorējamie faili
├── package.json                      # Projekta atkarības un skripti
├── README.md                         # Galvenā dokumentācija latviešu valodā
├── src/
│   ├── config/
│   │   └── db.js                     # Datubāzes pieslēgums un adapteris
│   ├── controllers/
│   │   └── authController.js         # HTTP pieprasījumu apstrādātāji
│   ├── db/
│   │   ├── init.js                   # Datubāzes inicializācijas skripts
│   │   └── schema.sql                # SQL tabulu struktūras shēma
│   ├── middleware/
│   │   ├── auth.js                   # JWT pārbaude un lomu kontrole (RBAC)
│   │   ├── errorHandler.js           # Kļūdu apstrādes starpprogrammatūra
│   │   └── validate.js               # Ievades datu validācijas pārbaudes
│   ├── routes/
│   │   ├── authRoutes.js             # Autentifikācijas maršruti
│   │   └── roleRoutes.js             # Sistēmas lomu maršruti
│   ├── services/
│   │   └── authService.js            # Biznesa loģika, paroles hešēšana, JWT
│   └── index.js                      # Servera galvenais ieejas punkts
└── tests/
    └── auth.test.js                  # 17 automatizēti integrācijas testi
```
