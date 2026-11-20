# Documento 1: Crear Base de Datos

## 1. Introducción y Stack Tecnológico
El almacenamiento persistente del proyecto **Aplicación de Hábitos Saludables (*Impulso Diario*)** se fundamenta en un modelo de datos relacional normalizado (3NF). El proyecto implementa un soporte dual coherente:

1. **Entorno Principal en Ejecución (Node.js/TypeScript):** 
   - Motor: **SQLite 3** embebido utilizando la biblioteca estándar `node:sqlite` (`DatabaseSync`).
   - Ubicación del archivo físico: `data/habitos.db`.
   - Modos y Pragmas activos:
     - `PRAGMA foreign_keys = ON;` (garantía de integridad referencial estricta).
     - `PRAGMA journal_mode = WAL;` (*Write-Ahead Logging* para alta concurrencia y lecturas sin bloqueo).

2. **Entorno Local / Intranet Alternativo (XAMPP / LAMP):**
   - Motor: **MySQL 8.0+ / MariaDB 10.4+**.
   - Base de datos: `aplicacion_habitos_saludables`.
   - Codificación: `utf8mb4` con colación `utf8mb4_unicode_ci` (soporte completo de caracteres internacionales y emojis).
   - Acceso con principio de mínimo privilegio: Usuario dedicado `habitos_user`.
   - Conector: PDO PHP con sentencias preparadas y emulación de prepares desactivada (`PDO::ATTR_EMULATE_PREPARES => false`).

---

## 2. Diccionario de Datos y Entidades

### 2.1. Entidad `users` (Usuarios y Perfiles)
Almacena la identidad de los usuarios, credenciales seguras, zona horaria y rol de acceso.

| Columna | Tipo SQLite | Tipo MySQL | Modificadores | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `VARCHAR(36)` | `PRIMARY KEY` | Identificador único universal (UUID v4). |
| `email` | `TEXT` | `VARCHAR(255)` | `UNIQUE NOT NULL` | Correo electrónico en minúsculas. En SQLite usa `COLLATE NOCASE`. |
| `password_hash` | `TEXT` | `VARCHAR(255)` | `NOT NULL` | Hash de contraseña con salt (formato `salt:hash` en scrypt o bcrypt `$2y$12$`). |
| `full_name` | `TEXT` | `VARCHAR(150)` | `NOT NULL` | Nombre completo del usuario. |
| `timezone` | `TEXT` | `VARCHAR(64)` | `DEFAULT 'UTC'` | Zona horaria IANA del usuario (ej. `'America/Bogota'`). |
| `theme_preference` | `TEXT` | `ENUM('DARK','LIGHT')` | `DEFAULT 'LIGHT'` | Preferencia de interfaz visual (`CHECK(theme_preference IN ('DARK', 'LIGHT'))`). |
| `role` | `TEXT` | `ENUM('USER','ADMIN')` | `DEFAULT 'USER'` | Rol de acceso (`CHECK(role IN ('USER', 'ADMIN'))`). |
| `created_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de creación del registro. |
| `updated_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de última modificación. |

---

### 2.2. Entidad `categories` (Categorías de Hábitos)
Permite clasificar los hábitos en áreas temáticas (ej. Hidratación, Nutrición, Ejercicio, Mente, Sueño). Admite categorías predeterminadas del sistema y personalizadas por usuario.

| Columna | Tipo SQLite | Tipo MySQL | Modificadores | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `INT` | `PRIMARY KEY AUTOINCREMENT` | Clave primaria incremental. |
| `user_id` | `TEXT` | `VARCHAR(36)` | `NULLABLE`, `FK -> users(id)` | Si es `NULL`, la categoría es global del sistema. Si tiene valor, es personalizada. |
| `name` | `TEXT` | `VARCHAR(100)` | `NOT NULL` | Nombre descriptivo de la categoría. |
| `icon_name` | `TEXT` | `VARCHAR(50)` | `NOT NULL` | Identificador del icono vectorial (ej. `'Droplets'`, `'Dumbbell'`). |
| `color_hex` | `TEXT` | `VARCHAR(10)` | `NOT NULL` | Color de acento hexadecimal (ej. `'#0EA5E9'`). |
| `created_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de creación. |

---

### 2.3. Entidad `habits` (Definición de Hábitos)
Almacena los hábitos configurados por cada usuario con su periodicidad, metas y estado de racha.

| Columna | Tipo SQLite | Tipo MySQL | Modificadores | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `VARCHAR(36)` | `PRIMARY KEY` | Identificador UUID v4. |
| `user_id` | `TEXT` | `VARCHAR(36)` | `NOT NULL`, `FK -> users(id)` | Propietario del hábito. |
| `category_id` | `INTEGER` | `INT` | `NOT NULL`, `FK -> categories(id)` | Categoría a la que pertenece el hábito. |
| `title` | `TEXT` | `VARCHAR(200)` | `NOT NULL` | Título del hábito (ej. `'Tomar 8 vasos de agua'`). |
| `target_value` | `REAL` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 1.0` | Meta cuantitativa diaria. |
| `unit_label` | `TEXT` | `VARCHAR(50)` | `NOT NULL DEFAULT 'veces'` | Unidad de medición (ej. `'vasos'`, `'minutos'`, `'páginas'`). |
| `scheduled_days`| `TEXT` | `JSON` | `NOT NULL DEFAULT '[1,2,3,4,5,6,7]'`| Días programados (1=Lunes .. 7=Domingo). |
| `current_streak`| `INTEGER` | `INT` | `NOT NULL DEFAULT 0` | Racha actual en días consecutivos. |
| `best_streak` | `INTEGER` | `INT` | `NOT NULL DEFAULT 0` | Racha récord alcanzada. |
| `is_active` | `INTEGER` | `TINYINT(1)` | `NOT NULL DEFAULT 1` | `1` = Activo, `0` = Pausado (`CHECK(is_active IN (0, 1))`). |
| `reminder_time` | `TEXT` | `VARCHAR(5)` | `NULLABLE` | Hora de recordatorio diario en formato `'HH:MM'`. |
| `notes` | `TEXT` | `TEXT` | `NULLABLE` | Instrucciones, notas o reflexiones asociadas al hábito. |
| `sort_order` | `INTEGER` | `INT` | `DEFAULT 0` | Posición en la lista personalizada del usuario. |
| `deleted_at` | `TEXT` | `DATETIME` | `NULLABLE` | Timestamp de eliminación lógica (*soft delete*). |
| `created_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de creación. |
| `updated_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de última modificación. |

---

### 2.4. Entidad `habit_logs` (Seguimiento Diario y Diario Contextual)
Registra los avances diarios por hábito, cumplimiento de metas y métricas de bienestar asociadas.

| Columna | Tipo SQLite | Tipo MySQL | Modificadores | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `VARCHAR(36)` | `PRIMARY KEY` | Identificador UUID v4. |
| `habit_id` | `TEXT` | `VARCHAR(36)` | `NOT NULL`, `FK -> habits(id)` | Hábito registrado. |
| `user_id` | `TEXT` | `VARCHAR(36)` | `NOT NULL`, `FK -> users(id)` | Usuario que realizó el registro. |
| `log_date` | `TEXT` | `DATE` | `NOT NULL` | Fecha del seguimiento en formato ISO `'YYYY-MM-DD'`. |
| `completed_value`| `REAL` | `DECIMAL(10,2)`| `NOT NULL DEFAULT 0.0` | Valor cuantitativo alcanzado en el día. |
| `is_completed` | `INTEGER` | `TINYINT(1)` | `NOT NULL DEFAULT 0` | `1` si se cumplió la meta del día, `0` si quedó pendiente. |
| `energy_level` | `INTEGER` | `TINYINT` | `NULLABLE` | Nivel de energía percibido (1 a 5). |
| `mood_tag` | `TEXT` | `VARCHAR(20)` | `NULLABLE` | Etiqueta de ánimo (`'focused' \| 'motivated' \| 'calm' \| 'tired' \| 'stressed'`). |
| `journal_entry` | `TEXT` | `TEXT` | `NULLABLE` | Micro-reflexión o diario contextual sobre la sesión. |
| `created_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de inserción. |
| `updated_at` | `TEXT` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de modificación. |

---

## 3. Relaciones e Integridad Referencial

1. **`users` $\rightarrow$ `categories` (Relación 1 a N):**
   - Clave Foránea: `categories.user_id` referencia a `users.id`.
   - Acción en Borrado: `ON DELETE CASCADE`. Si se purga una cuenta de usuario, se eliminan sus categorías personalizadas. Las categorías globales del sistema (`user_id IS NULL`) permanecen inalteradas.
2. **`users` $\rightarrow$ `habits` (Relación 1 a N):**
   - Clave Foránea: `habits.user_id` referencia a `users.id`.
   - Acción en Borrado: `ON DELETE CASCADE`.
3. **`categories` $\rightarrow$ `habits` (Relación 1 a N):**
   - Clave Foránea: `habits.category_id` referencia a `categories.id`.
   - Acción en Borrado: `ON DELETE RESTRICT`. Impide que una categoría en uso sea eliminada de la base de datos si existen hábitos asociados a ella.
4. **`habits` $\rightarrow$ `habit_logs` (Relación 1 a N):**
   - Clave Foránea: `habit_logs.habit_id` referencia a `habits.id`.
   - Acción en Borrado: `ON DELETE CASCADE`. Si se destruye físicamente un hábito, se eliminan todos sus registros históricos.
5. **`users` $\rightarrow$ `habit_logs` (Relación 1 a N):**
   - Clave Foránea: `habit_logs.user_id` referencia a `users.id`.
   - Acción en Borrado: `ON DELETE CASCADE`.

---

## 4. Restricciones de Integridad y Claves Únicas

* **Unicidad de Usuario:** `UNIQUE (email)` en la tabla `users`. Evita la duplicidad de cuentas por correo.
* **Unicidad Diaria de Hábito:** `UNIQUE (habit_id, log_date)` en `habit_logs`. Es la restricción clave del modelo: asegura que solo exista **un único registro de seguimiento por hábito en un día determinado**, lo que permite realizar operaciones *upsert* idempotentes sin colisiones.
* **Checks de Dominio:**
  * `CHECK (theme_preference IN ('DARK', 'LIGHT'))`
  * `CHECK (role IN ('USER', 'ADMIN'))`
  * `CHECK (is_active IN (0, 1))` y `CHECK (is_completed IN (0, 1))`
  * `CHECK (energy_level BETWEEN 1 AND 5)`
  * `CHECK (mood_tag IN ('focused', 'motivated', 'calm', 'tired', 'stressed'))`

---

## 5. Estrategia de Índices

Para optimizar las consultas de visualización en tiempo real y el procesamiento de rachas históricas, se definen los siguientes índices compuestos y simples:

1. **`idx_users_email` ON `users(email)`**: Permite resolver el proceso de autenticación en $O(1)$.
2. **`idx_categories_user` ON `categories(user_id)`**: Agiliza la consulta de categorías disponibles para el usuario autenticado (`WHERE user_id IS NULL OR user_id = ?`).
3. **`idx_habits_user_active` ON `habits(user_id, is_active)`**: Optimiza la carga principal de la vista "Hoy", filtrando hábitos no eliminados y activos de un usuario.
4. **`idx_habits_category` ON `habits(category_id)`**: Acelera agregaciones y filtros por categoría temática.
5. **`idx_habit_logs_user_date` ON `habit_logs(user_id, log_date)`**: Esencial para renderizar el resumen diario y los calendarios históricos de cumplimiento.
6. **`idx_habit_logs_habit_date` ON `habit_logs(habit_id, log_date)`**: Acelera el cómputo de rachas continuas hacia atrás (*lookback*) para un hábito específico.

---

## 6. Script DDL de Creación (SQLite)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    theme_preference TEXT DEFAULT 'LIGHT' CHECK(theme_preference IN ('DARK', 'LIGHT')),
    role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    name TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    target_value REAL NOT NULL DEFAULT 1.0,
    unit_label TEXT NOT NULL DEFAULT 'veces',
    scheduled_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    reminder_time TEXT,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category_id);

CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT PRIMARY KEY,
    habit_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    log_date TEXT NOT NULL,
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

-- Semilla de categorías iniciales globales
INSERT OR IGNORE INTO categories (id, user_id, name, icon_name, color_hex) VALUES
(1, NULL, 'Hidratación', 'Droplets', '#0EA5E9'),
(2, NULL, 'Ejercicio', 'Dumbbell', '#10B981'),
(3, NULL, 'Mente & Foco', 'Brain', '#8B5CF6'),
(4, NULL, 'Nutrición', 'Apple', '#F59E0B'),
(5, NULL, 'Sueño & Calma', 'Moon', '#6366F1'),
(6, NULL, 'Aprendizaje', 'BookOpen', '#EC4899'),
(7, NULL, 'Productividad', 'CheckSquare', '#14B8A6');
```
