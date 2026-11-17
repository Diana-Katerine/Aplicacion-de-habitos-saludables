-- Migración inicial: Creación de tablas e índices para Sprint 2
-- Motor: SQLite (compatible con node:sqlite / SQLite3 estándar)

PRAGMA foreign_keys = ON;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    theme_preference TEXT DEFAULT 'DARK' CHECK(theme_preference IN ('DARK', 'LIGHT')),
    role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabla de Categorías (con soporte para categorías predeterminadas y personalizadas por usuario)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT, -- NULL para categorías globales del sistema
    name TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- Tabla de Hábitos
CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    target_value REAL NOT NULL DEFAULT 1.0,
    unit_label TEXT NOT NULL DEFAULT 'veces',
    scheduled_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]', -- JSON Array de DayOfWeek (1-7)
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    reminder_time TEXT, -- 'HH:MM'
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category_id);

-- Tabla de Registros Diarios de Seguimiento (Habit Logs)
CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    log_date TEXT NOT NULL, -- Formato 'YYYY-MM-DD'
    completed_value REAL NOT NULL DEFAULT 0.0,
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
    energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5),
    mood_tag TEXT CHECK(mood_tag IN ('focused', 'motivated', 'calm', 'tired', 'stressed')),
    journal_entry TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habit_id, log_date),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);

-- Categorías iniciales por defecto del sistema
INSERT OR IGNORE INTO categories (id, user_id, name, icon_name, color_hex) VALUES
(1, NULL, 'Salud y Fitness', 'Activity', '#10B981'),
(2, NULL, 'Nutrición', 'Apple', '#F59E0B'),
(3, NULL, 'Bienestar Mental', 'Brain', '#8B5CF6'),
(4, NULL, 'Productividad', 'Zap', '#3B82F6'),
(5, NULL, 'Sueño y Descanso', 'Moon', '#6366F1');
