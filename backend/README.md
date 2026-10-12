# 🏢 Monet Kopstrādes Sistēma — Aizmugursistēmas (Backend) API

Sākumlapas telpu API: skatīt [MAIN_PAGE_API.md](MAIN_PAGE_API.md) — aktīvās telpas,
lokācijas meklēšana, cenas, foto un vērtējumi, kā arī vēl saskaņojamās iespējas.

Kopstrādes telpu nomas platformas **Monet** aizmugursistēmas serviss, kas izstrādāts uz **Node.js** un **Express.js** bāzes saskaņā ar dokumentā `monet_posms2.docx` noteiktajām prasībām, datubāzes struktūru un lietotāju lomu modeli.

---

## 📋 Satura rādītājs

1. [Realizētā funkcionalitāte](#1-realizētā-funkcionalitāte)
2. [Prasību un ievades datu atbilstība (Specifikācija)](#2-prasību-un-ievades-datu-atbilstība-specifikācija)
3. [Datubāzes fiziskā struktūra](#3-datubāzes-fiziskā-struktūra)
4. [API galapunktu (Endpoints) specifikācija](#4-api-galapunktu-endpoints-specifikācija)
5. [Uzstādīšana un palaišana](#5-uzstādīšana-un-palaišana)
6. [Automatizētā testēšana](#6-automatizētā-testēšana)
7. [Projekta failu struktūra](#7-projekta-failu-struktūra)

---

## 1. Realizētā funkcionalitāte

### 1.1. Lietotāju reģistrācija (`POST /api/auth/register`)
- Jauna lietotāja konta izveide ar pilnu ievades datu validāciju.
- Paroles droša hešēšana, izmantojot **bcrypt** algoritmu (10 sāls cikli).
- Noklusētās lomas piešķiršana (`role_id: 2` — `user`).
- Unikālo lauku dublikātu novēršana (`409 Conflict`), ja lietotājvārds, e-pasts vai tālrunis jau ir reģistrēts.
- Parakstīta **JWT marķiera** izsniegšana pēc veiksmīgas reģistrācijas.

### 1.2. Lietotāju autorizācija / Pieteikšanās (`POST /api/auth/login`)
- Pieteikšanās sistēmā, ievadot e-pasta adresi (vai lietotājvārdu) un paroli.
- Paroles heša salīdzināšana, izmantojot `bcrypt.compare`.
- Aizsardzība pret paroles heša noplūdi — lauks `password_hash` tiek izņemts no visām API atbildēm.
- Ja dati nav pareizi, tiek atgriezta kļūda `401 Unauthorized` ar paziņojumu: *"Nepareizs e-pasts vai parole."*

### 1.3. Autorizētā lietotāja profils (`GET /api/auth/me`)
- Aizsargāts maršruts, kam nepieciešams galvene `Authorization: Bearer <token>`.
- Atgriež lietotāja profilu un viņa sistēmas lomu (`role_name`).

### 1.4. Izrakstīšanās (`POST /api/auth/logout`)
- Aizsargāts maršruts sesijas pabeigšanai klienta pusē.

### 1.5. Sistēmas lomas (`GET /api/roles`)
- Atgriež sistēmā definētās lomas (`guest`, `user`, `landlord`, `admin`).

---

## 2. Prasību un ievades datu atbilstība (Specifikācija)

Saskaņā ar dokumenta sadaļu **2.1.1 "Ieejas informācijas apraksts"** ir realizētas šādas validācijas pārbaudes:

| Lauks | Tips | Prasība specifikācijā | Realizētā pārbaude | Kļūdas kods un paziņojums |
|---|---|---|---|---|
| **`username`** | `VARCHAR(20)` | Unikāls lietotāja vārds, maks. 20 simboli (piem., *„jānis123”*) | Obligāts, 1–20 simboli, unikalitāte datubāzē | `400` ("Lietotājvārds nedrīkst pārsniegt 20 simbolus.") vai `409` ("Lietotājvārds jau ir aizņemts.") |
| **`fname`** | `VARCHAR(50)` | Lietotāja vārds, maks. 50 simboli (piem., *„Jānis”*) | Obligāts, 1–50 simboli | `400` ("Vārds ir obligāts lauks.") |
| **`surname`** | `VARCHAR(50)` | Lietotāja uzvārds, maks. 50 simboli (piem., *„Bērziņš”*) | Obligāts, 1–50 simboli | `400` ("Uzvārds ir obligāts lauks.") |
| **`email`** | `VARCHAR(255)` | Unikāls e-pasts, maks. 255 simboli (piem., *„janis@mail.com”*) | Obligāts, derīgs e-pasta formāts, unikalitāte | `400` ("Nederīgs e-pasta adreses formāts.") vai `409` ("E-pasta adrese jau ir reģistrēta.") |
| **`phone_number`** | `VARCHAR(15)` | Unikāls tālrunis, maks. 15 simboli (piem., *„+37120000000”*) | Obligāts, derīgs tālruņa formāts, unikalitāte | `400` ("Nederīgs tālruņa numura formāts.") vai `409` ("Tālruņa numurs jau ir reģistrēts.") |
| **`password`** | `VARCHAR(255)` | *„Parolei jābūt vismaz 7 simbolu garai, un obligāti jāiekļauj gan burti, gan cipari”* | Vismaz 7 simboli, obligāti jāsatur gan burti, gan cipari | `400` ("Parolē obligāti jāiekļauj gan burti, gan cipari.") |
| **`role_id`** | `INT` | Ārējā atslēga uz `roles.role_id` | Pēc noklusējuma `2` (`user`) | `400` |

---

## 3. Datubāzes fiziskā struktūra

Failā [`src/db/schema.sql`](file:///Users/leb/Documents/monet/backend/src/db/schema.sql) ir definētas visas 7 tabulas atbilstoši dokumenta 5. nodaļai:

- **`roles`** (5.1. Tabula): `role_id` (PK, INT AUTO_INC), `role_name` (VARCHAR(20) UNIQUE).
- **`users`** (5.2. Tabula): `user_id` (PK, INT AUTO_INC), `username`, `fname`, `surname`, `email`, `phone_number`, `role_id` (FK), `password_hash`, `created_at`.
- **`coworking_spaces`** (5.3. Tabula): `space_id` (PK), `creator_id` (FK), `space_name`, `address`, `space_description`, `available_spots`, `price_per_hour`, `price_per_day`, `is_active`, `created_at`.
- **`photos`** (5.7. Tabula): `photo_id` (PK), `space_id` (FK), `photo_path`.
- **`reservations`** (5.4. Tabula): `reservation_id` (PK), `space_id` (FK), `user_id` (FK), `reservation_type`, `guest_count`, `amount`, `start_time`, `end_time`, `reservation_status`, `created_at`.
- **`payment_history`** (5.5. Tabula): `payment_id` (PK), `reservation_id` (FK), `amount`, `payment_status`, `created_at`.
- **`reviews`** (5.6. Tabula): `review_id` (PK), `reservation_id` (FK, UNIQUE), `user_id` (FK), `space_id` (FK), `rating`, `comment`, `created_at`.

> **Elastīgais datubāzes adapteris:** Serviss pēc noklusējuma pieslēdzas **MySQL** datubāzei. Ja MySQL serveris lokāli nav palaists, sistēma automātiski un bez kļūdām aktivizē lokālo **SQLite** krātuvi (`node:sqlite`), ļaujot veikt izstrādi un testēšanu uzreiz.

---

## 4. API galapunktu (Endpoints) specifikācija

### 4.1. Reģistrācija
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

### 4.2. Pieteikšanās (Autorizācija)
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

### 4.3. Lietotāja profils
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

### 4.4. Izrakstīšanās
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

### 4.5. Lomas
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

## 5. Uzstādīšana un palaišana

### 5.1. Vides mainīgie (`.env`)
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

### 5.2. Atkarību instalēšana
```bash
npm install
```

### 5.3. Datubāzes inicializēšana (MySQL)
Lai izveidotu datubāzi un tabulas MySQL vidē:
```bash
npm run db:init
```

### 5.4. Servera palaišana
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

## 6. Automatizētā testēšana

Projektā ir iekļauts 15 automatizēto integrācijas testu komplekts:
```bash
npm test
```

### Testēšanas rezultāts:
```
✔ 1. Sistēmas lomas - getRoles atgriež noklusējuma lomas (guest, user, landlord, admin)
✔ 2. Reģistrācija - Veiksmīga reģistrācija ar derīgiem datiem atbilstoši specifikācijai
✔ 3. Reģistrācija - Neveiksmīga, ja parole ir īsāka par 7 simboliem
✔ 4. Reģistrācija - Neveiksmīga, ja parole nesatur gan burtus, gan ciparus
✔ 5. Reģistrācija - Neveiksmīga, ja lietotājvārds pārsniedz 20 simbolus
✔ 6. Reģistrācija - Neveiksmīga, ja tālruņa numura formāts ir nederīgs
✔ 7. Reģistrācija - Konflikts 409, ja lietotājvārds, e-pasts vai tālrunis jau eksistē
✔ 8. Pieteikšanās (Login) - Veiksmīga ar pareizu e-pastu un paroli
✔ 9. Pieteikšanās (Login) - Veiksmīga ar lietotājvārdu un paroli
✔ 10. Pieteikšanās (Login) - Neveiksmīga ar nepareizu paroli (401)
✔ 11. Pieteikšanās (Login) - Neveiksmīga ar neeksistējošu lietotāju (401)
✔ 12. Aizsargātais profils - GET /api/auth/me ar derīgu Bearer marķieri atgriež profilu
✔ 13. Aizsargātais profils - Noraida neautorizētu pieprasījumu bez marķiera (401)
✔ 14. RBAC autorizācija - Bloķē lietotāju bez nepieciešamās lomas (403)
✔ 15. Izrakstīšanās (Logout) - POST /api/auth/logout atgriež veiksmīgu rezultātu

ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
```

---

## 7. Projekta failu struktūra

```
backend/
├── .env                              # Vides mainīgo konfigurācija
├── .env.example                      # Vides mainīgo paraugs
├── .gitignore                        # Git ignorējamie faili
├── package.json                      # Projekta atkarības un skripti
├── README.md                         # Galvenā dokumentācija latviešu valodā
├── AUTH_DOCUMENTATION.md             # Paplašināta tehniskā specifikācija
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
    └── auth.test.js                  # 15 automatizēti testi
```
