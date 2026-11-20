-- ==============================================================================
-- Script de Creación y Sincronización para XAMPP / MariaDB / MySQL
-- Base de Datos: aplicacion_habitos_saludables
-- Proyecto: Aplicación de Hábitos Saludables
-- ==============================================================================

-- 1. Creación de la Base de Datos con codificación utf8mb4 moderna y collation bilingüe
CREATE DATABASE IF NOT EXISTS aplicacion_habitos_saludables
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Creación de Usuario Dedicado con Principio de Menor Privilegio
-- Usuario: habitos_user | Host: localhost (o '%' según necesidad local)
CREATE USER IF NOT EXISTS 'habitos_user'@'localhost' IDENTIFIED BY 'Habitos_Sec2026!Pass';
CREATE USER IF NOT EXISTS 'habitos_user'@'127.0.0.1' IDENTIFIED BY 'Habitos_Sec2026!Pass';

-- Asignar privilegios estrictos CRUD y DDL sobre la base de datos específica
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER, LOCK TABLES 
ON aplicacion_habitos_saludables.* TO 'habitos_user'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER, LOCK TABLES 
ON aplicacion_habitos_saludables.* TO 'habitos_user'@'127.0.0.1';

FLUSH PRIVILEGES;

-- 3. Seleccionar la base de datos
USE aplicacion_habitos_saludables;

-- 4. Creación de Tablas con Claves Primarias, Foráneas e Índices

-- -----------------------------------------------------------------------------
-- Tabla: users
-- Almacena credenciales seguras (hash bcrypt/argon2), perfil, zona horaria y tema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    timezone VARCHAR(64) DEFAULT 'UTC',
    theme_preference ENUM('DARK', 'LIGHT') DEFAULT 'LIGHT',
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: categories
-- Categorías predeterminadas (user_id NULL) y personalizadas por usuario
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_categories_user (user_id),
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: habits
-- Hábitos de estudio, salud y bienestar con metas, frecuencia y estado
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_label VARCHAR(50) NOT NULL DEFAULT 'veces',
    scheduled_days JSON NOT NULL, -- Ej: [1,2,3,4,5,6,7]
    current_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    reminder_time VARCHAR(5) DEFAULT NULL, -- 'HH:MM'
    notes TEXT DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_habits_user_active (user_id, is_active),
    KEY idx_habits_category (category_id),
    KEY idx_habits_deleted (deleted_at),
    CONSTRAINT fk_habits_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_habits_category FOREIGN KEY (category_id) 
        REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Tabla: habit_logs
-- Registro diario de ejecución, cumplimiento, estado anímico y notas reflexivas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habit_logs (
    id VARCHAR(36) NOT NULL,
    habit_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    log_date DATE NOT NULL,
    completed_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_completed TINYINT(1) NOT NULL DEFAULT 0,
    energy_level TINYINT DEFAULT NULL, -- Nivel 1 a 5
    mood_tag ENUM('focused', 'motivated', 'calm', 'tired', 'stressed') DEFAULT NULL,
    journal_entry TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_habit_logs_habit_date (habit_id, log_date),
    KEY idx_habit_logs_user_date (user_id, log_date),
    KEY idx_habit_logs_habit_date (habit_id, log_date),
    CONSTRAINT fk_habit_logs_habit FOREIGN KEY (habit_id) 
        REFERENCES habits (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_habit_logs_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Carga de Semillas Iniciales (Categorías por defecto del sistema)
-- -----------------------------------------------------------------------------
INSERT INTO categories (id, user_id, name, icon_name, color_hex) VALUES
(1, NULL, 'Salud y Fitness', 'Activity', '#10B981'),
(2, NULL, 'Nutrición', 'Apple', '#F59E0B'),
(3, NULL, 'Bienestar Mental', 'Brain', '#8B5CF6'),
(4, NULL, 'Productividad y Estudio', 'Zap', '#3B82F6'),
(5, NULL, 'Sueño y Descanso', 'Moon', '#6366F1')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    icon_name = VALUES(icon_name),
    color_hex = VALUES(color_hex);
