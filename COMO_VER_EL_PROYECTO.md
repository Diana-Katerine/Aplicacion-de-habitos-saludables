# Guía para Poner en Marcha el Proyecto en Local

Este documento detalla los pasos para instalar, configurar y levantar la aplicación **Impulso Diario** (Aplicación de Hábitos Saludables) en tu ordenador local con Windows.

---

## 1. Tecnologías del Proyecto

- **Entorno de Ejecución:** Node.js (v18 o superior, verificado en v26.x).
- **Gestor de Paquetes:** `npm` (o `bun`).
- **Backend:** Express integrado con Vite middleware (`tsx server.ts`).
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS.
- **Gráficos y Animaciones:** Recharts, D3, Lucide Icons, Canvas Confetti.
- **Integraciones de IA:** Google Gemini API (`@google/genai`).

---

## 2. Requisitos Previos e Instalación en Windows

### A. Node.js y npm
1. Verifica si tienes Node.js instalado abriendo PowerShell o CMD y ejecutando:
   ```powershell
   node -v
   npm -v
   ```
2. Si no lo tienes instalado, descárgalo e instálalo desde [nodejs.org](https://nodejs.org/) (versión LTS o Current).

> [!NOTE]
> En Windows PowerShell, la directiva de ejecución por defecto puede impedir correr scripts como `npm.ps1`. Si ejecutas comandos desde la consola estándar de Windows (CMD) o usando `npm.cmd`, no tendrás ningún problema.

---

## 3. Configuración de Variables de Entorno

El proyecto incluye un archivo plantilla llamado `.env.example`. Para que el servidor y los módulos funcionen adecuadamente:

1. Crea una copia de `.env.example` con el nombre `.env` dentro de la carpeta del proyecto (`Aplicacion-de-habitos-saludables`):
   ```powershell
   copy .env.example .env
   ```
2. Contenido del archivo `.env`:
   ```env
   # Clave requerida para funciones de IA (pronóstico de hábitos y sugerencias)
   GEMINI_API_KEY="TU_API_KEY_AQUI"

   # URL de alojamiento local
   APP_URL="http://localhost:3000"

   # Puerto (opcional, por defecto toma 3000)
   PORT=3000
   ```
> [!IMPORTANT]
> **Sobre la API Key de Gemini:** La aplicación web arranca y permite usar la interfaz y el gestor de hábitos sin necesidad de la API Key. No obstante, las funciones inteligentes de pronóstico semanal (`/api/forecast/momentum`) y recomendaciones con IA requieren una clave válida generada en [Google AI Studio](https://aistudio.google.com/).

---

## 4. Instalación de Dependencias

Ingresa a la carpeta del proyecto y ejecuta el siguiente comando:

```cmd
cd Aplicacion-de-habitos-saludables
npm install --legacy-peer-deps
```

*(Nota técnica: El paquete `react-is` fue añadido para asegurar compatibilidad total con el renderizado de gráficos de `recharts` bajo React 19).*

---

## 5. Arranque del Servidor

Para iniciar la aplicación en modo desarrollo (servidor Express + Vite en tiempo real):

```cmd
npm run dev
```

Verás una salida similar a:
```text
> impulso-diario@0.0.0 dev
> tsx server.ts

Impulso Diario server listening on http://0.0.0.0:3000
```

---

## 6. Acceso desde el Navegador

Una vez que el servidor esté en marcha, abre tu navegador web favorito (Chrome, Edge, Firefox, etc.) e ingresa a:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 7. Problemas Frecuentes y Soluciones

### Error: `npm : No se puede cargar el archivo ... npm.ps1 porque la ejecución de scripts está deshabilitada`
- **Causa:** Política de ejecución restrictiva de PowerShell en Windows.
- **Solución:**
  1. Usa la consola tradicional de Windows (**Símbolo del sistema / CMD**).
  2. O en PowerShell invoca directamente `npm.cmd`:
     ```powershell
     npm.cmd install --legacy-peer-deps
     npm.cmd run dev
     ```

### Error: `ERESOLVE could not resolve` al ejecutar `npm install`
- **Causa:** Conflicto de dependencias de pares entre `vite` y `esbuild`.
- **Solución:** Agrega siempre la bandera `--legacy-peer-deps`:
  ```cmd
  npm install --legacy-peer-deps
  ```

### Error: `Failed to resolve import "react-is" from recharts`
- **Causa:** Subdependencia requerida por la biblioteca de gráficos `recharts` en React 19.
- **Solución:** Ya se encuentra instalada en el proyecto. Si instalas en un entorno limpio:
  ```cmd
  npm install react-is --legacy-peer-deps
  ```

### Error: `Port 3000 is already in use` (EADDRINUSE)
- **Causa:** Ya hay una instancia del servidor ejecutándose en el puerto 3000.
- **Solución:** Finaliza el proceso anterior con `Ctrl + C` en la terminal donde esté corriendo, o en PowerShell:
  ```powershell
  Get-Process -Name node | Stop-Process -Force
  ```
