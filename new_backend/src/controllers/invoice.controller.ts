import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index'; // Import global prisma client

// GET /api/invoices
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { statusHistory: true }
    });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// GET /api/invoices/:id
export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invoiceId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: userId },
      include: { statusHistory: true }
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// POST /api/invoices
export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, data, status, customFields, paidAt, dueAt } = req.body;

    // --- Premium Tier Limit Enforcement ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    let currentCount = user.dailyActionCount;
    
    // Reset limit if it is a new day
    if (user.dailyActionDate !== todayDateStr) {
        currentCount = 0;
    }

    // Assign limits based on Tier
    let invoiceLimit = 20; // Free
    if (user.tier === 'startup') invoiceLimit = 500;
    else if (user.tier === 'business' || user.tier === 'enterprise') invoiceLimit = 5000;

    if (currentCount >= invoiceLimit) {
        res.status(429).json({ error: `Daily invoice limit of ${invoiceLimit} reached. Please upgrade your plan.` });
        return;
    }

    // Update count immediately before creating to avoid race conditions
    await prisma.user.update({
        where: { id: userId },
        data: {
            dailyActionCount: currentCount + 1,
            dailyActionDate: todayDateStr
        }
    });
    // -------------------------------------

    const newInvoice = await prisma.invoice.create({
      data: {
        id: id,
        userId: userId,
        data: typeof data === 'string' ? data : JSON.stringify(data),
        status: status || 'draft',
        customFields: customFields ? JSON.stringify(customFields) : '[]',
        paidAt: paidAt ? new Date(paidAt) : null,
        dueAt: dueAt ? new Date(dueAt) : null,
      }
    });

    await prisma.statusHistory.create({
      data: {
        invoiceId: newInvoice.id,
        toStatus: 'draft',
        changedBy: userId
      }
    });

    res.status(201).json({ message: 'Invoice saved successfully', invoice: newInvoice });
  } catch (error) {
    console.error('Error saving invoice:', error);
    res.status(500).json({ error: 'Failed to save invoice' });
  }
};

// PUT /api/invoices/:id
export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const invoiceId = req.params.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
  
      const { data, status, customFields, paidAt, dueAt } = req.body;
      
      const existing = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId }
      });

      if (!existing) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined,
          status: status,
          customFields: customFields ? JSON.stringify(customFields) : undefined,
          paidAt: paidAt ? new Date(paidAt) : undefined,
          dueAt: dueAt ? new Date(dueAt) : undefined,
        }
      });
  
      if (status && existing.status !== status) {
        await prisma.statusHistory.create({
          data: {
            invoiceId: updatedInvoice.id,
            fromStatus: existing.status,
            toStatus: status,
            changedBy: userId
          }
        });
      }
  
      res.json({ message: 'Invoice updated successfully', invoice: updatedInvoice });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  };

// DELETE /api/invoices/:id
export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invoiceId = req.params.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.invoice.deleteMany({
      where: { id: invoiceId, userId: userId }
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};
