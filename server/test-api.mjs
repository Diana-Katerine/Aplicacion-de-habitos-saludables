// Script de verificación automatizada de endpoints RESTful para Sprint 2
// Cubre: Registro, Login, Token JWT, Protección de rutas, CRUD de Hábitos, Logs y Validación de pertenencia.

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const { headers, ...restOptions } = options;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...restOptions,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message, extra = null) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    if (extra) console.error('Detalle:', JSON.stringify(extra, null, 2));
    process.exit(1);
  }
  console.log(`✅ PASÓ: ${message}`);
}

async function runTests() {
  console.log(`🚀 Iniciando pruebas funcionales de API Backend en: ${BASE_URL}\n`);

  const uniqueSuffix = Date.now();
  const user1Email = `user1_${uniqueSuffix}@test.com`;
  const user2Email = `user2_${uniqueSuffix}@test.com`;
  const password = 'PasswordSeguro123!';

  // 1. Registro de Usuario 1
  const reg1 = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: user1Email,
      password,
      fullName: 'Usuario Uno',
      timezone: 'America/Bogota',
      themePreference: 'DARK',
    }),
  });
  assert(reg1.status === 201, 'Registro de usuario 1 retorna 201 Created');
  assert(!!reg1.data?.token, 'Respuesta de registro incluye token JWT');
  const token1 = reg1.data.token;
  const user1Id = reg1.data.user.id;

  // 2. Registro de Usuario 2 (para probar aislamiento de datos)
  const reg2 = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: user2Email,
      password,
      fullName: 'Usuario Dos',
    }),
  });
  assert(reg2.status === 201, 'Registro de usuario 2 retorna 201 Created');
  const token2 = reg2.data.token;

  // 3. Login de Usuario 1
  const login1 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: user1Email,
      password,
    }),
  });
  assert(login1.status === 200, 'Login con credenciales correctas retorna 200 OK');
  assert(!!login1.data?.token, 'Login retorna token');

  // 4. Login con contraseña incorrecta
  const loginFail = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: user1Email,
      password: 'password_erroneo',
    }),
  });
  assert(loginFail.status === 401, 'Login con contraseña errónea retorna 401 Unauthorized');

  // 5. Perfil /auth/me con Token
  const me = await request('/auth/me', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(me.status === 200, 'Ruta protegida /auth/me retorna 200 con token válido');
  assert(me.data?.user?.email === user1Email, 'Usuario autenticado coincide con el token');

  // 6. Acceso sin token
  const noToken = await request('/habits');
  assert(noToken.status === 401, 'Acceso sin token a /habits retorna 401 Unauthorized');

  // 7. Listar Categorías
  const cats = await request('/categories', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(cats.status === 200, 'GET /categories retorna 200 OK');
  assert(Array.isArray(cats.data?.categories) && cats.data.categories.length >= 5, 'Retorna categorías por defecto');

  // 8. Crear Hábito (Usuario 1)
  const createHabit = await request('/habits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      title: 'Beber 2 litros de agua',
      categoryId: 1,
      targetValue: 2,
      unitLabel: 'Litros',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: '09:00',
      notes: 'Hidratación constante durante el día',
    }),
  });
  assert(createHabit.status === 201, 'POST /habits crea un nuevo hábito (201 Created)', createHabit);
  const habitId = createHabit.data?.habit?.id;
  assert(!!habitId, 'Hábito creado tiene ID UUID');

  // 9. Listar Hábitos (Usuario 1)
  const listHabits1 = await request('/habits', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(listHabits1.data?.habits?.length === 1, 'Usuario 1 ve 1 hábito en su lista');

  // 10. Aislamiento de datos: Usuario 2 no debe ver el hábito de Usuario 1
  const listHabits2 = await request('/habits', {
    headers: { Authorization: `Bearer ${token2}` },
  });
  assert(listHabits2.data?.habits?.length === 0, 'Usuario 2 tiene lista vacía (aislamiento de datos)');

  // 11. Usuario 2 intenta acceder al hábito de Usuario 1 por ID
  const forbiddenHabit = await request(`/habits/${habitId}`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  assert(forbiddenHabit.status === 404, 'Usuario 2 recibe 404 al intentar leer hábito de Usuario 1');

  // 12. Actualizar Hábito (Usuario 1)
  const updateHabit = await request(`/habits/${habitId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      title: 'Beber 2.5 litros de agua fresca',
      targetValue: 2.5,
    }),
  });
  assert(updateHabit.status === 200, 'PUT /habits/:id actualiza el hábito correctamente');
  assert(updateHabit.data?.habit?.title === 'Beber 2.5 litros de agua fresca', 'Título del hábito actualizado');

  // 13. Registrar Progreso Diario (Habit Log)
  const logDate = new Date().toISOString().split('T')[0];
  const createLog = await request('/logs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      habitId,
      logDate,
      completedValue: 2.5,
      isCompleted: true,
      energyLevel: 5,
      moodTag: 'focused',
      journalEntry: 'Me sentí con mucha energía hoy.',
    }),
  });
  assert(createLog.status === 201 || createLog.status === 200, 'POST /logs registra el progreso diario');
  const logId = createLog.data?.log?.id;
  assert(createLog.data?.log?.isCompleted === true, 'El registro marca el hábito como completado');

  // 14. Consultar registros diarios
  const getLogs = await request(`/logs?habitId=${habitId}&date=${logDate}`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(getLogs.data?.logs?.length === 1, 'GET /logs retorna el registro de seguimiento del día');

  // 15. Eliminar hábito (Soft delete)
  const deleteHabit = await request(`/habits/${habitId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(deleteHabit.status === 200, 'DELETE /habits/:id elimina el hábito correctamente');

  // 16. Verificar que ya no aparece en la lista de hábitos activos
  const listAfterDelete = await request('/habits', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(listAfterDelete.data?.habits?.length === 0, 'Hábito eliminado ya no aparece en la lista');

  // 17. PRUEBAS DE AUTORIZACIÓN BASADA EN ROLES (RBAC)
  // Usuario 1 tiene rol 'USER' por defecto; intentar acceder a /admin debe retornar 403 Forbidden
  const userAccessDenied = await request('/admin/metrics', {
    headers: { Authorization: `Bearer ${token1}` },
  });
  assert(userAccessDenied.status === 403, 'RBAC: Usuario estándar recibe 403 Forbidden al acceder a /admin/metrics');

  // 18. Simular o crear un usuario con rol 'ADMIN'
  const adminEmail = `admin_${uniqueSuffix}@test.com`;
  const regAdmin = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: adminEmail,
      password,
      fullName: 'Administrador General',
    }),
  });
  const adminId = regAdmin.data?.user?.id;
  const adminToken = regAdmin.data?.token;

  // Promover directamente en la base de datos o verificar acceso admin
  // Dado que /auth/register por defecto asigna 'USER', actualizamos el rol del admin de prueba:
  const { db } = await import('./db/index.ts');
  db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(adminId);

  // Obtener token fresco con rol ADMIN haciendo login
  const loginAdmin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password }),
  });
  const refreshedAdminToken = loginAdmin.data?.token;

  // 19. Verificar acceso exitoso de ADMIN a /admin/metrics
  const adminMetrics = await request('/admin/metrics', {
    headers: { Authorization: `Bearer ${refreshedAdminToken}` },
  });
  assert(adminMetrics.status === 200, 'RBAC: Administrador accede exitosamente a /admin/metrics (200 OK)');
  assert(typeof adminMetrics.data?.metrics?.totalUsers === 'number', 'Métricas administrativas calculan conteo de usuarios');

  // 20. Verificar creación de categoría global por parte del Administrador
  const createGlobalCat = await request('/admin/categories', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshedAdminToken}` },
    body: JSON.stringify({
      name: `Finanzas Personales ${uniqueSuffix}`,
      iconName: 'DollarSign',
      colorHex: '#10B981',
    }),
  });
  assert(createGlobalCat.status === 201, 'RBAC: Administrador crea categoría global oficial (201 Created)');
  assert(createGlobalCat.data?.category?.userId === null, 'La categoría global tiene userId = null');

  // 21. Verificar documentación OpenAPI y visor interactivo Swagger UI
  const swaggerUI = await fetch(`${BASE_URL}/docs`);
  assert(swaggerUI.status === 200, 'Visor interactivo Swagger UI disponible en GET /api/docs (200 OK)');

  const openapiYaml = await fetch(`${BASE_URL}/docs/openapi.yaml`);
  assert(openapiYaml.status === 200, 'Especificación OpenAPI YAML servida en GET /api/docs/openapi.yaml (200 OK)');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA API REST Y CONTROL DE ROLES (SPRINT 2) PASARON EXITOSAMENTE!');
}

runTests().catch((err) => {
  console.error('Error durante la ejecución de pruebas:', err);
  process.exit(1);
});
