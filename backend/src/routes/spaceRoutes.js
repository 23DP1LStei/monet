import { Router } from 'express';
import { spaceController } from '../controllers/spaceController.js';
import { validateSpaceQuery } from '../middleware/validateSpaceQuery.js';

const router = Router();

// Publiski galapunkti: telpu apskatei nav nepieciešams JWT.
router.get('/featured', validateSpaceQuery, spaceController.featuredSpaces);
router.get('/cities', spaceController.listCities);
router.get('/', validateSpaceQuery, spaceController.listSpaces);

export default router;
