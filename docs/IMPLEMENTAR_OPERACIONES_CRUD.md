# Implementar Operaciones CRUD

## 1. Introducción y Convenciones de Dominio
Este documento describe las operaciones de Creación, Lectura, Actualización y Eliminación (CRUD) para los recursos centrales del sistema:
* **Recurso `habits` (Hábitos):** CRUD completo con borrado lógico.
* **Recurso `habit_logs` (Seguimiento Diario):** CRUD con lógica de *Upsert* diario idempotente y cálculo de metas.
* **Recurso `categories` (Categorías):** Consulta y creación con separación de alcance global/usuario.

Todas las operaciones validan los datos entrantes en el controlador antes de interactuar con la base de datos, garantizando respuestas informativas ante entradas inválidas.

---

## 2. Recurso: Hábitos (`/api/habits`)

### 2.1. CREATE (Crear Hábito)
* **Método y Ruta:** `POST /api/habits`
* **Autenticación requerida:** Sí (`Bearer Token`).
* **Reglas de Negocio y Validaciones:**
  * `title`: Obligatorio. Debe ser una cadena no vacía (`trim().length > 0`). Máximo 200 caracteres.
  * `categoryId`: Obligatorio. Debe ser un entero numérico válido. Debe existir en la tabla `categories` y ser una categoría global (`user_id IS NULL`) o pertenecer al usuario autenticado (`user_id = req.user.sub`).
  * `targetValue`: Opcional. Si se provee, debe ser un número estrictamente mayor a 0. Por defecto toma `1.0`.
  * `unitLabel`: Opcional. Cadena de texto limpia (ej. `'vasos'`, `'minutos'`). Por defecto `'veces'`.
  * `scheduledDays`: Opcional. Arreglo de números enteros entre 1 y 7 sin duplicados. Por defecto `[1, 2, 3, 4, 5, 6, 7]`.
  * `reminderTime`: Opcional. Formato de hora `'HH:MM'` (24 horas).
  * `notes`: Opcional. Texto libre.
* **Comportamiento ante Datos Inválidos:**
  * Si falta el título: `400 Bad Request` $\rightarrow$ `{"error": "El título del hábito es obligatorio."}`.
  * Si falta la categoría o es inválida: `400 Bad Request` $\rightarrow$ `{"error": "Debes asociar una categoría válida al hábito."}`.
  * Si la categoría no existe o pertenece a otro usuario: `400 Bad Request` $\rightarrow$ `{"error": "La categoría indicada no existe o no tienes acceso a ella."}`.
* **Resultado exitoso:** Asigna un UUID v4 autogenerado, establece `is_active = 1`, `current_streak = 0`, `best_streak = 0` y retorna `201 Created` con el objeto completo formateado.

### 2.2. READ (Listar y Consultar Hábitos)
* **Listado General:** `GET /api/habits`
  * Parámetros opcionales de query: `activeOnly=true`.
  * Regla de negocio: Solo lista los hábitos creados por el usuario autenticado (`user_id = req.user.sub`) y que no hayan sido eliminados lógicamente (`deleted_at IS NULL`).
  * Realiza un `LEFT JOIN` con `categories` para devolver nombre, icono y color de la categoría asociada.
  * Ordenamiento: `ORDER BY sort_order ASC, created_at DESC`.
  * Resultado: `200 OK` con `{ "habits": [...] }`.
* **Consulta por ID:** `GET /api/habits/:id`
  * Regla de negocio: Busca el hábito por `id` y `user_id`. Si no coincide con el usuario autenticado o tiene `deleted_at IS NOT NULL`, retorna `404 Not Found` $\rightarrow$ `{"error": "Hábito no encontrado o no autorizado."}`.
  * Resultado: `200 OK` con `{ "habit": { ... } }`.

### 2.3. UPDATE (Actualizar Hábito Existente)
* **Método y Ruta:** `PUT /api/habits/:id`
* **Autenticación requerida:** Sí (`Bearer Token`).
* **Reglas de Negocio y Validaciones:**
  * Verifica primero la existencia y propiedad del hábito (`user_id = req.user.sub` y `deleted_at IS NULL`). Si no existe, retorna `404 Not Found`.
  * Admite actualización parcial de atributos (`title`, `categoryId`, `targetValue`, `unitLabel`, `scheduledDays`, `isActive`, `reminderTime`, `notes`, `sortOrder`).
  * Si se actualiza `categoryId`, valida que la nueva categoría exista y sea accesible. Si no: `400 Bad Request`.
  * Actualiza automáticamente la columna `updated_at = datetime('now')`.
* **Resultado exitoso:** Retorna `200 OK` con el mensaje y el objeto actualizado.

### 2.4. DELETE (Eliminación Lógica / Soft Delete)
* **Método y Ruta:** `DELETE /api/habits/:id`
* **Autenticación requerida:** Sí (`Bearer Token`).
* **Decisión Técnica - Soft Delete vs Hard Delete:**
  * Se aplica **borrado lógico (*soft delete*)** mediante la marca temporal `deleted_at = datetime('now')` y desactivación `is_active = 0`.
  * *Motivo:* Los hábitos acumulan registros históricos de progreso (`habit_logs`). Si se realizara un borrado físico (*hard delete*), se destruirían las estadísticas históricas, insignias ganadas y el historial de constancia del usuario.
* **Regla de Negocio:**
  * Si el hábito no existe, no pertenece al usuario o ya fue eliminado: Retorna `404 Not Found` $\rightarrow$ `{"error": "Hábito no encontrado o ya eliminado."}`.
* **Resultado exitoso:** `200 OK` $\rightarrow$ `{"message": "Hábito eliminado correctamente."}`.

---

## 3. Recurso: Seguimiento Diario (`/api/logs`)

### 3.1. CREATE / UPDATE (Upsert Diario de Progreso)
* **Método y Ruta:** `POST /api/logs`
* **Autenticación requerida:** Sí (`Bearer Token`).
* **Reglas de Negocio e Idempotencia:**
  * Requiere `habitId` y `logDate`.
  * Validación de fecha: Formato estricto `'YYYY-MM-DD'` validado mediante expresión regular `/^\d{4}-\d{2}-\d{2}$/`.
  * Valida que el hábito exista, no esté eliminado y pertenezca al usuario autenticado.
  * **Cálculo Automático de Cumplimiento:** Si no se especifica explícitamente `isCompleted`, el backend evalúa si `completedValue >= habit.target_value`. Si es igual o mayor, marca automáticamente `is_completed = 1`.
  * **Operación Upsert:** Si ya existía un registro para esa fecha y hábito (controlado por `UNIQUE (habit_id, log_date)`), actualiza los valores existentes y su timestamp `updated_at`. Si no existía, inserta un nuevo registro con UUID autogenerado.
* **Comportamiento ante Datos Inválidos:**
  * Falta de `habitId`: `400 Bad Request` $\rightarrow$ `{"error": "El habitId es requerido."}`.
  * Fecha mal formada: `400 Bad Request` $\rightarrow$ `{"error": "Debes proporcionar una fecha válida en formato YYYY-MM-DD (logDate)."}`.
  * Hábito no encontrado: `404 Not Found` $\rightarrow$ `{"error": "Hábito no encontrado o no autorizado."}`.
* **Resultado exitoso:** Retorna `200 OK` (en actualización) o `201 Created` (en nueva inserción) con el objeto de seguimiento.

### 3.2. READ (Consultar Seguimientos)
* **Método y Ruta:** `GET /api/logs`
* **Parámetros Opcionales de Consulta (*Query Params*):**
  * `habitId`: Filtra los registros de un hábito particular.
  * `date`: Consulta el progreso de una fecha específica (`'YYYY-MM-DD'`).
  * `startDate` y `endDate`: Consulta un rango histórico de fechas para análisis de tendencias y gráficos.
* **Regla de Negocio:**
  * Siempre restringe la consulta por `user_id = req.user.sub`.
  * Orden predeterminado: `ORDER BY log_date DESC, created_at DESC`.
* **Resultado:** `200 OK` con `{ "logs": [...] }`.

### 3.3. DELETE (Eliminar Registro de Seguimiento)
* **Método y Ruta:** `DELETE /api/logs/:id`
* **Autenticación requerida:** Sí (`Bearer Token`).
* **Regla de Negocio:** Permite deshacer o eliminar un check-in individual verificando que el log pertenezca al usuario autenticado.
* **Resultado:** `200 OK` $\rightarrow$ `{"message": "Registro eliminado correctamente."}` si tuvo éxito; `404 Not Found` si el log no existe o no pertenece al usuario.

---

## 4. Recurso: Categorías (`/api/categories`)

### 4.1. READ (Listar Categorías Disponibles)
* **Método y Ruta:** `GET /api/categories`
* **Autenticación requerida:** Sí (`Bearer Token`).
* **Regla de Negocio:** Retorna la unión de todas las categorías globales del sistema (`user_id IS NULL`) y las categorías personalizadas creadas por el usuario autenticado (`user_id = req.user.sub`).
* **Resultado:** `200 OK` con `{ "categories": [...] }` ordenadas por `id ASC`.

### 4.2. CREATE (Crear Categoría Personalizada)
* **Método y Ruta:** `POST /api/categories`
* **Autenticación requerida:** Sí (`Bearer Token`, rol `USER` o `ADMIN`).
* **Reglas de Negocio:**
  * `name`: Obligatorio, cadena de texto no vacía.
  * `iconName`: Opcional, por defecto `'Tag'`.
  * `colorHex`: Opcional, por defecto `'#6B7280'`.
  * Asocia forzosamente el `user_id = req.user.sub`, quedando como categoría privada del usuario.
* **Comportamiento ante Datos Inválidos:**
  * Si falta el nombre: `400 Bad Request` $\rightarrow$ `{"error": "El nombre de la categoría es requerido."}`.
* **Resultado exitoso:** `201 Created` con el ID generado autoincremental y los datos creados.
