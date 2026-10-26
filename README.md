# Monet – kopstrādes telpu platforma

> **Īss apraksts** – Monet ir tiešsaistes platforma, kas ļauj lietotājiem reģistrēties, rezervēt telpas, pārvaldīt rezervācijas un administrēt sistēmu. Projekts ir sadalīts divās daļās – **backend** (Node.js/Express) un **frontend** (React + Vite).

---

## 1. Sistēmas arhitektūra

```
monet/
├─ backend/          # Node.js/Express API
│   └─ src/
│       ├─ config/          # Konfigurācijas (env, DB)
│       ├─ db/              # SQLite inicializācija & schema
│       ├─ middleware/      # Autentifikācija, validācija, kļūdu apstrāde
│       ├─ services/        # Biznes loģika (auth, space, admin)
│       ├─ controllers/     # API kontrolieri (auth, space, admin)
│       └─ routes/          # Express maršruti
├─ frontend/         # React aplikācija (Vite)
│   └─ src/ (nav, bet tiek izveidota pie pirmās instalācijas)
└─ README.md          # Šis faila
```

### 1.1. Galvenie moduļi
- **authController** – lietotāju reģistrācija, ielogošanās, profila pārvaldība, lomu saraksts.
- **spaceController** (nav izpildīts, bet paredzēts telpu pārvaldībai).
- **adminController** – administratora funkcijas (lietotāju un telpu pārskats).
- **middleware/auth.js** – JWT pārbaude un lietotāja identifikācija.
- **services/authService.js** – reģistrācijas, ielogošanās, paroles maiņa loģika, kļūdu klases (`ConflictError`, `AuthenticationError`).
- **db/schema.sql** – SQLite datubāzes struktūra (lietotāji, telpas, rezervācijas).

---

## 2. Prasības (prerequisites)
| Komponents | Versija |
|------------|---------|
| Node.js    | >= 18   |
| npm / yarn |   –     |
| SQLite     | 3.x (iekļauts) |
| Git        | – |

---

## 3. Instalēšana
```bash
# Klonē repo
git clone https://github.com/your-org/monet.git
cd monet

# Instalē backend atkarības
cd backend
npm install   # vai yarn install

# (Ja frontend mape jau eksistē) instalē arī tās atkarības
cd ../frontend
npm install   # vai yarn install
```

---

## 4. Konfigurācija
1. **Vides mainīgie** – `.env` fails `backend/` direktorijā.
   ```dotenv
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=ĪpašsNoslēpums
   DB_PATH=./data/monet.sqlite
   ```
2. **Datubāzes inicializācija** – izpildi vienreiz:
   ```bash
   npm run db:init   # skripts, kas izpilda ./src/db/schema.sql
   ```
   (Ja skripts nav, palaidiet `sqlite3 data/monet.sqlite < src/db/schema.sql`).

---

## 5. Palaišana
```bash
# Backend (REST API)
cd backend
npm start   # skripts – nodrošina nodemon vai node src/index.js

# Frontend (React lietojumprogramma)
cd ../frontend
npm run dev   # Vite dev server, parasti pieejams http://localhost:5173
```

---

## 6. API pārskats (Latviski)
| Metode | Ceļš | Apraksts |
|--------|------|----------|
| **POST** | `/api/auth/register` | Reģistrē jaunu lietotāju (body: `email`, `password`, `name`). |
| **POST** | `/api/auth/login` | Ielogojas, atgriež JWT un iestatīs sīkfailu `monet_auth`. |
| **GET** | `/api/auth/me` | Atgriež pašreizējā lietotāja profilu (autorizēts). |
| **POST** | `/api/auth/logout` | Noņem autentifikācijas sīkfailu. |
| **GET** | `/api/roles` | Atgriež pieejamās lomas (`admin`, `member`, `viewer`). |
| **PUT** | `/api/auth/profile` | Atjaunina lietotāja datus (nosaukums, e-pasts). |
| **PUT** | `/api/auth/password` | Maina lietotāja paroli. |

**Papildu maršruti** (admin, space) ir definēti `backend/src/routes/`, bet to implementācija ir līdzīgi strukturēta kā `auth`.

---

## 7. Testēšana – programmatūras lietojamības novērtējums
### 7.1. Avots
Testēšanas dati sniegti dokumentā **`7_Programmaturas_lietojamibas_testesana.docx`** (ielādēts no `/Users/leb/Downloads`). Tajā ir iekļauts detalizēts lietojamības un funkcionālais testu pārskats.

### 7.2. Galvenie testu scenāriji
- **Lietotāju reģistrācijas modulis** – tika pārbaudīti:
  - Veiksmīga reģistrācija.
  - Reģistrācija ar jau esošu e-pasta adresi (gaidīts 409 Conflict).
  - Reģistrācija ar jau esošu lietotājvārdu.
  - Reģistrācija ar nepilniem datiem (gaidīta kļūda).
- **Autentifikācijas plūsma** – pārbauda JWT izsniegšanu, sīkfaila uzstādīšanu, pierakstīšanos un atteikšanos.
- **CORS konfigurācija** – atrisināts konflikts pēc merge (dienas 2026‑10‑26), ļauj serverim atbildēt uz pieprasījumiem no frontend.
- **Servera startēšana** – automātiskie testi (Jest/Mocha) veiksmīgi izpildās, apstrādājot CORS pieprasījumus.
- **Izņēmumu un robežvērtību pārbaude** – laika intervālu validācija (`endDate > startDate`) pareizi nosūta `400 Bad Request` nepareiziem datiem.

### 7.3. Testu izpilde
```bash
# Backend testu izpilde (pieņem, ka testu rīks ir jest)
cd backend
npm test
```
Rezultāti ir aprakstīti XML/HTML atskaitē (`coverage/` direktorijā).

---

## 8. Biežāk uzdotie jautājumi (BUJ)
| Jautājums | Atbilde |
|-----------|--------|
| Kā pievienot jaunu API maršrutu? | Izveido `controller` un `service` failus, pievieno maršrutu `backend/src/routes/*.js` un reģistrē to `src/index.js`. |
| Kā mainīt datubāzes tipu? | Aizstāj `sqlite3` ar `postgresql` vai `mysql2` – atjaunojiet `backend/src/config/db.js` un `schema.sql`. |
| Kā palaist frontend bez Vite? | Izmantojiet `npm run build` un pakalpojiet `dist/` ar statisku serveri (nginx, serve). |
| Kā aktivēt HTTPS lokāli? | Izveidojiet pašparakstītu sertifikātu un iestatiet `secure: true` Vite dev servera `https` opcijā. |

---

## 9. Palīdzība un saziņa
- **Live čats** – pieejams UI (labākākai iekļaušanai var pievienot UI plugin).
- **E‑pasts** – support@monet.example.com
- **Dokumentācija** – https://docs.monet.example.com (tiek turpināta izveide).

---

## 10. Drošība un privātums
- **JWT** – īsa dzīves laika, SSL/TLS pieslēgumi.
- **Paroles** – glabātas ar `bcryptjs` (`saltRounds = 10`).
- **CORS** – konfigurēts `backend/src/middleware/validate.js` lai atļautu tikai mūsu domēnu.
- **GDPR** – lietotāja datu dzēšana (`DELETE /api/users/:id`) ir iespējama.

---

## 11. Licences noteikumi
Šis projekts tiek licencēts zem **MIT licences**. Plašāka informācija atrodama failā `LICENSE`.

---

*Paldies, ka izvēlējāties Monet!*