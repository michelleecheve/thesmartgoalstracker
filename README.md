# Metas SMART

Aplicación web para convertir metas a largo plazo en **hábitos pequeños, medibles y constantes**. Diseñada para iPhone (instalable como app) y funcional en computadora, con todos los datos guardados de forma privada en Supabase.

- **Metas SMART** guiadas paso a paso (Específica, Medible, Alcanzable, Relevante, Temporal), con indicador numérico opcional.
- **Hábitos recurrentes** asociados a cada meta: todos los días, días de la semana o cada N días.
- **Inicio** como agenda diaria con vistas Día, Semana y Mes para marcar hábitos.
- **Estadísticas** reales: cumplimiento, constancia en el tiempo, racha, progreso y fechas límite.
- **Tablero de visión** con reflexiones escritas y un collage privado de imágenes.

---

## Tecnologías

React 19 + TypeScript + Vite · Tailwind CSS 4 + componentes estilo shadcn/ui (Radix) · Lucide · React Router · TanStack Query · React Hook Form + Zod · date-fns (español) · Recharts · Supabase (PostgreSQL, Auth, Storage) · Vitest + Testing Library · PGlite (pruebas de base de datos) · vite-plugin-pwa.

## Requisitos

- Node.js **20.19 o superior** y npm.
- Una cuenta gratuita en [Supabase](https://supabase.com).

---

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. En Supabase, crea un proyecto nuevo (guarda la contraseña de la base de datos en un lugar seguro).
2. Abre **SQL Editor → New query** y ejecuta, **en este orden**, el contenido de cada archivo de `supabase/migrations/`:
   1. `20261021000000_esquema_inicial.sql` — tablas, políticas RLS, índices y bucket privado de imágenes.
   2. `20261021010000_funciones_metas_habitos.sql` — funciones atómicas para estados, pausas y frecuencias.
3. En **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** agrega `http://localhost:5173/**`
4. (Opcional) En **Authentication → Sign In / Providers → Email**, desactiva **Confirm email** si no quieres confirmar el correo al registrarte mientras desarrollas.

> Si prefieres la CLI de Supabase: `supabase link --project-ref <tu-proyecto>` y luego `supabase db push`.

### 3. Variables de entorno

Copia `.env.example` como `.env.local` y completa los valores de **Project Settings → API**:

```bash
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica   # anon key o publishable key (sb_publishable_…)
```

> **Nunca** pongas la `service_role` / `secret key` en el frontend. La seguridad la garantizan las políticas RLS de la base de datos; la clave pública solo identifica el proyecto.

### 4. Ejecutar

```bash
npm run dev
```

Abre <http://localhost:5173>. Para probar en tu iPhone, conéctalo a la misma red Wi-Fi y abre la dirección **Network** que muestra la terminal (por ejemplo `http://192.168.0.10:5173`).

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Revisa tipos y genera la versión de producción en `dist/` (incluye el service worker). |
| `npm run preview` | Sirve `dist/` localmente para probar la versión de producción y la PWA. |
| `npm test` | Todas las pruebas (lógica, componentes y base de datos). |
| `npm run test:db` | Solo las pruebas de base de datos: aplica las migraciones en un Postgres local (PGlite) y verifica RLS, privacidad entre usuarios, restricciones y funciones. |
| `npm run typecheck` | Revisión de tipos de TypeScript. |

---

## Publicar la aplicación

La app es un sitio estático (carpeta `dist/`). Cualquier hosting con soporte para SPA funciona; ya vienen configurados **Vercel** (`vercel.json`) y **Netlify** (`public/_redirects` y `public/_headers`).

### Vercel

1. Sube el repositorio a GitHub e impórtalo en [vercel.com](https://vercel.com) (detecta Vite automáticamente: build `npm run build`, salida `dist`).
2. En **Settings → Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Despliega.

### Netlify

1. Importa el repositorio en [netlify.com](https://netlify.com). Build: `npm run build`; carpeta de publicación: `dist`.
2. Agrega las mismas variables de entorno y despliega.

### Después de publicar (importante)

En Supabase → **Authentication → URL Configuration**:

- Cambia **Site URL** a tu dominio (por ejemplo `https://metas.vercel.app`).
- Agrega a **Redirect URLs**: `https://metas.vercel.app/**` (conserva también la de localhost si seguirás desarrollando).

Sin esto, el enlace de **recuperar contraseña** no funcionará en producción.

### Instalar en el iPhone

1. Abre la URL publicada en **Safari** (requiere HTTPS, que Vercel/Netlify dan automáticamente).
2. Toca **Compartir → Agregar a inicio**.
3. La app se abre a pantalla completa, con su ícono y sin barra del navegador.

La app guarda en caché sus archivos (abre más rápido y se actualiza sola), pero **necesita conexión a internet** para leer y guardar tus datos. No funciona sin conexión.

---

## Arquitectura

```
src/
  app/            Router, rutas, sesión (AuthProvider, protección de rutas), React Query
  components/
    ui/           Componentes base (botón, tarjeta, diálogos, hoja de acciones, etc.)
    layout/       Marco móvil (máx. 428px), navegación inferior, encabezados
    common/       Estados vacíos, carga, errores, anillo de progreso, confirmaciones
    forms/        Campos con validación accesible
  domain/         Lógica de negocio pura (sin React ni Supabase) — probada a fondo
    schedule.ts   Programación recurrente y versiones históricas
    progress.ts   Avance, constancia y estados de cada ocurrencia
    agenda.ts     Agenda diaria e indicadores del calendario
    stats.ts      Periodos, series, ranking, racha y fechas límite
  features/       Componentes y hooks por funcionalidad (goals, habits, agenda, stats, vision)
  services/       Único punto de acceso a Supabase + traducción de errores al español
  pages/          Una pantalla por ruta (carga diferida)
  lib/            Fechas locales, imágenes, utilidades
  types/          Tipos del esquema de la base de datos
supabase/
  migrations/     SQL del esquema, RLS, Storage y funciones
  tests/          Pruebas de la base de datos con PGlite
```

**Inicio, Mis metas y Estadísticas usan exactamente las mismas funciones** de `src/domain/`, por lo que los números siempre coinciden.

### Base de datos

| Tabla | Propósito |
|---|---|
| `profiles` | Nombre del usuario (se crea automáticamente al registrarse). |
| `goals` | Metas SMART, estado, fecha límite e indicador numérico opcional. |
| `goal_pauses` / `habit_pauses` | Periodos en pausa (o archivados/completados) que no penalizan la constancia. |
| `habits` | Hábitos; cada uno pertenece a una meta. |
| `habit_schedule_versions` | Versiones de frecuencia con fecha de vigencia (historial). |
| `habit_completions` | Un registro por hábito completado y día (único). |
| `vision_board_entries` | Respuestas a las preguntas de reflexión. |
| `vision_board_images` | Imágenes del collage (archivo en Storage, proporciones, orden, meta asociada). |

- **RLS en todas las tablas:** cada usuario solo puede ver y modificar sus propios datos. Claves foráneas compuestas impiden asociar un hábito a la meta de otro usuario.
- **Storage:** bucket privado `vision-board` (máx. 10 MB; JPG, PNG, WebP, GIF); cada usuario solo accede a su carpeta `{user_id}/`. Las imágenes se muestran con enlaces firmados temporales.
- **Archivar** no borra nada. **Eliminar** es definitivo (con confirmación) y borra en cascada hábitos y registros; las imágenes asociadas a una meta eliminada se conservan sin asociación.

### Reglas de cálculo

- **Fechas locales:** los días se manejan como `yyyy-MM-dd` en la zona horaria del usuario, sin horas, para evitar errores por zona horaria o cambio de horario.
- **Las ocurrencias no se guardan:** se calculan para el rango que se consulta. Solo se guardan los cumplimientos.
- **Historial de frecuencias:** un cambio de frecuencia aplica desde hoy; los días anteriores conservan la programación que tenían.
- **Pendiente ≠ incumplido:** los días futuros nunca cuentan, y un hábito de hoy solo cuenta cuando se completa.
- **Pausas:** pausar un hábito o una meta (o completarla/archivarla) abre un periodo de pausa que no penaliza. Al reanudar o restaurar, se cierra.
- **Metas completadas y archivadas:** aportan su historial hasta el día en que cambiaron de estado.
- **Avance vs. constancia:** el avance hacia la meta (valor actual / objetivo) y la constancia de hábitos se calculan por separado. Una meta nunca se completa sola.
- **Racha:** días seguidos completando todos los hábitos programados; los días sin hábitos o en pausa no la rompen.

---

## Pruebas

```bash
npm test
```

Cubren: programación recurrente y versiones históricas (incluido el cambio lunes/miércoles → martes/jueves), pausas, cambios de horario, cambios de mes y año, constancia y estadísticas, agenda Día/Semana/Mes, marcar/desmarcar con reversión ante errores, formularios y asistente SMART, protección de rutas, guardado automático, validación y subida de imágenes, y — contra el SQL real — RLS, privacidad entre usuarios, restricciones de integridad y funciones de la base de datos.

## Diseño

- Formato de app móvil: ancho completo en iPhone, centrado a 428px en computadora; áreas seguras de iOS; `100dvh`; elementos táctiles de al menos 44×44px.
- Paleta cálida (fondo crema, texto gris oscuro, acento salvia) definida como variables en `src/styles/index.css`. El **modo oscuro** está preparado: basta con agregar la clase `dark` a `<html>` (falta un selector en Configuración).
