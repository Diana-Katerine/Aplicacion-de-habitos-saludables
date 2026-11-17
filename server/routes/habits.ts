import { Router, type Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Formateador para mapear filas SQL al formato de Habit esperado
function formatHabitRow(row: any) {
  let scheduledDays: number[] = [1, 2, 3, 4, 5, 6, 7];
  try {
    if (typeof row.scheduled_days === 'string') {
      scheduledDays = JSON.parse(row.scheduled_days);
    }
  } catch {
    scheduledDays = [1, 2, 3, 4, 5, 6, 7];
  }

  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_name || null,
    categoryIcon: row.category_icon || null,
    categoryColor: row.category_color || null,
    title: row.title,
    targetValue: Number(row.target_value),
    unitLabel: row.unit_label,
    scheduledDays,
    currentStreak: Number(row.current_streak),
    bestStreak: Number(row.best_streak),
    isActive: Boolean(row.is_active),
    reminderTime: row.reminder_time || null,
    notes: row.notes || null,
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 1. Listar todos los hábitos del usuario autenticado
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { activeOnly } = req.query;

    let sql = `
      SELECT h.*, c.name as category_name, c.icon_name as category_icon, c.color_hex as category_color
      FROM habits h
      LEFT JOIN categories c ON h.category_id = c.id
      WHERE h.user_id = ? AND h.deleted_at IS NULL
    `;

    if (activeOnly === 'true' || activeOnly === '1') {
      sql += ' AND h.is_active = 1';
    }

    sql += ' ORDER BY h.sort_order ASC, h.created_at DESC';

    const rows = db.prepare(sql).all(userId);
    const habits = rows.map(formatHabitRow);

    res.json({ habits });
  } catch (err) {
    console.error('Error al obtener hábitos:', err);
    res.status(500).json({ error: 'Error interno al consultar los hábitos.' });
  }
});

// 2. Obtener un hábito específico por ID (respetando pertenencia)
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const row = db.prepare(`
      SELECT h.*, c.name as category_name, c.icon_name as category_icon, c.color_hex as category_color
      FROM habits h
      LEFT JOIN categories c ON h.category_id = c.id
      WHERE h.id = ? AND h.user_id = ? AND h.deleted_at IS NULL
    `).get(id, userId);

    if (!row) {
      res.status(404).json({ error: 'Hábito no encontrado o no autorizado.' });
      return;
    }

    res.json({ habit: formatHabitRow(row) });
  } catch (err) {
    console.error('Error al consultar hábito por id:', err);
    res.status(500).json({ error: 'Error interno al consultar el hábito.' });
  }
});

// 3. Crear un nuevo hábito
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const {
      title,
      categoryId,
      targetValue = 1,
      unitLabel = 'veces',
      scheduledDays = [1, 2, 3, 4, 5, 6, 7],
      reminderTime,
      notes,
    } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'El título del hábito es obligatorio.' });
      return;
    }

    if (!categoryId || isNaN(Number(categoryId))) {
      res.status(400).json({ error: 'Debes asociar una categoría válida al hábito.' });
      return;
    }

    // Verificar que la categoría exista y sea accesible
    const categoryExists = db.prepare(`
      SELECT id FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)
    `).get(Number(categoryId), userId);

    if (!categoryExists) {
      res.status(400).json({ error: 'La categoría indicada no existe o no tienes acceso a ella.' });
      return;
    }

    const habitId = crypto.randomUUID();
    const cleanTitle = title.trim();
    const cleanTarget = Number(targetValue) > 0 ? Number(targetValue) : 1;
    const cleanUnit = typeof unitLabel === 'string' && unitLabel.trim() ? unitLabel.trim() : 'veces';
    const cleanDays = Array.isArray(scheduledDays) && scheduledDays.length > 0
      ? JSON.stringify(scheduledDays)
      : '[1,2,3,4,5,6,7]';
    const cleanReminder = typeof reminderTime === 'string' && reminderTime.trim() ? reminderTime.trim() : null;
    const cleanNotes = typeof notes === 'string' ? notes.trim() : null;

    const stmt = db.prepare(`
      INSERT INTO habits (
        id, user_id, category_id, title, target_value, unit_label,
        scheduled_days, is_active, reminder_time, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(habitId, userId, Number(categoryId), cleanTitle, cleanTarget, cleanUnit, cleanDays, cleanReminder, cleanNotes);

    const created = db.prepare(`
      SELECT h.*, c.name as category_name, c.icon_name as category_icon, c.color_hex as category_color
      FROM habits h
      LEFT JOIN categories c ON h.category_id = c.id
      WHERE h.id = ?
    `).get(habitId);

    res.status(201).json({
      message: 'Hábito creado correctamente.',
      habit: formatHabitRow(created),
    });
  } catch (err) {
    console.error('Error al crear hábito:', err);
    res.status(500).json({ error: 'Error interno del servidor al crear el hábito.' });
  }
});

// 4. Actualizar un hábito existente
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    // Verificar pertenencia
    const current = db.prepare(`
      SELECT * FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `).get(id, userId) as any;

    if (!current) {
      res.status(404).json({ error: 'Hábito no encontrado o no tienes permiso para modificarlo.' });
      return;
    }

    const {
      title,
      categoryId,
      targetValue,
      unitLabel,
      scheduledDays,
      isActive,
      reminderTime,
      notes,
      sortOrder,
    } = req.body || {};

    const updatedTitle = typeof title === 'string' && title.trim() ? title.trim() : current.title;
    let updatedCategory = current.category_id;
    if (categoryId !== undefined && !isNaN(Number(categoryId))) {
      const catCheck = db.prepare(`
        SELECT id FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?)
      `).get(Number(categoryId), userId);
      if (!catCheck) {
        res.status(400).json({ error: 'Categoría inválida o no accesible.' });
        return;
      }
      updatedCategory = Number(categoryId);
    }

    const updatedTarget = targetValue !== undefined && Number(targetValue) > 0 ? Number(targetValue) : current.target_value;
    const updatedUnit = typeof unitLabel === 'string' ? unitLabel.trim() : current.unit_label;
    const updatedDays = Array.isArray(scheduledDays) ? JSON.stringify(scheduledDays) : current.scheduled_days;
    const updatedActive = isActive !== undefined ? (isActive ? 1 : 0) : current.is_active;
    const updatedReminder = reminderTime !== undefined ? (reminderTime ? String(reminderTime).trim() : null) : current.reminder_time;
    const updatedNotes = notes !== undefined ? (notes ? String(notes).trim() : null) : current.notes;
    const updatedSort = sortOrder !== undefined && !isNaN(Number(sortOrder)) ? Number(sortOrder) : current.sort_order;

    const updateStmt = db.prepare(`
      UPDATE habits
      SET title = ?, category_id = ?, target_value = ?, unit_label = ?, scheduled_days = ?,
          is_active = ?, reminder_time = ?, notes = ?, sort_order = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);

    updateStmt.run(
      updatedTitle,
      updatedCategory,
      updatedTarget,
      updatedUnit,
      updatedDays,
      updatedActive,
      updatedReminder,
      updatedNotes,
      updatedSort,
      id,
      userId
    );

    const updated = db.prepare(`
      SELECT h.*, c.name as category_name, c.icon_name as category_icon, c.color_hex as category_color
      FROM habits h
      LEFT JOIN categories c ON h.category_id = c.id
      WHERE h.id = ?
    `).get(id);

    res.json({
      message: 'Hábito actualizado exitosamente.',
      habit: formatHabitRow(updated),
    });
  } catch (err) {
    console.error('Error al actualizar hábito:', err);
    res.status(500).json({ error: 'Error interno al actualizar el hábito.' });
  }
});

// 5. Eliminar un hábito (eliminación lógica / soft delete)
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const habit = db.prepare(`
      SELECT id FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `).get(id, userId);

    if (!habit) {
      res.status(404).json({ error: 'Hábito no encontrado o ya eliminado.' });
      return;
    }

    db.prepare(`
      UPDATE habits
      SET deleted_at = datetime('now'), is_active = 0, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(id, userId);

    res.json({ message: 'Hábito eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar hábito:', err);
    res.status(500).json({ error: 'Error interno al eliminar el hábito.' });
  }
});

export default router;
