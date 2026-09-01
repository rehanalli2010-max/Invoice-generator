import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

export const getEmailConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' }) as any;

    const config = await prisma.emailConfig.findFirst({
      where: { userId }
    });

    res.json(config || null);
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({ error: 'Failed to fetch email config' });
  }
};

export const saveEmailConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' }) as any;

    const { 
      host, port, secure, user, pass, 
      fromName, fromEmail, 
      emailSubjectTemplate, emailAccentColor, emailShowLogo, emailBodyBg 
    } = req.body;

    const existing = await prisma.emailConfig.findFirst({ where: { userId } });

    if (existing) {
      await prisma.emailConfig.update({
        where: { id: existing.id },
        data: {
          host, port: parseInt(port), secure: secure ? 1 : 0, user, pass,
          fromName, fromEmail,
          emailSubjectTemplate, emailAccentColor, emailShowLogo, emailBodyBg
        }
      });
    } else {
      await prisma.emailConfig.create({
        data: {
          userId,
          host, port: parseInt(port), secure: secure ? 1 : 0, user, pass,
          fromName, fromEmail,
          emailSubjectTemplate, emailAccentColor, emailShowLogo, emailBodyBg
        }
      });
    }

    res.json({ message: 'Email configuration saved successfully' });
  } catch (error) {
    console.error('Error saving email config:', error);
    res.status(500).json({ error: 'Failed to save email config' });
  }
};
