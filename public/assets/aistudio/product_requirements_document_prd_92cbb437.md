# Product Requirements Document (PRD) — Habit Tracker App

## 1. Visión General del Producto y Objetivos

### 1.1 Propósito
La aplicación de seguimiento de hábitos busca ayudar a las personas a construir y mantener rutinas saludables mediante un sistema de registro diario de mínima fricción (1 a 2 clics), motor de rachas en tiempo real, persistencia estricta en base de datos relacional y respeto total a la zona horaria del usuario.

### 1.2 Alcance y Propuesta de Valor
- **Núcleo MVP:** Registro/autenticación de usuario, gestión de hábitos personalizados, vista diaria "Hoy" para registro ágil (check-in) y cálculo automático de rachas e indicadores de cumplimiento.
- **Fases Post-MVP:** Recordatorios inteligentes (Web Push / correo), panel visual de estadísticas (gráficos y calendarios de calor), catálogo global de hábitos sugeridos, panel de administración e insignias de gamificación.

---

## 2. Requisitos Funcionales y Funcionalidades Núcleo

### 2.1 Autenticación y Gestión de Usuarios (Auth & Profile)
- **Registro de Cuenta:** Permite crear usuarios mediante correo electrónico, nombre completo y contraseña (almacenada mediante hash seguro bcrypt/Argon2).
- **Inicio de Sesión y Sesión Persistente:** Autenticación mediante tokens JWT seguros en cookies `HttpOnly` / cabeceras.
- **Gestión de Zona Horaria:** Captura implícita de la zona horaria IANA del navegador (ej. `America/Bogota`) al registrarse o iniciar sesión, editable en el perfil.
- **Preferencia de Tema:** Selector de tema visual (`LIGHT` / `DARK`) guardado en la base de datos.
- **Control de Acceso (RBAC):** Roles diferenciados (`USER` por defecto y `ADMIN` para gestión del catálogo de plantillas globales).

### 2.2 Gestión de Hábitos (CRUD de Hábitos)
- **Creación de Hábito Personalizado:**
  - Título (1 a 60 caracteres).
  - Categoría asignada (Hidratación, Ejercicio, Sueño, Alimentación, Mindfulness, etc.).
  - Meta numérica diaria (mínimo 1; ej. 1 vez, 8 vasos, 20 minutos).
  - Días de la semana programados (array `scheduled_days`, ej. `[1, 2, 3, 4, 5, 6, 7]`).
  - Identificador de unidad (`unit_label`, ej. 'vasos', 'minutos', 'páginas').
- **Edición y Pausa de Hábitos:** Permite modificar títulos, metas o días programados.
- **Borrado Lógico (Soft Delete):** Al eliminar un hábito, se marca `is_active = false` y se asigna timestamp `deleted_at`, preservando intactos los registros históricos en `habit_logs`.

### 2.3 Vista Diaria ("Hoy") y Seguimiento de Cumplimiento (Check-in)
- **Filtro Diaria Inteligente:** Carga exclusivamente los hábitos activos programados para el día de la semana actual según la zona horaria local del usuario.
- **Acción Rápida de Check-in:**
  - *Hábitos binarios (meta = 1):* Un solo clic conmuta entre pendiente y completado.
  - *Hábitos acumulativos (meta > 1):* Botones para incrementar/decrementar el valor (`completed_value`), marcándose automáticamente como completado al alcanzar `target_value`.
- **Actualización Optimista:** Reflejo visual instantáneo en el frontend con reverso automático (*rollback*) si la petición al servidor falla.

### 2.4 Motor de Rachas (Streaks) e Indicadores de Progreso
- **Cálculo de Rachas:**
  - `current_streak`: Se incrementa en +1 al completar un hábito en un día programado. Si se omite un día programado sin completar el hábito, la racha se reinicia a 0 en el siguiente ciclo.
  - `best_streak`: Mantiene el máximo histórico alcanzado por el usuario en dicho hábito.
- **Barra de Progreso Diario:** Porcentaje global del día calculado como:
  $$\text{Progreso Diario (\%)} = \left( \frac{\text{Hábitos completados hoy}}{\text{Total hábitos programados para hoy}} \right) \times 100$$

### 2.5 Notificaciones y Estadísticas (Post-MVP)
- **Recordatorios Programados:** Configuración de hora por hábito (`TIME`) ejecutada mediante cron jobs (`node-cron`) y enviada por Web Push API o SMTP.
- **Panel de Estadísticas (/stats):** Visualización de cumplimiento semanal/mensual con Recharts/Chart.js y mapas de calor anuales.
- **Catálogo Sugerido (Templates):** Plantillas de hábitos precargadas creadas por el rol `ADMIN`.

---

## 3. Requisitos No Funcionales y Restricciones de Diseño

### 3.1 Rendimiento y Disponibilidad
- **Tiempo de respuesta:** Las acciones principales de registro diario (marcar hábito o actualizar progreso) deben reflejarse en la interfaz y persistir en la base de datos en menos de 500 ms.
- **Manejo de Zona Horaria:** Todas las fechas y reinicios diarios de hábitos deben calcularse respetando la zona horaria local del usuario para evitar que un hábito se reinicie antes o después de la medianoche local.
- **Persistencia Real:** No se permite simular guardado mediante `localStorage` para usuarios autenticados; toda la información debe almacenarse en la base de datos relacional (MySQL 8.0).

### 3.2 Seguridad y Privacidad
- **Aislamiento Estricto de Datos (Anti-IDOR):** Ningún endpoint de la API debe permitir consultar, editar o eliminar hábitos o registros pertenecientes a otro `user_id`. Validación obligatoria en el backend mediante el token de sesión (`WHERE id = :habitId AND user_id = :authUserId`).
- **Protección de Credenciales:** Contraseñas encriptadas con `bcryptjs` (mínimo 10 rondas). Secretos y llaves albergados exclusivamente en variables de entorno `.env` del servidor.
- **Endurecimiento HTTP:** Cabeceras HTTP seguras con `Helmet`, CORS estricto restringido al dominio del frontend y Rate Limiting (`express-rate-limit`) en rutas sensibles de autenticación.

### 3.3 Diseño UI/UX
- **Diseño Mobile-First y Responsivo:** Funcionamiento sin desbordamientos desde pantallas de 360px de ancho hasta 1440px.
- **Fricción Mínima:** Registrar un avance desde la vista principal ("Hoy") debe requerir máximo 1 o 2 clics/toques.
- **Consistencia Visual:** Paleta de colores unificada, tipografía del sistema y componentes Tailwind CSS sin mezclar múltiples frameworks visuales de terceros.

### 3.4 Exclusiones Funcionales (Fuera de Alcance)
- Diagnóstico médico, prescripción de dietas clínicas o rutinas médicas personalizadas.
- Integración con dispositivos wearables externos (smartwatches / Apple Health / Google Fit) en esta etapa.

---

## 4. Casos de Prueba Críticos, Casos Límite y Validaciones

### 4.1 Flujos Críticos End-to-End (E2E)
1. **Autenticación y Aislamiento de Sesión:** Registrar usuario -> Iniciar sesión -> Recargar página -> Verificar persistencia de sesión y carga exclusiva de sus hábitos. Validar que peticiones sin token devuelvan `401 Unauthorized`.
2. **Creación y Persistencia de Hábitos:** Crear hábito nuevo -> Verificar registro en base de datos con racha en 0 y estado activo -> Confirmar aparición en la vista diaria.
3. **Registro Diario (Check-in):** Incrementar o completar un hábito -> Recargar la aplicación -> Confirmar mantenimiento del estado y porcentaje en base de datos.
4. **Cálculo de Rachas (Streaks):** Completar hábito en días consecutivos -> Verificar incremento de `current_streak` y `best_streak`.

### 4.2 Casos Límite (Edge Cases)
1. **Reinicio de Medianoche (Zona Horaria):** Al pasar las 00:00 en la zona horaria del usuario, los hábitos se muestran en estado "pendiente" para el nuevo día sin borrar el historial del día anterior en `habit_logs`.
2. **Hábitos con Frecuencia Específica:** Hábitos programados solo para días específicos (ej. L-M-V) no deben figurar como pendientes los días no programados (ej. Martes) ni romper la racha por no registrarse en ellos.
3. **Rollback por Desmarcar Hábito:** Desmarcar un hábito completado el mismo día revierte el estado a pendiente, resta el incremento de racha y recalcula el porcentaje diario.
4. **Petitions Concurrentes / Doble Clic:** Múltiples clics rápidos no deben generar registros duplicados en `habit_logs` gracias a la restricción `UNIQUE (habit_id, log_date)`.
5. **Eliminación con Historial Previo:** Desactivar un hábito no rompe la integridad referencial ni altera el panel de estadísticas históricas.

### 4.3 Validaciones de Entrada y Seguridad (API)
- **Inputs Inválidos:** Títulos vacíos, con >60 caracteres o metas $\le 0$ son rechazados con `400 Bad Request` por middleware de Zod.
- **Acceso Cruzado (IDOR):** Usuario A intentando modificar `habit_id` de Usuario B recibe `403 Forbidden` o `404 Not Found`.
- **Permisos por Rol (RBAC):** Usuarios estándar intentando acceder a endpoints de administración reciben `403 Forbidden`.

---

## 5. Perímetro de Protección de Archivos y Componentes

Para mantener la estabilidad del proyecto, queda prohibido alterar sin autorización explícita:
1. **Configuración de Entorno e Infraestructura:** Archivos `.env`, `.env.example`, `docker-compose.yml`, `Dockerfile` y `package.json` / `package-lock.json`.
2. **Esquema Base y Migraciones Históricas:** Archivos en `prisma/migrations` ya consolidados, así como modelos de autenticación (`users`, `roles`).
3. **Núcleo de Seguridad y Middlewares Globales:** Middlewares de JWT/sesión, validación RBAC, CORS, manejo centralizado de errores y conexión a MySQL.
4. **Componentes Base de UI:** Componentes atómicos del sistema de diseño (botones base, inputs, layouts principales).