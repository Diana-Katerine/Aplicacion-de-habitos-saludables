# Documentación Técnica — Sprint 2: Desarrollo del Backend y Base de Datos
**Proyecto:** Aplicación de Hábitos Saludables (*Impulso Diario*)  
**Versión:** 1.0.0  
**Fecha de Cierre:** Noviembre 2026  
**Estado:** Completo y Verificado al 100% (27/27 pruebas funcionales pasadas)

---

## 1. Visión General del Sprint 2
El **Sprint 2 (Semana 2)** tuvo como objetivo construir la capa lógica del backend, el diseño y persistencia de base de datos relacional, la seguridad con autenticación y autorización (RBAC), el desarrollo de operaciones CRUD exhaustivas y la documentación interactiva de la API REST.

---

## 2. Dónde Consultar la Documentación en el Proyecto

### 2.1. Documentación Interactiva en Vivo (Swagger UI)
El servidor expone una interfaz gráfica completa para explorar, probar y ejecutar peticiones directamente desde el navegador:
* **URL en el navegador:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
* **Archivo de especificación OpenAPI 3.0 (YAML):** [server/docs/openapi.yaml](file:///c:/Users/KATHE/Desktop/Habitos%20saludables/Aplicacion-de-habitos-saludables/server/docs/openapi.yaml)
* **Descarga directa en crudo vía API:** [http://localhost:3000/api/docs/openapi.yaml](http://localhost:3000/api/docs/openapi.yaml)

---

## 3. Arquitectura del Backend

```
Aplicacion-de-habitos-saludables/
├── server.ts                       # Servidor principal Express + Vite SSR + montaje de rutas
├── server/
│   ├── auth/
│   │   └── security.ts             # Hashing scrypt, timingSafeEqual y JWT HMAC-SHA256
│   ├── db/
│   │   ├── index.ts                # Conexión nativa SQLite (WAL mode, foreign keys ON)
│   │   └── migrations.sql          # Esquema DDL relacional (tablas, índices, checks)
│   ├── docs/
│   │   └── openapi.yaml            # Especificación completa OpenAPI 3.0.3
│   ├── middleware/
│   │   └── auth.ts                 # Middlewares 'authenticate' (Bearer) y 'requireRole' (RBAC)
│   ├── routes/
│   │   ├── admin.ts                # Rutas administrativas protegidas (RBAC: ADMIN)
│   │   ├── auth.ts                 # /register, /login, /me
│   │   ├── categories.ts           # CRUD de categorías maestras y personalizadas
│   │   ├── habits.ts               # CRUD completo de hábitos (crear, listar, editar, soft delete)
│   │   └── logs.ts                 # Upsert y consulta histórica de seguimiento diario
│   └── test-api.mjs                # Suite automatizada de pruebas end-to-end (27 tests)
├── database/
│   └── mysql_schema.sql            # Script DDL equivalente para MySQL/MariaDB (XAMPP)
└── backend-php/
    ├── src/Database.php            # Conexión PDO segura con variables de entorno
    └── test_connection.php         # Script de verificación y auditoría en XAMPP
```

---

## 4. Esquema de Base de Datos Relacional

Se implementaron dos variantes del modelo relacional con total paridad de entidades:
1. **SQLite (`data/habitos.db`):** Motor activo integrado en la aplicación Node.js/TypeScript.
2. **MySQL / MariaDB (`aplicacion_habitos_saludables`):** Diseñado para despliegues locales con entorno XAMPP y usuario de mínimo privilegio `habitos_user`.

### Tablas y Relaciones
* **`users`:** Clave primaria UUID (`id`), correo único (`email`), `password_hash`, `full_name`, `timezone`, `theme_preference` y `role` (`'USER' | 'ADMIN'`).
* **`categories`:** Categorías globales predefinidas (`user_id = NULL`) y personalizadas con clave foránea a `users.id` con eliminación en cascada (`ON DELETE CASCADE`).
* **`habits`:** Clave foránea `user_id` (`ON DELETE CASCADE`) y `category_id` (`ON DELETE RESTRICT`). Periodicidad en formato array JSON `scheduled_days`, metas y soft delete mediante columna `deleted_at`.
* **`habit_logs`:** Registro diario con restricción única compuesta `UNIQUE(habit_id, log_date)`, valores completados, flags booleanas, niveles de energía (1-5) y estados de ánimo validados mediante constraints `CHECK`.

---

## 5. Catálogo de Endpoints RESTful Implementados

| Módulo | Método | Endpoint | Autenticación | Rol | Descripción |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **Auth** | `POST` | `/api/auth/register` | Pública | Cualquiera | Registro con hash scrypt/bcrypt y emisión de JWT |
| **Auth** | `POST` | `/api/auth/login` | Pública | Cualquiera | Inicio de sesión y verificación de credenciales |
| **Auth** | `GET` | `/api/auth/me` | Bearer Token | `USER` / `ADMIN` | Obtiene el perfil autenticado |
| **Categorías** | `GET` | `/api/categories` | Bearer Token | `USER` / `ADMIN` | Lista categorías globales y del usuario |
| **Categorías** | `POST` | `/api/categories` | Bearer Token | `USER` / `ADMIN` | Crea categoría personalizada para el usuario |
| **Hábitos** | `GET` | `/api/habits` | Bearer Token | `USER` / `ADMIN` | Lista hábitos del usuario con filtro `activeOnly` |
| **Hábitos** | `GET` | `/api/habits/:id` | Bearer Token | `USER` / `ADMIN` | Detalle de hábito verificando pertenencia |
| **Hábitos** | `POST` | `/api/habits` | Bearer Token | `USER` / `ADMIN` | Crea un nuevo hábito |
| **Hábitos** | `PUT` | `/api/habits/:id` | Bearer Token | `USER` / `ADMIN` | Actualiza título, meta, días o estado |
| **Hábitos** | `DELETE` | `/api/habits/:id` | Bearer Token | `USER` / `ADMIN` | Eliminación lógica (*soft delete*) |
| **Seguimiento** | `GET` | `/api/logs` | Bearer Token | `USER` / `ADMIN` | Consulta logs por fecha, rango o hábito |
| **Seguimiento** | `POST` | `/api/logs` | Bearer Token | `USER` / `ADMIN` | Upsert diario de progreso y check-in |
| **Seguimiento** | `DELETE` | `/api/logs/:id` | Bearer Token | `USER` / `ADMIN` | Elimina un registro de seguimiento |
| **Admin (RBAC)** | `GET` | `/api/admin/metrics` | Bearer Token | **`ADMIN`** | Estadísticas globales de usuarios y hábitos |
| **Admin (RBAC)** | `GET` | `/api/admin/users` | Bearer Token | **`ADMIN`** | Listado general de usuarios |
| **Admin (RBAC)** | `POST` | `/api/admin/categories`| Bearer Token | **`ADMIN`** | Crea categoría global del sistema (`userId=null`) |
| **Asistente IA**| `POST` | `/api/coach/forecast` | Pública/Interna | Cualquiera | Cálculo predictivo semanal con Gemini |
| **Asistente IA**| `POST` | `/api/coach/encouragement` | Pública/Interna | Cualquiera | Mensajes motivacionales contextualizados |
| **Asistente IA**| `POST` | `/api/coach/habit-suggestions` | Pública/Interna | Cualquiera | Recomendación de hábitos por categorías |
| **Docs** | `GET` | `/api/docs` | Pública | Cualquiera | **Visor interactivo Swagger UI** |
| **Docs** | `GET` | `/api/docs/openapi.yaml` | Pública | Cualquiera | Archivo YAML formal OpenAPI 3.0 |

---

## 6. Seguridad y Autorización (RBAC)

1. **Hashing de Contraseñas:** 
   - Node.js: Algoritmo `scrypt` con salt aleatorio de 16 bytes y comparación de hashes en tiempo constante (`crypto.timingSafeEqual`) contra ataques de temporización.
   - PHP: Función nativa `password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12])`.
2. **Tokens JWT (HMAC-SHA256):** 
   - Expiración a 24 horas (`exp`). Payload: `{ sub, email, role, iat, exp }`.
3. **Middleware de Roles (`requireRole`):**
   - Responde `401 Unauthorized` si no hay sesión.
   - Responde `403 Forbidden` si el rol no coincide con los autorizados (por ejemplo, si un usuario regular intenta consultar `/api/admin/*`).

---

## 7. Ejecución de la Suite de Pruebas Automatizadas

Para validar todos los requisitos del Sprint 2:
```powershell
npm.cmd test
```
**Resultado:** 27 pruebas automatizadas ejecutadas y superadas al 100% contra el servidor en ejecución.
