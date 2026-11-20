# Documento 3: Desarrollar Autenticación y Autorización

## 1. Mecanismo de Autenticación Basado en Tokens (JWT)
La seguridad del sistema está construida sobre el estándar abierto **JSON Web Tokens (JWT / RFC 7519)**, utilizando firma criptográfica con algoritmo de clave simétrica **HMAC-SHA256 (HS256)**.

### Características del Token JWT:
* **Firma Criptográfica:** Generada con `crypto.createHmac('sha256', JWT_SECRET)` a partir del secreto de entorno del servidor.
* **Tiempo de Vida (*TTL*):** 24 horas a partir del momento de emisión (`exp = iat + 86400`).
* **Comparación en Tiempo Constante:** Al verificar la firma, se utiliza `crypto.timingSafeEqual` para evitar ataques de temporización (*timing attacks*) sobre la firma digital.

### Estructura del Payload del Token (`TokenPayload`):
```json
{
  "sub": "usr-8a21e4b3-c19d-472e-839f-927318301142",
  "email": "alex.momentum@example.com",
  "role": "USER",
  "iat": 1763683200,
  "exp": 1763769600
}
```
* `sub` (*Subject*): Contiene el UUID inmutable del usuario en la base de datos.
* `email`: Correo verificado del usuario.
* `role`: Rol de autorización en el sistema (`'USER'` o `'ADMIN'`).
* `iat` (*Issued At*): Timestamp UNIX de emisión en segundos.
* `exp` (*Expiration Time*): Timestamp UNIX de caducidad en segundos.

---

## 2. Hashing Criptográfico de Contraseñas
Las contraseñas en texto plano **nunca** se almacenan ni persisten en logs. Se aplica una función de derivación de claves resistente a ataques por GPU y tablas arcoíris:

1. **Implementación en Node.js (Servidor Principal):**
   - Algoritmo: **scrypt** nativo de Node.js (`crypto.scryptSync`).
   - Salting: 16 bytes criptográficamente pseudoaleatorios (`crypto.randomBytes(16)`).
   - Formato de almacenamiento: `salt:hash` en codificación hexadecimal con longitud de salida de 64 bytes.
2. **Implementación en PHP / XAMPP (Sincronización Local):**
   - Algoritmo: **BCRYPT** (`PASSWORD_BCRYPT` nativo con factor de costo 12).
   - Verificación mediante `password_verify($password, $hash)`.

---

## 3. Flujo de Autenticación e Inicio de Sesión

```
   Cliente Web / Móvil                         Servidor Backend (/api/auth)
          |                                                 |
          |  1. POST /login { email, password }             |
          |------------------------------------------------>|
          |                                                 |-- Busca usuario por email
          |                                                 |-- Verifica scrypt/bcrypt
          |                                                 |-- Si coincide: genera JWT
          |  2. 200 OK { token, user: { id, email, ... } }  |
          |<------------------------------------------------|
          |                                                 |
          |  3. Petición a recurso protegido (/api/habits)  |
          |     Header: Authorization: Bearer <token>       |
          |------------------------------------------------>|
          |                                                 |-- Middleware 'authenticate'
          |                                                 |-- Verifica firma y exp
          |                                                 |-- Inyecta req.user = payload
          |  4. 200 OK { habits: [...] }                    |
          |<------------------------------------------------|
```

### Pasos Detallados:
1. **Envío de Credenciales:** El cliente envía el correo normalizado en minúsculas y la contraseña.
2. **Validación:** El servidor busca el registro en `users` por índice $O(1)$. Si no existe o la verificación criptográfica falla, responde `401 Unauthorized` con un mensaje genérico para evitar enumeración de usuarios (*"Credenciales inválidas. Verifica tu correo y contraseña"*).
3. **Emisión:** Si es correcto, el servidor genera el JWT y lo devuelve junto con el objeto de perfil seguro (sin hash de contraseña).
4. **Almacenamiento en Cliente:** El cliente almacena el token en almacenamiento local o sesión y lo adjunta en cada solicitud subsiguiente bajo el encabezado estándar:
   ```http
   Authorization: Bearer <token_jwt>
   ```

---

## 4. Renovación de Credenciales y Recuperación de Contraseña

### 4.1. Renovación de Token por Consulta de Perfil (`GET /api/auth/me`)
Cuando el cliente necesita verificar si la sesión sigue activa o actualizar sus datos en memoria, consulta el endpoint autenticado `/api/auth/me`. Si el token es válido, se confirma la vigencia de la identidad sin necesidad de reintroducir contraseñas.

### 4.2. Recuperación Segura de Contraseña
Para usuarios que olvidaron su contraseña, el sistema implementa un flujo de dos pasos:
1. **Solicitud de Token Temporal:** Mediante el correo del usuario, se genera un código de verificación numérico de 6 dígitos con expiración estricta de 15 minutos (`expiresAt = Date.now() + 15 * 60 * 1000`).
2. **Validación y Reestablecimiento:** El usuario envía el código y su nueva contraseña ($\ge 6$ caracteres). El sistema valida el código en tiempo y unicidad, consume el token temporal para que no pueda reutilizarse y calcula el nuevo hash de contraseña actualizando la base de datos.

---

## 5. Modelo de Roles y Permisos (RBAC)

El sistema define dos roles de usuario mediante control de acceso basado en roles (*Role-Based Access Control*):

| Rol | Alcance de Permisos | Recursos Permitidos |
| :---: | :--- | :--- |
| **`USER`** | Propietario de Datos (*Owner*). Solo puede gestionar sus propios hábitos, seguimientos y categorías. | `/api/auth/me`, `/api/habits/*`, `/api/categories/*`, `/api/logs/*`, `/api/coach/*` |
| **`ADMIN`** | Administrador de Sistema. Posee todos los permisos de `USER` más acceso a estadísticas globales, auditoría de usuarios y creación de categorías maestras. | Todo lo anterior más `/api/admin/metrics`, `/api/admin/users`, `/api/admin/categories` |

---

## 6. Middlewares de Protección de Endpoints

### 6.1. Middleware de Autenticación (`authenticate`)
Ubicación: `server/middleware/auth.ts`
* Intercepta la solicitud y comprueba la existencia del encabezado `Authorization: Bearer <token>`.
* Si falta el encabezado o no inicia con `'Bearer '`: Retorna `401 Unauthorized`.
* Decodifica y verifica la firma HMAC-SHA256 y la fecha de expiración (`exp`).
* Si el token es inválido o expiró: Retorna `401 Unauthorized`.
* Si es válido: Inyecta el payload verificado en `req.user` y transfiere el control con `next()`.

### 6.2. Middleware de Autorización por Roles (`requireRole`)
Ubicación: `server/middleware/auth.ts`
* Recibe un arreglo de roles permitidos (ej. `requireRole(['ADMIN'])`).
* Evalúa `req.user.role`.
* Si el rol del usuario autenticado no está en la lista de permitidos: Retorna **`403 Forbidden`** con el mensaje:
  ```json
  { "error": "Acceso denegado. Se requiere uno de los siguientes roles: ADMIN." }
  ```
* Si el rol está autorizado, cede el control a la ruta solicitada.

### 6.3. Aislamiento Multi-inquilino (*Multitenancy Data Isolation*)
Más allá del rol, ningún usuario regular puede acceder, modificar ni eliminar recursos pertenecientes a otro usuario. Todas las consultas SQL (`SELECT`, `UPDATE`, `DELETE`) en las rutas de hábitos y logs incluyen obligatoriamente el filtro de propiedad:
```sql
WHERE id = ? AND user_id = ?
```
Si el registro existe pero pertenece a otro usuario, la API responde intencionalmente `404 Not Found` en lugar de `403`, impidiendo que atacantes externos confirmen la existencia de identificadores ajenos.
