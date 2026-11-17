import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index';
import { hashPassword, verifyPassword, generateToken } from '../auth/security';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Registro de nuevos usuarios
router.post('/register', (req: Request, res: Response): void => {
  try {
    const { email, password, fullName, timezone, themePreference } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Debes proporcionar un correo electrónico válido.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      res.status(400).json({ error: 'Debes proporcionar tu nombre completo.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Comprobar existencia
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'El correo electrónico ya se encuentra registrado.' });
      return;
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const tz = typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'UTC';
    const theme = themePreference === 'LIGHT' ? 'LIGHT' : 'DARK';

    const insertStmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, timezone, theme_preference, role)
      VALUES (?, ?, ?, ?, ?, ?, 'USER')
    `);
    insertStmt.run(userId, cleanEmail, passwordHash, fullName.trim(), tz, theme);

    const token = generateToken({ id: userId, email: cleanEmail, role: 'USER' });

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        fullName: fullName.trim(),
        timezone: tz,
        themePreference: theme,
        role: 'USER',
      },
    });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno del servidor al procesar el registro.' });
  }
});

// Inicio de sesión
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({ error: 'Debes indicar correo y contraseña.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as
      | {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          timezone: string;
          theme_preference: string;
          role: string;
        }
      | undefined;

    if (!userRow || !verifyPassword(String(password), userRow.password_hash)) {
      res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
      return;
    }

    const token = generateToken({ id: userRow.id, email: userRow.email, role: userRow.role });

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: userRow.id,
        email: userRow.email,
        fullName: userRow.full_name,
        timezone: userRow.timezone,
        themePreference: userRow.theme_preference,
        role: userRow.role,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
});

// Perfil del usuario autenticado
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.sub;
    const userRow = db
      .prepare('SELECT id, email, full_name, timezone, theme_preference, role, created_at FROM users WHERE id = ?')
      .get(userId) as any;

    if (!userRow) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    res.json({
      user: {
        id: userRow.id,
        email: userRow.email,
        fullName: userRow.full_name,
        timezone: userRow.timezone,
        themePreference: userRow.theme_preference,
        role: userRow.role,
        createdAt: userRow.created_at,
      },
    });
  } catch (err) {
    console.error('Error en get /me:', err);
    res.status(500).json({ error: 'Error al obtener la información de perfil.' });
  }
});

export default router;
