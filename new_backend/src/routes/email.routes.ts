import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getEmailConfig, saveEmailConfig } from '../controllers/email.controller';

const router = Router();
router.use(authenticateToken); 

router.get('/config', getEmailConfig);
router.post('/config', saveEmailConfig);

export default router;
