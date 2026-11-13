# Roadmap de Desarrollo (PLAN) — Habit Tracker App

## 1. Definición de Alcance: MVP vs. Iteraciones Futuras

### 1.1 MVP (Fase 1) — Ciclo Esencial de Hábito
El objetivo del MVP es entregar en producción un núcleo funcional 100% estable que permita al usuario registrarse, crear hábitos, marcar el cumplimiento diario en tiempo real y ver sus rachas actualizadas con persistencia relacional en MySQL 8.0.

* **Autenticación:** Registro/Login (JWT en cookie `HttpOnly`) y autodetección de zona horaria IANA.
* **CRUD Hábitos:** Crear, editar y eliminar (soft delete) hábitos con metas diarias y días programados.
* **Vista "Hoy":** Filtro de hábitos programados para la fecha local actual con check-in en 1 clic.
* **Motor de Rachas:** Cálculo transaccional de `current_streak` y `best_streak` más porcentaje de progreso diario.

### 1.2 Fases Post-MVP (Iteraciones Futuras)
* **Fase 2 — Retención y Visualización:** Notificaciones programadas (`node-cron` + Web Push/Email), panel de estadísticas avanzadas (gráficos Recharts y mapas de calor anuales), selector de tema visual (`LIGHT`/`DARK`), y catálogo de plantillas predefinidas (Rol `ADMIN`).
* **Fase 3 — Gamificación y Expansión:** Insignias por logros de rachas, diario de notas al completar hábitos, retos comunitarios e integraciones externas.

---

## 2. Estructura de Hitos Secuenciales (Milestones End-to-End)

| Hito | Nombre del Milestone | Alcance Técnico y Entregables (End-to-End) | Criterio de Cierre (Definition of Done) |
| :--- | :--- | :--- | :--- |
| **M1** | **Cimientos, Infraestructura y Esquema BD** | Configuración de Docker Compose (MySQL 8.0), variables `.env`, esquema Prisma relacional (`users`, `roles`, `categories`, `habits`, `habit_logs`, `reminders`, `habit_templates`), migraciones iniciales, cliente Express base con middlewares globales (Helmet, CORS, Zod) y endpoint `/api/health`. | Contenedores levantados, migraciones aplicadas sin errores, y `/api/health` respondiendo `200 OK` verificando conexión a base de datos. |
| **M2** | **Autenticación, Sesiones y Seguridad** | **Backend:** Endpoints `/register`, `/login`, `/logout`, `/me`, hash `bcryptjs`, JWT en cookie HttpOnly y middleware RBAC.<br>**Frontend:** Pantallas `/login` y `/register`, estado global de sesión y protección de rutas privadas. | Registro e inicio de sesión funcional; re-navegación manteniendo sesión activa; rechazo `401` ante peticiones no autenticadas. |
| **M3** | **Gestión de Hábitos (CRUD End-to-End)** | **Backend:** REST API para crear, editar, listar y desactivar hábitos (`is_active = false`) filtrados por `user_id` con validación Zod.<br>**Frontend:** Formulario/modal de creación y edición (nombre, meta, unidad, días programados) y vista de lista. | Usuario crea, edita y desactiva hábitos persistidos en MySQL; pruebas de integración validan aislamiento estricto Anti-IDOR (`403`/`404`). |
| **M4** | **Seguimiento Diario (Check-in) y Rachas** | **Backend:** Lógica transaccional de zonas horarias, endpoint `POST /habits/:id/check-in` con restricción `UNIQUE(habit_id, log_date)` y motor de rachas.<br>**Frontend:** Vista principal `/today` con tarjetas interactivas, actualización optimista y barra de progreso. | Marcar o desmarcar un hábito actualiza la BD y las rachas al instante; pruebas unitarias en Vitest confirman reinicio de medianoche y manejo de días no programados. |
| **M5** | **Recordatorios, Estadísticas y Pulido** | **Backend:** Cron jobs (`node-cron`) para recordatorios, endpoints de métricas y CRUD de plantillas (`ADMIN`).<br>**Frontend:** Panel `/stats` con gráficos Recharts, selector de tema y panel administrativo. | Gráficos reflejan historial real de MySQL, recordatorios se ejecutan puntualmente y la suite completa de pruebas pasa en verde. |

---

## 3. Puertas de Calidad (Validation Gates) y Human-in-the-Loop

### 3.1 Criterios de Aceptación por Hito (Validation Gate)
Antes de fusionar una rama de hito hacia `main`, debe cumplir 4 condiciones obligatorias:
1. **Persistencia e Integridad:** Migraciones de Prisma aplicadas limpiamente sobre MySQL vacía sin fallos de llaves foráneas.
2. **Contrato API:** Estructura JSON estandarizada (`{ success, data, error }`) y rechazo `400 Bad Request` en datos inválidos.
3. **Suite de Pruebas en Verde:** 100% de pruebas unitarias (Vitest) y de integración (Supertest) aprobadas sin advertencias críticas.
4. **Circuit Breaker (Criterio de Parada):** Si la IA intenta reparar una misma falla más de 3 veces consecutivas, se detiene la ejecución, se reporta el diagnóstico y se solicita intervención humana.

### 3.2 Sensores Automatizados vs. Puntos de Control Humano

* **Sensores Automatizados:**
  * Compilación y verificación de tipos: `tsc --noEmit` y `vite build`.
  * Linter y formato: ESLint y Prettier.
  * Pruebas: Vitest (unidades y fake timers) y Supertest (integración API).
  * Smoke test: Petición `GET /api/health`.

* **Puntos de Intervención Humana (Human-in-the-Loop):**
  * **Gate 1 (Fin de M1):** Revisar `schema.prisma` y tablas de MySQL antes de escribir lógica encima.
  * **Gate 2 (Fin de M2):** Probar manualmente login/logout y verificar que ningún JWT esté expuesto en `localStorage`.
  * **Gate 3 (Fin de M4 - MVP):** Prueba funcional en la vista `/today` (crear hábitos, hacer check-in, recargar y verificar persistencia en MySQL).
  * **Gate 4 (Excepciones):** Aprobar la instalación de nuevos paquetes en `package.json` o cambios en archivos de configuración (`docker-compose.yml`, `.env`).

---

## 4. Estrategia de Tareas Atómicas en Backlog

### 4.1 Reglas de Granularidad de Tareas
* **Tamaño acotado:** Máximo 2 a 4 archivos modificados por ticket (menos de 300 líneas de código).
* **Autocontenido:** Un ticket abarca un único objetivo verificable junto con su respectiva prueba unitaria o de integración.
* **Aislamiento:** No mezclar refactorizaciones visuales con cambios estructurales de base de datos en un mismo ticket.

### 4.2 Ejemplo de Descomposición en Micro-Tareas (Módulo M4)
* `T-4.1`: Implementar función pura `calculateStreak()` con soporte de días programados y zonas horarias + pruebas unitarias en Vitest.
* `T-4.2`: Crear endpoint `POST /api/v1/habits/:id/check-in` con esquema Zod y actualización transaccional en `habit_logs` y `habits`.
* `T-4.3`: Crear endpoint `GET /api/v1/habits/today` que filtre hábitos activos para la fecha local del usuario y adjunte su progreso actual.
* `T-4.4`: Construir componente de tarjeta interactiva de hábito en la vista `/today` con actualización optimista y reversión visual en caso de error.

---

## 5. Estrategia de Despliegue en Staging y Ciclo de Feedback

### 5.1 Entorno de Staging en Vivo
* **Subdominio de pruebas:** `staging.tuapp-habitos.com` con SSL automático vía Caddy/Nginx.
* **Orquestación:** `docker-compose.staging.yml` ejecutando los contenedores de `frontend`, `backend` y `db` (MySQL staging con volumen persistente `mysql_staging_data`).

### 5.2 Pipeline de Entrega Continua (CI/CD)
1. **Merge a rama `staging`:** Ejecuta GitHub Actions para correr linters, `tsc` y la suite completa de pruebas (Vitest/Supertest).
2. **Migración segura:** Ejecuta `prisma migrate deploy` en la base de staging sin pérdida de datos históricos.
3. **Seed controlado:** Carga de categorías y hábitos de demostración para pruebas rápidas.
4. **Ciclo de Feedback:** Pruebas con grupo controlado de usuarios (5–10 personas) al finalizar M4 y M5, monitoreando excepciones con Pino y Sentry antes del despliegue a producción en `main`.