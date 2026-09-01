import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/user.controller';

const router = Router();
router.use(authenticateToken); 

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
