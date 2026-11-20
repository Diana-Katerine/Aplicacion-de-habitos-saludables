# Implementar API REST

## 1. Arquitectura y Principios de Diseño
La API de **Aplicación de Hábitos Saludables (*Impulso Diario*)** sigue el estilo arquitectónico **REST (Representational State Transfer)**, operando sobre HTTP/1.1 y HTTP/2 mediante Node.js y Express.

### Principios Fundamentales:
1. **Sin Estado (*Stateless*):** Cada solicitud contiene toda la información necesaria para ser procesada. No se mantienen sesiones en memoria del servidor; la identidad se valida mediante un JSON Web Token (JWT) en el encabezado `Authorization`.
2. **Orientada a Recursos:** Las URLs identifican entidades del dominio (`habits`, `categories`, `logs`, `users`) mediante sustantivos en plural.
3. **Semántica HTTP Estricta:** Se emplean los verbos estándar (`GET`, `POST`, `PUT`, `DELETE`) para reflejar la acción sobre el recurso.
4. **Idempotencia:** Las operaciones `GET`, `PUT` y `DELETE` garantizan que múltiples ejecuciones idénticas produzcan el mismo estado del sistema.

---

## 2. Prefijo Base y Estrategia de Versionado

* **Prefijo Global de la API:** Todas las rutas del backend se sirven bajo el prefijo:
  ```
  /api
  ```
* **Estrategia de Versionado:** En esta etapa de despliegue intranet/SaaS, el versionado está integrado en el ciclo de vida de contratos URI y especificación OpenAPI (`version: 1.0.0`). Cuando se requieran cambios incompatibles (*breaking changes*) mayores, la industria recomienda versionar en la ruta `/api/v1/...` o mediante encabezados `Accept: application/vnd.habitos.v1+json`. El proyecto adopta actualmente la convención unificada `/api/...` con compatibilidad retroactiva garantizada.

---

## 3. Convenciones de Nombres y Estructura de URIs

1. **Sustantivos en Plural:**
   - `/api/habits` (Colección de hábitos).
   - `/api/categories` (Colección de categorías).
   - `/api/logs` (Colección de seguimientos diarios).
   - `/api/admin/users` (Colección de usuarios para auditoría).
2. **Identificadores por Path Param:**
   - `/api/habits/:id` (Hábito individual identificado por UUID).
   - `/api/logs/:id` (Log individual identificado por UUID).
3. **Parámetros de Consulta (*Query Parameters*) para Filtros:**
   - Filtro booleano: `?activeOnly=true`.
   - Filtro por fecha exacta: `?date=2026-11-20`.
   - Filtro por rango cronológico: `?startDate=2026-11-01&endDate=2026-11-30`.
   - Filtro por pertenencia: `?habitId=3f9c6d32-9c48-4e89-a2e1-4566d3a84b12`.
4. **Notación CamelCase en JSON:** Todos los atributos en los cuerpos de petición y respuesta utilizan `camelCase` (ej. `targetValue`, `scheduledDays`, `isCompleted`), mientras que en la base de datos se mantiene `snake_case` (ej. `target_value`, `scheduled_days`). La capa de controladores efectúa la transformación transparente.

---

## 4. Formato Estándar de Respuestas

Todas las respuestas emitidas por la API se entregan con el encabezado `Content-Type: application/json; charset=utf-8`.

### 4.1. Respuesta Exitosa de Colección (`GET /api/habits`)
```json
{
  "habits": [
    {
      "id": "3f9c6d32-9c48-4e89-a2e1-4566d3a84b12",
      "userId": "usr-1763683200",
      "categoryId": 1,
      "categoryName": "Hidratación",
      "categoryIcon": "Droplets",
      "categoryColor": "#0EA5E9",
      "title": "Tomar 8 vasos de agua",
      "targetValue": 8,
      "unitLabel": "vasos",
      "scheduledDays": [1, 2, 3, 4, 5, 6, 7],
      "currentStreak": 14,
      "bestStreak": 24,
      "isActive": true,
      "reminderTime": "09:00",
      "notes": "Mantener botella a la vista",
      "sortOrder": 0,
      "createdAt": "2026-11-15T08:00:00.000Z",
      "updatedAt": "2026-11-20T08:00:00.000Z"
    }
  ]
}
```

### 4.2. Respuesta Exitosa de Creación (`POST /api/habits` - 201 Created)
```json
{
  "message": "Hábito creado correctamente.",
  "habit": {
    "id": "7b8e1f23-4567-89ab-cdef-0123456789ab",
    "userId": "usr-1763683200",
    "categoryId": 2,
    "categoryName": "Ejercicio",
    "categoryIcon": "Dumbbell",
    "categoryColor": "#10B981",
    "title": "Caminar 20 minutos",
    "targetValue": 20,
    "unitLabel": "minutos",
    "scheduledDays": [1, 2, 3, 4, 5],
    "currentStreak": 0,
    "bestStreak": 0,
    "isActive": true,
    "reminderTime": "07:30",
    "notes": null,
    "sortOrder": 1,
    "createdAt": "2026-11-20T09:00:00.000Z",
    "updatedAt": "2026-11-20T09:00:00.000Z"
  }
}
```

### 4.3. Respuesta Exitosa de Eliminación o Acción (`DELETE /api/habits/:id` - 200 OK)
```json
{
  "message": "Hábito eliminado correctamente."
}
```

---

## 5. Códigos de Estado HTTP Empleados

La API utiliza los códigos de estado HTTP de forma semántica y predecible:

| Código | Significado | Escenario de Uso en la API |
| :---: | :--- | :--- |
| **`200 OK`** | Petición exitosa | Consultas (`GET`), actualizaciones exitosas (`PUT`) y eliminaciones lógicas (`DELETE`). |
| **`201 Created`**| Recurso creado | Inserción de usuarios (`POST /auth/register`), hábitos (`POST /habits`) y categorías (`POST /categories`). |
| **`400 Bad Request`** | Error en la petición | Cuerpos JSON mal formados, ausencia de campos obligatorios, IDs inválidos o tipos de datos incompatibles. |
| **`401 Unauthorized`** | No autenticado | Falta del encabezado `Authorization: Bearer <token>`, token expirado o firma criptográfica alterada. |
| **`403 Forbidden`** | Sin autorización / Rol insuficiente | El usuario está autenticado pero su rol (`USER`) no tiene permisos para acceder al endpoint administrativo (`ADMIN`). |
| **`404 Not Found`** | Recurso inexistente | El recurso no existe o no pertenece al usuario autenticado (aislamiento de datos). |
| **`409 Conflict`** | Conflicto de unicidad | Intento de registrar un correo que ya existe en la base de datos (`POST /auth/register`). |
| **`500 Internal Server Error`** | Error de servidor | Fallo no capturado en la base de datos o excepción de ejecución interna. |
| **`502 Bad Gateway`** | Error de servicio externo | Fallo o caída en la comunicación con APIs externas upstream (ej. Google Gemini API). |

---

## 6. Formato Universal de Errores y Manejo de Excepciones

Cuando una operación falla (estados $4xx$ o $5xx$), la API devuelve una estructura JSON uniforme con la clave `error`:

```json
{
  "error": "Debes proporcionar un correo electrónico válido."
}
```

### Patrón de Control de Errores en Código (Node.js/Express):
Todos los controladores están protegidos mediante bloques `try / catch`. Las fallas de validación de negocio se responden tempranamente cortando la ejecución (`return`), evitando fugas de memoria o respuestas pendientes (*hanging connections*). Los errores imprevistos se registran en los logs de auditoría sin exponer trazas de la pila (*stack traces*) al cliente:

```typescript
try {
  // Validación de entrada
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'El título del hábito es obligatorio.' });
    return;
  }
  // Lógica de base de datos...
} catch (err) {
  console.error('Error no controlado en endpoint:', err);
  res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.' });
}
```
