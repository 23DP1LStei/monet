import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import spaceRoutes from './routes/spaceRoutes.js';
import { initDatabase, getDriverName } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Globālā starpprogrammatūra
app.use(cors());
app.use(express.json());

// API bāzes informācija
app.get('/', (req, res) => {
  res.json({
    message: 'Monet kopstrādes platformas API',
    status: 'tiešsaistē',
    databaseDriver: getDriverName() || 'nav_savienots',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Aizsargāts)',
        logout: 'POST /api/auth/logout (Aizsargāts)',
      },
      roles: {
        list: 'GET /api/roles',
      },
      spaces: {
        list: 'GET /api/spaces',
        featured: 'GET /api/spaces/featured (Atlases kritērijs vēl jāsaskaņo)',
        cities: 'GET /api/spaces/cities (Datubāzes lauks vēl jāsaskaņo)',
      },
      health: 'GET /health',
    },
  });
});

// Sistēmas darbības stāvokļa pārbaude (Health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: getDriverName() || 'atvienots',
    timestamp: new Date().toISOString(),
  });
});

// Pievieno maršrutus
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/spaces', spaceRoutes);

// Kļūdu un neatrasto ceļu apstrāde
app.use(notFoundHandler);
app.use(errorHandler);

// Palaiž serveri tikai tad, ja fails tiek izsaukts tieši, nevis importēts testos
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  initDatabase()
    .then((driver) => {
      app.listen(PORT, () => {
        console.log(`🚀 Monet serveris darbojas adresē http://localhost:${PORT}`);
        console.log(`📦 Aktīvais datubāzes draiveris: ${driver}`);
      });
    })
    .catch((err) => {
      console.error('❌ Neizdevās palaist serveri datubāzes kļūdas dēļ:', err);
      process.exit(1);
    });
}

export default app;
