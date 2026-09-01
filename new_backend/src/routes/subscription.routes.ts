import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createCheckoutSession } from '../controllers/subscription.controller';

const router = Router();
router.use(authenticateToken);

router.post('/create-checkout-session', createCheckoutSession);

export default router;
