import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import spaceRoutes from './routes/spaceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initDatabase, getDriverName } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Globālā starpprogrammatūra ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// ─── API bāzes informācija ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Monet kopstrādes platformas API',
    version: '2.0.0',
    status: 'tiešsaistē',
    databaseDriver: getDriverName() || 'nav_savienots',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login:    'POST /api/auth/login',
        me:       'GET  /api/auth/me       [JWT]',
        logout:   'POST /api/auth/logout   [JWT]',
      },
      roles: {
        list: 'GET /api/roles',
      },
      spaces: {
        list:    'GET  /api/spaces                        (query: location, city, type, period, price_min, price_max, instant_book, limit, offset)',
        detail:  'GET  /api/spaces/:id',
        reviews: 'GET  /api/spaces/:id/reviews            (query: limit, offset)',
      },
      reservations: {
        create: 'POST  /api/spaces/reservations          [JWT] (body: space_id, reservation_type, guest_count, start_time, end_time)',
        my:     'GET   /api/spaces/reservations/my       [JWT] (query: status, limit, offset)',
        cancel: 'PATCH /api/spaces/reservations/:id/cancel [JWT]',
      },
      reviews: {
        create: 'POST /api/spaces/reviews                [JWT] (body: reservation_id, rating, comment?)',
      },
      health: 'GET /health',
    },
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: getDriverName() || 'atvienots',
    timestamp: new Date().toISOString(),
  });
});

// ─── Maršruti ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/admin', adminRoutes);

// ─── Kļūdu apstrāde ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Palaiž serveri ───────────────────────────────────────────────────────────
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  initDatabase()
    .then((driver) => {
      app.listen(PORT, () => {
        console.log(`🚀 Monet serveris darbojas adresē http://localhost:${PORT}`);
        console.log(`📦 Aktīvais datubāzes draiveris: ${driver}`);
        console.log(`🔗 CORS atļautā izcelsme: ${process.env.FRONTEND_URL || '*'}`);
      });
    })
    .catch((err) => {
      console.error('❌ Neizdevās palaist serveri datubāzes kļūdas dēļ:', err);
      process.exit(1);
    });
}

export default app;
