import type { Request, Response, NextFunction } from 'express';

export function requireBearer(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 'no_bearer' });
    return;
  }
  req.accessToken = h.slice(7);
  next();
}
