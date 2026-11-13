# Flujo de Navegación y UI (User Flow) — Habit Tracker App

## 1. Punto de Partida y Matriz de Acceso (Entry Point)

### 1.1 Punto de Entrada Público

El usuario llega a la aplicación a través de la ruta raíz pública (`/`), que actúa como Landing Page de conversión.

* **Primer Impacto Visual:**
  * Titular claro con la propuesta de valor ("Construye hábitos saludables en 1 minuto al día").
  * Vista previa interactiva de la tarjeta de hábito con contador de racha 🔥.
  * Botón primario: **"Comenzar gratis"** (redirige a `/register`).
  * Botón secundario: **"Iniciar sesión"** (redirige a `/login`).
  * Enlace secundario: **"Probar demo rápida"** (Modo Invitado en memoria con banner de invitación a crear cuenta).

### 1.2 Matriz de Navegación por Estado de Sesión

Al cargar cualquier ruta, el frontend consulta `GET /api/v1/auth/me` enviando la cookie `HttpOnly`:

| Ruta / Solicitud | Usuario Anónimo (Sin Sesión) | Usuario Autenticado (Sesión Válida) |
| --- | --- | --- |
| `/` (Landing Page) | Renderiza Landing Page pública | Redirección automática inmediata a `/today` |
| `/login` o `/register` | Renderiza formulario correspondiente | Redirección automática a `/today` |
| Rutas Privadas (`/today`, `/habits`, `/stats`, `/profile`) | Bloqueado. Redirige a `/login?redirect={path}` | Acceso permitido. Carga datos específicos del usuario |
| `/admin/templates` | Bloqueado. Redirige a `/login` | Permitido solo si `role === 'ADMIN'`. De lo contrario, error `403` |
| Barra de Navegación | Logo + "Iniciar sesión" / "Registrarse" | Logo + Menú: Hoy (`/today`), Mis Hábitos (`/habits`), Estadísticas (`/stats`), Perfil + Logout |

---

## 2. Caminos Críticos Paso a Paso (Happy Paths)

### 2.1 Happy Path 1: Usuario Nuevo (Onboarding → Primer Check-in)

1. **Llegada:** Usuario entra a `/` y hace clic en **"Comenzar gratis"** -> Navega a `/register`.
2. **Formulario de Registro:** Completa Nombre, Correo y Contraseña.
   * *Autodetección:* JavaScript obtiene la zona horaria IANA del navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`) y la adjunta al payload del registro.
3. **Autenticación Automática:** El servidor valida con Zod, crea el usuario en MySQL, emite la cookie JWT `HttpOnly` y devuelve respuesta `201 Created`.
4. **Onboarding Guiado:** El usuario es redirigido a `/today` con un modal de bienvenida que presenta 4 sugerencias populares en 1 clic (ej. "Tomar 8 vasos de agua", "Caminar 20 min") o la opción "Crear hábito desde cero".
5. **Creación del Hábito:** Selecciona "Tomar 8 vasos de agua" (Meta: 8, Unidad: 'vasos', Días: Lunes a Domingo).
6. **Aterrizaje en Vista "Hoy":** El modal se cierra, la tarjeta aparece en la lista de `/today` y la barra superior de progreso diario se muestra en `0%`.
7. **Primer Check-in (Momento ¡Ajá!):** Pulsa el botón `+` en la tarjeta del hábito.
   * El contador sube a `1/8`.
   * Al pulsar 7 veces más hasta `8/8`, la tarjeta cambia visualmente a estado completado (check verde, texto tachado suave) y la racha sube a 🔥 **1 día**.

### 2.2 Happy Path 2: Usuario Recurrente (Rutina Diaria)

1. **Apertura de la App:** Usuario abre la aplicación en su navegador o móvil.
2. **Sesión Validada:** El middleware valida el token en la cookie y redirige de inmediato a `/today` (Vista "Hoy").
3. **Lectura de Rutina del Día:** La API devuelve únicamente los hábitos activos programados para el día actual en la zona horaria del usuario.
4. **Registro de Cumplimiento (Check-in):**
   * *Hábito de 1 clic (ej. Meditar 10 min):* Pulsa la tarjeta una vez. La API procesa la transacción en `habit_logs`, incrementa `current_streak` y la tarjeta se desplaza suavemente a la sección "Completados hoy".
5. **Confirmación de Jornada:** Al completar el último hábito del día, la barra de progreso llega a `100%` y aparece un banner festivo: *"¡Día completado! Llevas 7 días seguidos sin fallar."*

---

## 3. Bifurcaciones Lógicas y Escenarios Alternativos (Edge Cases)

```
                       [ Acción del Usuario / Evento ]
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
[ Error de Conexión ]     [ Expiración de Token ]      [ Desfase de Timezone ]
         │                            │                            │
         ▼                            ▼                            ▼
 Rollback Optimista        Interceptor 401 Capturado     Banner Informativo
 + Toast con "Reintentar"  Redirige a /login con         "¿Actualizar a tu hora
                           aviso de sesión expirada      local actual?"
```

* **Desmarcar un Hábito Completado:** Si el usuario pulsa por error un hábito ya completado el mismo día, el sistema revierte el registro (`is_completed = false`), descuenta el incremento de racha y muestra un Toast: *"Registro deshecho"*.
* **Sin Hábitos Programados para Hoy:** Si el usuario solo programó hábitos de lunes a viernes y entra el domingo, se muestra una ilustración de descanso: *"¡Día libre! No tienes hábitos para hoy"*, con un enlace a `/habits` para consultar o programar nuevos.
* **Fallos de Red al Hacer Check-in:** La interfaz muestra el cambio visual de inmediato (actualización optimista). Si la petición backend falla por red o servidor `500`, se revierte el cambio visual y se habilita un Toast de error con botón **"Reintentar"**.
* **Navegación a Rutas Inexistentes (404):** Cualquier URL no mapeada o ID de hábito eliminado renderiza una vista limpia de error 404 con un botón único **"Volver a mis hábitos (/today)"**.

---

## 4. Estados de la Interfaz (UI States)

### 4.1 Estados de Carga (Loading States)

* **Carga Inicial de Vistas (`/today`, `/habits`, `/stats`):** Muestra *Skeleton Screens* (tarjetas animadas en gris pulsadito) manteniendo el espacio exacto del layout para evitar saltos bruscos (*layout shift*).
* **Acción de Check-in:** Deshabilitación sutil del botón por `<500ms` para evitar doble clic accidental mientras la actualización optimista mantiene la fluidez visual.

### 4.2 Estados Vacíos (Empty States)

| Vista | Condición | Renderizado Visual | Llamada a la Acción (CTA) |
| --- | --- | --- | --- |
| `/today` | Usuario nuevo sin hábitos | Ilustración + "Empieza con una meta pequeña hoy." | Botón primario `+ Crear mi primer hábito` |
| `/today` | Día libre (sin programación) | Ícono de descanso + "¡Todo listo por hoy!" | Enlace `"Ver mi calendario semanal"` |
| `/habits` | Sin hábitos en la categoría | Texto: "No hay hábitos en esta categoría." | Botón `"Limpiar filtros"` |
| `/stats` | Historial insuficiente | Gráfico plano + "Completa hábitos unos días para ver gráficos." | Botón `"Ir a mis hábitos de hoy"` |

### 4.3 Estados de Error y Validación

* **Validación Inline (Zod + React Hook Form):** Los errores de formulario se muestran inmediatamente debajo del campo en rojo suave (`text-red-500 text-sm`) al perder el foco (`onBlur`) o intentar enviar.
* **Errores Globales / Servidor:** Mensaje en Toast rojo flotante en la esquina inferior derecha con texto descriptivo y amigable (sin trazas técnicas de base de datos).

---

## 5. Puntos de Salida y Bucle de Retorno (Success & Loopback)

### 5.1 Confirmaciones de Éxito

* **Creación / Edición de Hábito:** Cierre automático del modal + Toast verde *"Hábito guardado correctamente"* + resaltado temporal de la nueva tarjeta en la lista.
* **Check-in Diario:** Animación sutil de pulso en el contador de racha 🔥 + barra de progreso diario incrementada.
* **Cierre de Sesión:** Limpieza inmediata de cookies/estado local y redirección limpia a `/login` deshabilitando el historial del navegador hacia rutas privadas.

### 5.2 Bucle de Retorno Diario (Loopback)

* **Notificación con Enlace Profundo (Deep Link):** Los recordatorios enviados vía Web Push o Email contienen el enlace directo a `/today`, permitiendo abrir la app y completar el hábito con 1 solo toque.
* **Reinicio de Medianoche (00:00 local):** En el corte de medianoche de la zona horaria del usuario, las tarjetas de la vista `/today` pasan a estado pendiente para la nueva fecha, manteniendo las rachas listas para la siguiente marca.