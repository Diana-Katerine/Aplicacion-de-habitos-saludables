# Technical Requirements Document (TRD) — Habit Tracker App

## 1. Arquitectura de Sistema y Stack Tecnológico

### 1.1 Stack de Tecnologías

* **Frontend:** React 18+ (Vite), TypeScript, Tailwind CSS, Lucide Icons, React Hook Form, Zod, TanStack Query (React Query), Recharts (para estadísticas).
* **Backend:** Node.js (v20 LTS), Express.js, TypeScript, Prisma ORM, Zod, Pino (Logs estructurados JSON), `bcryptjs`, `jsonwebtoken`.
* **Base de Datos:** MySQL 8.0 (con soporte UTF8MB4 y motor InnoDB para transacciones ACID).
* **Testing:** Vitest (Pruebas unitarias y mock timers), Supertest (Pruebas de integración de API).
* **Tareas en Segundo Plano:** `node-cron` (Reinicio de rachas y despacho de recordatorios).
* **Observabilidad & Monitoreo:** Sentry (Captura de errores), Endpoint `/api/health`, Logs con Pino.
* **Infraestructura & Contenedores:** Docker Compose (Servicios: `frontend`, `backend`, `db`), Nginx/Caddy como Proxy Inverso con SSL automático (Let's Encrypt).

### 1.2 Diagrama Arquitectónico

```
[ Cliente React / Browser ]
           │
           │ (HTTPS / WebSockets / REST API - Cookies HttpOnly)
           ▼
 [ Proxy Inverso Caddy / Nginx ] ── (Puertos 80/443 SSL)
           │
           ├──────────────────────────────┐
           ▼                              ▼
 [ Contenedor Backend Express ] [ Contenedor Frontend Nginx ]
   ├── API Controllers & Zod      └── Assets Estáticos (Vite Build)
   ├── JWT Auth & RBAC Middleware
   ├── Worker node-cron (Background)
   └── Prisma ORM Client
           │
           ▼ (Red Interna Docker - Puerto 3306 aislado)
 [ Contenedor MySQL 8.0 (mysql_data) ]
```

---

## 2. Modelo de Datos y Esquema de Base de Datos (Prisma Schema)

### 2.1 Esquema Relacional (`schema.prisma`)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RoleName {
  USER
  ADMIN
}

enum ThemePreference {
  LIGHT
  DARK
}

model Role {
  id        Int      @id @default(autoincrement())
  name      RoleName @unique
  users     User[]
  createdAt DateTime @default(now()) @map("created_at")

  @@map("roles")
}

model User {
  id              String          @id @default(uuid())
  email           String          @unique
  passwordHash    String          @map("password_hash")
  fullName        String          @map("full_name")
  timezone        String          @default("UTC")
  themePreference ThemePreference @default(LIGHT) @map("theme_preference")
  roleId          Int             @map("role_id")
  role            Role            @relation(fields: [roleId], references: [id])
  habits          Habit[]
  habitLogs       HabitLog[]
  reminders       Reminder[]
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  @@map("users")
}

model Category {
  id             Int             @id @default(autoincrement())
  name           String          @unique
  iconName       String          @map("icon_name")
  colorHex       String          @map("color_hex")
  habits         Habit[]
  habitTemplates HabitTemplate[]
  createdAt      DateTime        @default(now()) @map("created_at")

  @@map("categories")
}

model Habit {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId    Int         @map("category_id")
  category      Category    @relation(fields: [categoryId], references: [id])
  title         String      @db.VarChar(60)
  targetValue   Int         @default(1) @map("target_value")
  unitLabel     String      @default("vez") @map("unit_label") @db.VarChar(20)
  scheduledDays Json        @map("scheduled_days") // Array JSON [1,2,3,4,5,6,7]
  currentStreak Int         @default(0) @map("current_streak")
  bestStreak    Int         @default(0) @map("best_streak")
  isActive      Boolean     @default(true) @map("is_active")
  deletedAt     DateTime?   @map("deleted_at")
  logs          HabitLog[]
  reminders     Reminder[]
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  @@index([userId, isActive])
  @@map("habits")
}

model HabitLog {
  id             String   @id @default(uuid())
  habitId        String   @map("habit_id")
  habit          Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  userId         String   @map("user_id")
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  logDate        DateTime @map("log_date") @db.Date // Formato YYYY-MM-DD
  completedValue Int      @default(0) @map("completed_value")
  isCompleted    Boolean  @default(false) @map("is_completed")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([habitId, logDate], name: "unique_habit_log_per_date")
  @@index([userId, logDate])
  @@map("habit_logs")
}

model Reminder {
  id            String   @id @default(uuid())
  habitId       String   @map("habit_id")
  habit         Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  userId        String   @map("user_id")
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminderTime  String   @map("reminder_time") @db.VarChar(5) // HH:mm en formato 24h
  isEnabled     Boolean  @default(true) @map("is_enabled")
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("reminders")
}

model HabitTemplate {
  id          String   @id @default(uuid())
  categoryId  Int      @map("category_id")
  category    Category @relation(fields: [categoryId], references: [id])
  title       String   @db.VarChar(60)
  targetValue Int      @default(1) @map("target_value")
  unitLabel   String   @default("vez") @map("unit_label")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("habit_templates")
}
```

---

## 3. Especificación de la API REST y Contratos JSON

### 3.1 Estructura Estándar de Respuesta JSON

Para garantizar consistencia técnica y cero alucinaciones de formato por endpoint:

**Éxito (HTTP 200 / 201):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

**Error (HTTP 400 / 401 / 403 / 404 / 500):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos.",
    "details": [
      {
        "field": "title",
        "issue": "El título debe contener entre 1 y 60 caracteres."
      }
    ]
  }
}
```

### 3.2 Principales Endpoints REST

| Método | Endpoint | Descripción | Auth / Rol |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Registro de nuevo usuario + Detección de timezone | Público |
| `POST` | `/api/v1/auth/login` | Login y emisión de cookie HttpOnly con JWT | Público |
| `POST` | `/api/v1/auth/logout` | Invasión de token y limpieza de cookie | Requiere Auth |
| `GET` | `/api/v1/auth/me` | Retorna perfil del usuario autenticado | Requiere Auth |
| `GET` | `/api/v1/habits/today` | Hábitos activos programados para la fecha local actual | Requiere Auth |
| `POST` | `/api/v1/habits` | Crear hábito personalizado (Validado con Zod) | Requiere Auth |
| `PUT` | `/api/v1/habits/:id` | Editar título, días programados o meta de hábito | Requiere Auth (`user_id`) |
| `DELETE`| `/api/v1/habits/:id` | Borrado lógico de hábito (`is_active = false`) | Requiere Auth (`user_id`) |
| `POST` | `/api/v1/habits/:id/check-in` | Registrar o actualizar progreso diario de un hábito | Requiere Auth (`user_id`) |
| `GET` | `/api/v1/stats/summary` | Métricas semanales/mensuales y porcentaje diario | Requiere Auth |
| `GET` | `/api/v1/admin/templates` | Gestionar plantillas globales de hábitos | Requiere Auth (`ADMIN`) |

---

## 4. Estrategia de Testing y Cobertura de Calidad

### 4.1 Pirámide Práctica de Pruebas

1. **Pruebas Unitarias (Vitest):**
   * Lógica del cálculo transaccional de rachas (`current_streak`, `best_streak`).
   * Manejo de zonas horarias con `vi.useFakeTimers()` para validar cortes de medianoche en diferentes husos horarios.
   * Filtros de días programados (`scheduled_days`).

2. **Pruebas de Integración API (Supertest + MySQL `habit_tracker_test`):**
   * Verificación de persistencia real de flujos CRUD y registros `habit_logs`.
   * Verificación de unicidad por fecha en registros diarios (`UNIQUE(habit_id, log_date)`).
   * Validación de aislamiento estricto Anti-IDOR (Asegurando respuestas `401`, `403` o `404` ante intentos de acceso no autorizado).

3. **Aislamiento mediante Mocks:**
   * Servicio de correo (Nodemailer) y alertas push mockeados en suite de pruebas.

---

## 5. Entorno de Despliegue, DevOps y Observabilidad

### 5.1 Docker Compose en Producción (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: habit_mysql_prod
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: habit_tracker_db
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_prod_data:/var/lib/mysql
    networks:
      - habit_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: habit_backend_prod
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: mysql://${DB_USER}:${DB_PASSWORD}@db:3306/habit_tracker_db
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 4000
    networks:
      - habit_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: habit_frontend_prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - habit_network

volumes:
  mysql_prod_data:

networks:
  habit_network:
    driver: bridge
```

### 5.2 Observabilidad & Telemetría

* **Logs Estructurados (Pino):** Salida en JSON con marcas de tiempo, `requestId` y nivel de severidad (`info`, `warn`, `error`). Filtrado estricto de contraseñas y tokens.
* **Endpoint de Salud (`/api/health`):** Comprueba en tiempo real:
  1. Estado del proceso Node.js.
  2. Conexión activa a MySQL (`SELECT 1`).
  3. Ejecución del ciclo de cron jobs.
* **Sentry Integration:** Integración en middleware global de Express y React Error Boundaries para captura instantánea de excepciones en producción.