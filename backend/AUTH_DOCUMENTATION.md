# 🏢 Monet Kopstrādes Sistēma — Autentifikācijas Moduļa Dokumentācija

Pilna tehniskā dokumentācija un aizmugursistēmas (backend) realizācijas apraksts **reģistrācijas** un **autorizācijas (pieteikšanās)** lapām platformā **Monet**, kas izstrādāta, pamatojoties uz tehnisko aprakstu failā `monet_posms2.docx`.

---

## 📑 Satura rādītājs

1. [Arhitektūras pārskats](#1-arhitektūras-pārskats)
2. [Atbilstība tehniskajam uzdevumam (Specifikācija)](#2-atbilstība-tehniskajam-uzdevumam-specifikācija)
3. [Datubāzes shēma un ER modelis](#3-datubāzes-shēma-un-er-modelis)
4. [API galapunktu (Endpoints) specifikācija](#4-api-galapunktu-endpoints-specifikācija)
   - [Reģistrācija (`POST /api/auth/register`)](#41-reģistrācija-post-apiauthregister)
   - [Pieteikšanās (`POST /api/auth/login`)](#42-pieteikšanās-post-apiauthlogin)
   - [Lietotāja profils (`GET /api/auth/me`)](#43-lietotāja-profils-get-apiauthme)
   - [Izrakstīšanās (`POST /api/auth/logout`)](#44-izrakstīšanās-post-apiauthlogout)
   - [Sistēmas lomas (`GET /api/roles`)](#45-sistēmas-lomas-get-apiroles)
5. [Drošība un lomu piekļuves kontrole (RBAC)](#5-drošība-un-lomu-piekļuves-kontrole-rbac)
6. [Projekta failu struktūra](#6-projekta-failu-struktūra)
7. [Uzstādīšanas, konfigurācijas un palaišanas instrukcija](#7-uzstādīšanas-konfigurācijas-un-palaišanas-instrukcija)
8. [Automatizētās testēšanas rezultāti](#8-automatizētās-testēšanas-rezultāti)

---

## 1. Arhitektūras pārskats

Aizmugursistēma ir veidota uz **Node.js** bāzes, izmantojot **Express.js** ietvaru (ECMAScript moduļi, `"type": "module"`). Arhitektūra ir sadalīta neatkarīgos slāņos:

```
Klients (Frontend)
       │
       ▼
[ Validācijas starpprogrammatūra ] ───▶ [ Kontrolieris ] ───▶ [ Serviss ] ───▶ [ DB Adapteris ] ───▶ MySQL / SQLite
       │
       ▼ (kļūdas gadījumā)
[ 400 Bad Request / 409 Conflict ]
```

- **Maršruti (`src/routes/`)** — novirza ienākošos HTTP pieprasījumus uz atbilstošajiem kontrolieriem.
- **Starpprogrammatūra (`src/middleware/`)** — ievades datu validācija, JWT marķieru pārbaude, piekļuves ierobežošana pēc lietotāju lomām un centralizēta kļūdu apstrāde.
- **Kontrolieri (`src/controllers/`)** — pieņem HTTP pieprasījumus, izsauc biznesa loģiku un atgriež strukturētas HTTP atbildes.
- **Servisi (`src/services/`)** — biznesa loģika (paroļu hešēšana ar bcrypt, JWT marķieru parakstīšana, unikalitātes pārbaudes datubāzē).
- **Konfigurācija un datubāze (`src/config/`, `src/db/`)** — MySQL savienojumu pūls ar iebūvētu SQLite rezerves krātuvi lokālajai izstrādei.

---

## 2. Atbilstība tehniskajam uzdevumam (Specifikācija)

Saskaņā ar dokumenta sadaļu **2.1.1 "Ieejas informācijas apraksts"** ir realizētas visas prasības:

| Lauks | Tips | Prasība specifikācijā | Realizētā validācija un Regex | Kļūda |
|---|---|---|---|---|
| **`username`** | `VARCHAR(20)` | Min 3, max 20, burti un vismaz viens cipars | `/^(?=.*[a-zA-Z])(?=.*\d).{3,20}$/` | `400` vai `409` |
| **`fname`** | `VARCHAR(50)` | Līdz 50 simboliem, bez cipariem | `/^[^\d]+$/` | `400` |
| **`surname`** | `VARCHAR(50)` | Līdz 50 simboliem, bez cipariem | `/^[^\d]+$/` | `400` |
| **`email`** | `VARCHAR(50)` | Līdz 50 simboliem, derīgs e-pasts | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `400` vai `409` |
| **`phone_number`** | `VARCHAR(15)` | Min 7, max 15, cipari, un '+' / '(' / ')' / '-' neobligāti | `/^\+?[0-9\s\-()]{7,15}$/` | `400` vai `409` |
| **`password`** | `VARCHAR(255)` | Min 8, max 50, burti un vismaz viens cipars | `/^(?=.*[a-zA-Z])(?=.*\d).{8,50}$/` | `400` |
| **`role_id`** | `INT (FK)` | Sasaiste ar lietotāja lomu tabulu | Pēc noklusējuma `2` (`user`) | `400` |

---

## 3. Datubāzes shēma un ER modelis

Failā [`src/db/schema.sql`](file:///Users/leb/Documents/monet/backend/src/db/schema.sql) ir izveidotas visas 7 tabulas atbilstoši dokumenta 5. nodaļai:

```
 ┌──────────────┐         1:N         ┌──────────────────┐
 │    roles     │────────────────────▶│      users       │
 └──────────────┘                     └──────────────────┘
                                                │ 1:N
                                                ▼
 ┌──────────────┐         1:N         ┌──────────────────┐
 │    photos    │◀────────────────────│ coworking_spaces │
 └──────────────┘                     └──────────────────┘
                                                │ 1:N
                                                ▼
 ┌──────────────────┐     1:1         ┌──────────────────┐
 │ payment_history  │◀────────────────│   reservations   │
 └──────────────────┘                 └──────────────────┘
                                                │ 1:1
                                                ▼
                                      ┌──────────────────┐
                                      │     reviews      │
                                      └──────────────────┘
```

1. **`roles`** (5.1. Tabula): sistēmas lomas (`guest`, `user`, `landlord`, `admin`).
2. **`users`** (5.2. Tabula): reģistrētie lietotāji ar hešētām parolēm un piesaistītajām lomām.
3. **`coworking_spaces`** (5.3. Tabula): kopstrādes telpas un to tarifi.
4. **`photos`** (5.7. Tabula): telpu attēlu saites.
5. **`reservations`** (5.4. Tabula): lietotāju telpu rezervācijas.
6. **`payment_history`** (5.5. Tabula): rezervāciju maksājumu vēsture.
7. **`reviews`** (5.6. Tabula): lietotāju atsauksmes un zvaigžņu vērtējumi (1–5).

---

## 4. API galapunktu (Endpoints) specifikācija

### 4.1. Reģistrācija (`POST /api/auth/register`)
- **URL:** `/api/auth/register`
- **Metode:** `POST`
- **Galvene:** `Content-Type: application/json`
- **Pieprasījums:**
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
- **Validācijas kļūda (`400 Bad Request`):**
  ```json
  {
    "success": false,
    "message": "Nederīgi ievadīti dati.",
    "errors": [
      {
        "field": "password",
        "message": "Parolē obligāti jāiekļauj gan burti, gan cipari."
      }
    ]
  }
  ```
- **Datu konflikta kļūda (`409 Conflict`):**
  ```json
  {
    "success": false,
    "message": "E-pasta adrese jau ir reģistrēta.",
    "field": "email"
  }
  ```

---

### 4.2. Pieteikšanās (`POST /api/auth/login`)
- **URL:** `/api/auth/login`
- **Metode:** `POST`
- **Pieprasījums:**
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
- **Kļūda (`401 Unauthorized`):**
  ```json
  {
    "success": false,
    "message": "Nepareizs e-pasts vai parole."
  }
  ```

---

### 4.3. Lietotāja profils (`GET /api/auth/me`)
- **URL:** `/api/auth/me`
- **Metode:** `GET`
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

---

### 4.4. Izrakstīšanās (`POST /api/auth/logout`)
- **URL:** `/api/auth/logout`
- **Metode:** `POST`
- **Galvene:** `Authorization: Bearer <token>`
- **Veiksmīga atbilde (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Veiksmīgi izrakstījies no sistēmas."
  }
  ```

---

### 4.5. Sistēmas lomas (`GET /api/roles`)
- **URL:** `/api/roles`
- **Metode:** `GET`
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

## 5. Drošība un lomu piekļuves kontrole (RBAC)

1. **Paroļu drošība:** Paroles tiek glabātas tikai hešētā formā ar `bcrypt` (10 raundi).
2. **Datu aizsardzība:** `password_hash` tiek noņemts pirms atbildes nosūtīšanas klientam.
3. **JWT marķieri:** Autentifikācija notiek caur Bearer marķieri ar derīguma termiņu (7 dienas).
4. **Lomu kontrole (`authorizeRoles`):** Ja lietotājam nav tiesību veikt konkrēto darbību, tiek atgriezta kļūda `403 Forbidden`:
   ```json
   {
     "success": false,
     "message": "Piekļuve liegta: jums nav nepieciešamo tiesību šīs darbības veikšanai."
   }
   ```

---

## 6. Projekta failu struktūra

```
backend/
├── .env                              # Vides mainīgie
├── .env.example                      # Vides mainīgo paraugs
├── .gitignore                        # Git ignorētie faili
├── package.json                      # Projekta iestatījumi un atkarības
├── README.md                         # Galvenā dokumentācija latviešu valodā
├── AUTH_DOCUMENTATION.md             # Detalizēta dokumentācija latviešu valodā
├── src/
│   ├── config/
│   │   └── db.js                     # Datubāzes adapteris (MySQL + SQLite)
│   ├── controllers/
│   │   └── authController.js         # HTTP pieprasījumu kontrolieri
│   ├── db/
│   │   ├── init.js                   # Datubāzes inicializācijas skripts
│   │   └── schema.sql                # Fiziskās struktūras shēma (DDL)
│   ├── middleware/
│   │   ├── auth.js                   # JWT un lomu kontroles starpprogrammatūra
│   │   ├── errorHandler.js           # Kļūdu apstrādes starpprogrammatūra
│   │   └── validate.js               # Validācijas starpprogrammatūra
│   ├── routes/
│   │   ├── authRoutes.js             # Autentifikācijas maršruti
│   │   └── roleRoutes.js             # Lomu maršruti
│   ├── services/
│   │   └── authService.js            # Biznesa loģika un datu apstrāde
│   └── index.js                      # Servera galvenā programma
└── tests/
    └── auth.test.js                  # 15 automatizētie integrācijas testi
```

---

## 7. Uzstādīšanas, konfigurācijas un palaišanas instrukcija

### 1. solis: Vides mainīgo sagatavošana
Izveidojiet failu `.env`:
```env
PORT=3000
NODE_ENV=development

DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=monet_db

DB_SQLITE_PATH=./data/monet.sqlite

JWT_SECRET=super_secret_monet_coworking_token_jwt_2026
JWT_EXPIRES_IN=7d
```

### 2. solis: Atkarību instalēšana
```bash
npm install
```

### 3. solis: Datubāzes inicializēšana (MySQL)
```bash
npm run db:init
```

### 4. solis: Servera palaišana
```bash
# Izstrādes režīms
npm run dev

# Standarta režīms
npm start
```
Serveris būs pieejams: `http://localhost:3000`

---

## 8. Automatizētās testēšanas rezultāti

Palaidiet testus ar komandu:
```bash
npm test
```

Visi 15 testi izpildās ar 100% panākumu:
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

