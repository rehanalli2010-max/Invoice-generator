import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice 
} from '../controllers/invoice.controller';

const router = Router();

router.use(authenticateToken); 

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
