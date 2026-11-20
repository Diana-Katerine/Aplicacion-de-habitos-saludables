# Documento 5: Documentar Endpoints

## 1. Información General y Servidores
* **Título de la API:** API Impulso Diario - Hábitos Saludables
* **Versión del Contrato:** 1.0.0 (OpenAPI 3.0.3)
* **URL Base de Desarrollo:** `http://localhost:3000/api`
* **Visor Interactivo en Navegador (Swagger UI):** `http://localhost:3000/api/docs`
* **Especificación OpenAPI YAML en Crudo:** `http://localhost:3000/api/docs/openapi.yaml`
* **Esquema de Seguridad Global:**
  * Tipo: HTTP Bearer Token.
  * Encabezado: `Authorization: Bearer <token_jwt>`.

---

## 2. Módulo de Autenticación (`/api/auth`)

### 2.1. Registro de Usuario
* **Método:** `POST`
* **Ruta:** `/auth/register`
* **Autenticación:** Ninguna (Pública).
* **Cuerpo de la Petición (`application/json`):**
  ```json
  {
    "email": "ana.garcia@example.com",
    "password": "PasswordSegura123!",
    "fullName": "Ana García",
    "timezone": "America/Bogota",
    "themePreference": "LIGHT"
  }
  ```
* **Respuestas:**
  * **`201 Created`:**
    ```json
    {
      "message": "Usuario registrado exitosamente.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e8a12345-6789-abcd-ef01-234567890abc",
        "email": "ana.garcia@example.com",
        "fullName": "Ana García",
        "timezone": "America/Bogota",
        "themePreference": "LIGHT",
        "role": "USER"
      }
    }
    ```
  * **`400 Bad Request`:**
    ```json
    { "error": "Debes proporcionar un correo electrónico válido." }
    ```
  * **`409 Conflict`:**
    ```json
    { "error": "El correo electrónico ya se encuentra registrado." }
    ```

---

### 2.2. Inicio de Sesión
* **Método:** `POST`
* **Ruta:** `/auth/login`
* **Autenticación:** Ninguna (Pública).
* **Cuerpo de la Petición (`application/json`):**
  ```json
  {
    "email": "ana.garcia@example.com",
    "password": "PasswordSegura123!"
  }
  ```
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "message": "Inicio de sesión exitoso.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e8a12345-6789-abcd-ef01-234567890abc",
        "email": "ana.garcia@example.com",
        "fullName": "Ana García",
        "timezone": "America/Bogota",
        "themePreference": "LIGHT",
        "role": "USER"
      }
    }
    ```
  * **`400 Bad Request`:**
    ```json
    { "error": "Debes indicar correo y contraseña." }
    ```
  * **`401 Unauthorized`:**
    ```json
    { "error": "Credenciales inválidas. Verifica tu correo y contraseña." }
    ```

---

### 2.3. Perfil del Usuario Autenticado
* **Método:** `GET`
* **Ruta:** `/auth/me`
* **Autenticación:** Bearer Token obligatoria.
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "user": {
        "id": "e8a12345-6789-abcd-ef01-234567890abc",
        "email": "ana.garcia@example.com",
        "fullName": "Ana García",
        "timezone": "America/Bogota",
        "themePreference": "LIGHT",
        "role": "USER",
        "createdAt": "2026-11-20T08:00:00.000Z"
      }
    }
    ```
  * **`401 Unauthorized`:** Token ausente, alterado o vencido.

---

## 3. Módulo de Categorías (`/api/categories`)

### 3.1. Listar Categorías
* **Método:** `GET`
* **Ruta:** `/categories`
* **Autenticación:** Bearer Token.
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "categories": [
        {
          "id": 1,
          "userId": null,
          "name": "Hidratación",
          "iconName": "Droplets",
          "colorHex": "#0EA5E9",
          "createdAt": "2026-11-17T10:00:00"
        },
        {
          "id": 8,
          "userId": "e8a12345-6789-abcd-ef01-234567890abc",
          "name": "Lectura Matutina",
          "iconName": "BookOpen",
          "colorHex": "#8B5CF6",
          "createdAt": "2026-11-20T08:30:00"
        }
      ]
    }
    ```

### 3.2. Crear Categoría Personalizada
* **Método:** `POST`
* **Ruta:** `/categories`
* **Autenticación:** Bearer Token.
* **Cuerpo de la Petición:**
  ```json
  {
    "name": "Meditación y Pausa",
    "iconName": "Brain",
    "colorHex": "#6366F1"
  }
  ```
* **Respuestas:**
  * **`201 Created`:**
    ```json
    {
      "message": "Categoría creada exitosamente.",
      "category": {
        "id": 9,
        "userId": "e8a12345-6789-abcd-ef01-234567890abc",
        "name": "Meditación y Pausa",
        "iconName": "Brain",
        "colorHex": "#6366F1"
      }
    }
    ```
  * **`400 Bad Request`:** `{"error": "El nombre de la categoría es requerido."}`.

---

## 4. Módulo de Hábitos (`/api/habits`)

### 4.1. Listar Hábitos
* **Método:** `GET`
* **Ruta:** `/habits`
* **Parámetros de Query:** `activeOnly` (`boolean`, opcional).
* **Autenticación:** Bearer Token.
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "habits": [
        {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "userId": "e8a12345-6789-abcd-ef01-234567890abc",
          "categoryId": 1,
          "categoryName": "Hidratación",
          "categoryIcon": "Droplets",
          "categoryColor": "#0EA5E9",
          "title": "Tomar 8 vasos de agua",
          "targetValue": 8,
          "unitLabel": "vasos",
          "scheduledDays": [1, 2, 3, 4, 5, 6, 7],
          "currentStreak": 5,
          "bestStreak": 14,
          "isActive": true,
          "reminderTime": "08:30",
          "notes": "Un vaso al despertar",
          "sortOrder": 0,
          "createdAt": "2026-11-15T08:00:00.000Z",
          "updatedAt": "2026-11-20T08:00:00.000Z"
        }
      ]
    }
    ```

### 4.2. Crear Hábito
* **Método:** `POST`
* **Ruta:** `/habits`
* **Autenticación:** Bearer Token.
* **Cuerpo de la Petición:**
  ```json
  {
    "title": "Caminar 20 minutos al aire libre",
    "categoryId": 2,
    "targetValue": 20,
    "unitLabel": "minutos",
    "scheduledDays": [1, 2, 3, 4, 5],
    "reminderTime": "07:00",
    "notes": "Ruta del parque"
  }
  ```
* **Respuestas:**
  * **`201 Created`:** Retorna `message` y el objeto `habit` completo.
  * **`400 Bad Request`:** Título faltante o categoría inválida.

### 4.3. Detalle de un Hábito
* **Método:** `GET`
* **Ruta:** `/habits/:id`
* **Parámetro de Path:** `id` (UUID).
* **Autenticación:** Bearer Token.
* **Respuestas:**
  * **`200 OK`:** `{ "habit": { ... } }`.
  * **`404 Not Found`:** Hábito no encontrado o no pertenece al usuario.

### 4.4. Actualizar Hábito
* **Método:** `PUT`
* **Ruta:** `/habits/:id`
* **Parámetro de Path:** `id` (UUID).
* **Autenticación:** Bearer Token.
* **Cuerpo de la Petición:**
  ```json
  {
    "title": "Caminar 30 minutos al aire libre",
    "targetValue": 30
  }
  ```
* **Respuestas:**
  * **`200 OK`:** `{ "message": "Hábito actualizado exitosamente.", "habit": { ... } }`.
  * **`400 Bad Request`:** Datos inválidos o categoría inaccesible.
  * **`404 Not Found`:** Hábito no encontrado.

### 4.5. Eliminar Hábito (Soft Delete)
* **Método:** `DELETE`
* **Ruta:** `/habits/:id`
* **Parámetro de Path:** `id` (UUID).
* **Autenticación:** Bearer Token.
* **Respuestas:**
  * **`200 OK`:** `{ "message": "Hábito eliminado correctamente." }`.
  * **`404 Not Found`:** Hábito no encontrado o ya eliminado.

---

## 5. Módulo de Seguimiento Diario (`/api/logs`)

### 5.1. Listar Registros de Seguimiento
* **Método:** `GET`
* **Ruta:** `/logs`
* **Parámetros de Query Opcionales:**
  * `habitId`: UUID del hábito.
  * `date`: Fecha exacta `'YYYY-MM-DD'`.
  * `startDate` y `endDate`: Rango de fechas.
* **Autenticación:** Bearer Token.
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "logs": [
        {
          "id": "f5e4d3c2-b1a0-9876-5432-10fedcba9876",
          "habitId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "userId": "e8a12345-6789-abcd-ef01-234567890abc",
          "logDate": "2026-11-20",
          "completedValue": 8,
          "isCompleted": true,
          "energyLevel": 5,
          "moodTag": "focused",
          "journalEntry": "Completé los 8 vasos antes de cenar.",
          "createdAt": "2026-11-20T19:30:00.000Z",
          "updatedAt": "2026-11-20T19:30:00.000Z"
        }
      ]
    }
    ```

### 5.2. Registrar o Actualizar Progreso (Upsert)
* **Método:** `POST`
* **Ruta:** `/logs`
* **Autenticación:** Bearer Token.
* **Cuerpo de la Petición:**
  ```json
  {
    "habitId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "logDate": "2026-11-20",
    "completedValue": 8,
    "isCompleted": true,
    "energyLevel": 5,
    "moodTag": "focused",
    "journalEntry": "Completé los 8 vasos antes de cenar."
  }
  ```
* **Respuestas:**
  * **`200 OK` / `201 Created`:** Retorna el registro de seguimiento guardado.
  * **`400 Bad Request`:** Fecha no ISO o habitId ausente.
  * **`404 Not Found`:** Hábito no existe o pertenece a otro usuario.

### 5.3. Eliminar Registro
* **Método:** `DELETE`
* **Ruta:** `/logs/:id`
* **Parámetro de Path:** `id` (UUID).
* **Autenticación:** Bearer Token.
* **Respuestas:**
  * **`200 OK`:** `{ "message": "Registro eliminado correctamente." }`.
  * **`404 Not Found`:** Registro no encontrado.

---

## 6. Módulo de Administración RBAC (`/api/admin`)

*Todos los endpoints de este módulo requieren un token Bearer con rol `ADMIN`. Si un usuario con rol `USER` intenta acceder, recibe `403 Forbidden`.*

### 6.1. Métricas Globales del Sistema
* **Método:** `GET`
* **Ruta:** `/admin/metrics`
* **Autenticación:** Bearer Token (`role === 'ADMIN'`).
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "metrics": {
        "totalUsers": 142,
        "totalHabits": 850,
        "activeHabits": 720,
        "totalLogs": 14250,
        "completedLogs": 12100,
        "completionRate": 85,
        "usersByRole": [
          { "role": "USER", "count": 139 },
          { "role": "ADMIN", "count": 3 }
        ]
      },
      "generatedAt": "2026-11-20T09:30:00.000Z"
    }
    ```
  * **`403 Forbidden`:**
    ```json
    { "error": "Acceso denegado. Se requiere uno de los siguientes roles: ADMIN." }
    ```

### 6.2. Auditoría y Listado de Usuarios
* **Método:** `GET`
* **Ruta:** `/admin/users`
* **Autenticación:** Bearer Token (`role === 'ADMIN'`).
* **Respuestas:**
  * **`200 OK`:**
    ```json
    {
      "users": [
        {
          "id": "e8a12345-6789-abcd-ef01-234567890abc",
          "email": "ana.garcia@example.com",
          "fullName": "Ana García",
          "timezone": "America/Bogota",
          "themePreference": "LIGHT",
          "role": "USER",
          "createdAt": "2026-11-20T08:00:00.000Z"
        }
      ]
    }
    ```

### 6.3. Crear Categoría Global del Sistema
* **Método:** `POST`
* **Ruta:** `/admin/categories`
* **Autenticación:** Bearer Token (`role === 'ADMIN'`).
* **Cuerpo de la Petición:**
  ```json
  {
    "name": "Finanzas y Ahorro",
    "iconName": "DollarSign",
    "colorHex": "#10B981"
  }
  ```
* **Respuestas:**
  * **`201 Created`:** Crea la categoría con `user_id = NULL` visible para todos los usuarios.
  * **`403 Forbidden`:** Usuario no es administrador.
