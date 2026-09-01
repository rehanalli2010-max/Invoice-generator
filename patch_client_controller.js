const fs = require('fs');
let code = fs.readFileSync('new_backend/src/controllers/client.controller.ts', 'utf8');

if (!code.includes('limit of 3')) {
    const toReplace = `// POST /api/clients
export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, email, phone, address } = req.body;`;
    
    const replacement = `// POST /api/clients
export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, email, phone, address } = req.body;
    
    // --- Premium Tier Limit Enforcement (Clients) ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.tier === 'free') {
      const clientCount = await prisma.client.count({ where: { userId } });
      if (clientCount >= 3) {
        res.status(429).json({ error: 'Free tier limit of 3 clients reached. Please upgrade to manage unlimited clients.' });
        return;
      }
    }
    // ------------------------------------------------`;

    code = code.replace(toReplace, replacement);
    fs.writeFileSync('new_backend/src/controllers/client.controller.ts', code);
    console.log("Client controller patched to limit to 3 clients for free tier");
} else {
    console.log("Client controller already patched");
}
