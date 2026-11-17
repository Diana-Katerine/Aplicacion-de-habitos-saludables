import { Router, type Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Formateador para registros de seguimiento
function formatLogRow(row: any) {
  return {
    id: row.id,
    habitId: row.habit_id,
    userId: row.user_id,
    logDate: row.log_date,
    completedValue: Number(row.completed_value),
    isCompleted: Boolean(row.is_completed),
    energyLevel: row.energy_level ? Number(row.energy_level) : null,
    moodTag: row.mood_tag || null,
    journalEntry: row.journal_entry || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 1. Obtener registros de seguimiento (con filtros por habitId, startDate, endDate)
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { habitId, startDate, endDate, date } = req.query;

    let sql = 'SELECT * FROM habit_logs WHERE user_id = ?';
    const params: any[] = [userId];

    if (habitId && typeof habitId === 'string') {
      sql += ' AND habit_id = ?';
      params.push(habitId);
    }

    if (date && typeof date === 'string') {
      sql += ' AND log_date = ?';
      params.push(date);
    } else {
      if (startDate && typeof startDate === 'string') {
        sql += ' AND log_date >= ?';
        params.push(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        sql += ' AND log_date <= ?';
        params.push(endDate);
      }
    }

    sql += ' ORDER BY log_date DESC, created_at DESC';

    const rows = db.prepare(sql).all(...params);
    res.json({ logs: rows.map(formatLogRow) });
  } catch (err) {
    console.error('Error al consultar logs:', err);
    res.status(500).json({ error: 'Error interno al consultar los registros de hábitos.' });
  }
});

// 2. Registrar o actualizar el progreso de un hábito en una fecha (Upsert)
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const {
      habitId,
      logDate,
      completedValue,
      isCompleted,
      energyLevel,
      moodTag,
      journalEntry,
    } = req.body || {};

    if (!habitId || typeof habitId !== 'string') {
      res.status(400).json({ error: 'El habitId es requerido.' });
      return;
    }

    // Validar formato de fecha YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!logDate || !dateRegex.test(logDate)) {
      res.status(400).json({ error: 'Debes proporcionar una fecha válida en formato YYYY-MM-DD (logDate).' });
      return;
    }

    // Verificar que el hábito pertenezca al usuario
    const habit = db.prepare(`
      SELECT id, target_value FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `).get(habitId, userId) as any;

    if (!habit) {
      res.status(404).json({ error: 'Hábito no encontrado o no autorizado.' });
      return;
    }

    const value = completedValue !== undefined ? Number(completedValue) : habit.target_value;
    const completed = isCompleted !== undefined ? (isCompleted ? 1 : 0) : (value >= habit.target_value ? 1 : 0);
    const energy = energyLevel && [1, 2, 3, 4, 5].includes(Number(energyLevel)) ? Number(energyLevel) : null;
    const validMoods = ['focused', 'motivated', 'calm', 'tired', 'stressed'];
    const mood = moodTag && validMoods.includes(moodTag) ? moodTag : null;
    const journal = typeof journalEntry === 'string' ? journalEntry.trim() : null;

    // Verificar si ya existe registro para esa fecha y hábito
    const existing = db.prepare(`
      SELECT id FROM habit_logs WHERE habit_id = ? AND log_date = ? AND user_id = ?
    `).get(habitId, logDate, userId) as any;

    let logId: string;

    if (existing) {
      logId = existing.id;
      const updateStmt = db.prepare(`
        UPDATE habit_logs
        SET completed_value = ?, is_completed = ?, energy_level = ?, mood_tag = ?, journal_entry = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `);
      updateStmt.run(value, completed, energy, mood, journal, logId, userId);
    } else {
      logId = crypto.randomUUID();
      const insertStmt = db.prepare(`
        INSERT INTO habit_logs (
          id, habit_id, user_id, log_date, completed_value, is_completed, energy_level, mood_tag, journal_entry
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(logId, habitId, userId, logDate, value, completed, energy, mood, journal);
    }

    const saved = db.prepare('SELECT * FROM habit_logs WHERE id = ?').get(logId);

    res.status(existing ? 200 : 201).json({
      message: existing ? 'Registro de hábito actualizado.' : 'Registro de hábito creado.',
      log: formatLogRow(saved),
    });
  } catch (err) {
    console.error('Error al registrar habit_log:', err);
    res.status(500).json({ error: 'Error interno al guardar el registro de seguimiento.' });
  }
});

// 3. Eliminar un registro de seguimiento
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const existing = db.prepare(`
      SELECT id FROM habit_logs WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!existing) {
      res.status(404).json({ error: 'Registro no encontrado o no autorizado.' });
      return;
    }

    db.prepare('DELETE FROM habit_logs WHERE id = ? AND user_id = ?').run(id, userId);

    res.json({ message: 'Registro de seguimiento eliminado exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar habit_log:', err);
    res.status(500).json({ error: 'Error interno al eliminar el registro.' });
  }
});

export default router;
