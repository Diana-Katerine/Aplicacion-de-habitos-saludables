import { Router, type Request, type Response } from 'express';
import { db } from '../db/index';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Obtener todas las categorías (globales del sistema y las personalizadas del usuario autenticado)
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const stmt = db.prepare(`
      SELECT id, user_id as userId, name, icon_name as iconName, color_hex as colorHex, created_at as createdAt
      FROM categories
      WHERE user_id IS NULL OR user_id = ?
      ORDER BY id ASC
    `);
    const rows = stmt.all(userId);
    res.json({ categories: rows });
  } catch (err) {
    console.error('Error al listar categorías:', err);
    res.status(500).json({ error: 'Error interno al consultar las categorías.' });
  }
});

// Crear una nueva categoría personalizada para el usuario autenticado
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { name, iconName, colorHex } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
      return;
    }

    const cleanName = name.trim();
    const icon = typeof iconName === 'string' && iconName.trim() ? iconName.trim() : 'Tag';
    const color = typeof colorHex === 'string' && colorHex.trim() ? colorHex.trim() : '#6B7280';

    const insertStmt = db.prepare(`
      INSERT INTO categories (user_id, name, icon_name, color_hex)
      VALUES (?, ?, ?, ?)
    `);
    const info = insertStmt.run(userId, cleanName, icon, color);
    const newId = Number(info.lastInsertRowid);

    res.status(201).json({
      message: 'Categoría creada exitosamente.',
      category: {
        id: newId,
        userId,
        name: cleanName,
        iconName: icon,
        colorHex: color,
      },
    });
  } catch (err) {
    console.error('Error al crear categoría:', err);
    res.status(500).json({ error: 'Error interno al crear la categoría.' });
  }
});

export default router;
