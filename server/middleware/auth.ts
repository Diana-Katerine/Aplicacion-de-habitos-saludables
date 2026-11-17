import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../auth/security';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'No autorizado. Se requiere un token Bearer en el encabezado Authorization.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Token inválido o expirado. Inicia sesión nuevamente.',
    });
    return;
  }

  req.user = payload;
  next();
}
