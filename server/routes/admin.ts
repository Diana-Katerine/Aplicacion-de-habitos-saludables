import { Router, type Response } from 'express';
import { db } from '../db/index';
import { authenticate, requireRole, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Todas las rutas de administración requieren autenticación y rol 'ADMIN'
router.use(authenticate, requireRole(['ADMIN']));

// 1. Estadísticas globales del sistema para administradores
router.get('/metrics', (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
    const totalHabits = (db.prepare('SELECT COUNT(*) as count FROM habits WHERE deleted_at IS NULL').get() as any)?.count || 0;
    const activeHabits = (db.prepare('SELECT COUNT(*) as count FROM habits WHERE is_active = 1 AND deleted_at IS NULL').get() as any)?.count || 0;
    const totalLogs = (db.prepare('SELECT COUNT(*) as count FROM habit_logs').get() as any)?.count || 0;
    const completedLogs = (db.prepare('SELECT COUNT(*) as count FROM habit_logs WHERE is_completed = 1').get() as any)?.count || 0;

    const usersByRole = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all();

    res.json({
      metrics: {
        totalUsers,
        totalHabits,
        activeHabits,
        totalLogs,
        completedLogs,
        completionRate: totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0,
        usersByRole,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error al consultar métricas administrativas:', err);
    res.status(500).json({ error: 'Error interno al consultar las métricas administrativas.' });
  }
});

// 2. Listar todos los usuarios del sistema (solo administradores)
router.get('/users', (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name as fullName, timezone, theme_preference as themePreference, role, created_at as createdAt
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (err) {
    console.error('Error al listar usuarios de administración:', err);
    res.status(500).json({ error: 'Error interno al consultar usuarios.' });
  }
});

// 3. Crear una categoría global oficial del sistema (user_id = NULL)
router.post('/categories', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { name, iconName, colorHex } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El nombre de la categoría global es requerido.' });
      return;
    }

    const cleanName = name.trim();
    const icon = typeof iconName === 'string' && iconName.trim() ? iconName.trim() : 'Tag';
    const color = typeof colorHex === 'string' && colorHex.trim() ? colorHex.trim() : '#10B981';

    const insertStmt = db.prepare(`
      INSERT INTO categories (user_id, name, icon_name, color_hex)
      VALUES (NULL, ?, ?, ?)
    `);
    const info = insertStmt.run(cleanName, icon, color);
    const newId = Number(info.lastInsertRowid);

    res.status(201).json({
      message: 'Categoría global creada exitosamente.',
      category: {
        id: newId,
        userId: null,
        name: cleanName,
        iconName: icon,
        colorHex: color,
        isGlobal: true,
      },
    });
  } catch (err) {
    console.error('Error al crear categoría global:', err);
    res.status(500).json({ error: 'Error interno al crear categoría global.' });
  }
});

export default router;
