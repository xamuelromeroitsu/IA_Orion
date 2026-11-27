# Frontend — `apps/web/`

Estructura del **frontend únicamente**. Todo está en JavaScript (ESM) con React + Vite. Los nombres de archivos y carpetas están en inglés; las notas explican qué hace cada uno. El backend está descrito en [BACKEND.md](BACKEND.md).

## 1. Árbol de carpetas

```text
apps/web/
├─ index.html                       # Documento HTML base donde React monta la app
├─ package.json                     # Dependencias y scripts: dev, build, lint, preview
├─ vite.config.js                   # Proxy /api hacia http://localhost:4000 y alias de imports
├─ public/
│  └─ favicon.svg                   # Icono de la pestaña del navegador
└─ src/
   ├─ main.jsx                      # Punto de entrada: crea el root de React
   ├─ App.jsx                       # Layout general, providers y rutas protegidas
   ├─ router.jsx                    # Definición de rutas y guard por rol
   ├─ styles/
   │  └─ index.css                  # Tailwind + estilos globales mínimos
   ├─ pages/
   │  ├─ LoginPage.jsx              # Inicio de sesión con Supabase Auth
   │  ├─ ProjectsPage.jsx           # Lista de proyectos y estados del proceso
   │  ├─ ProjectDetailPage.jsx      # Datos del proyecto, documento base y propuestas
   │  ├─ EvaluationPage.jsx         # Carga masiva, botón Evaluar y trazabilidad en vivo
   │  ├─ ReportPage.jsx             # Informe: recomendada, tabla comparativa y dictamen
   │  └─ SuppliersPage.jsx          # Directorio de proveedores y antecedentes
   ├─ components/
   │  ├─ AppShell.jsx               # Barra superior, menú lateral y outlet de rutas
   │  ├─ ProjectForm.jsx            # Proyecto: operación, sector y requerimientos
   │  ├─ Uploader.jsx               # Dropzone: 1–20 archivos PDF/JPG/PNG/XLSX
   │  ├─ TracePanel.jsx             # Panel SSE con eventos del agente en vivo
   │  ├─ ComparisonTable.jsx        # Declarado vs. real ajustado por propuesta
   │  ├─ Verdict.jsx                # Propuesta recomendada y dictamen de descarte
   │  ├─ ChatPanel.jsx              # Preguntas en lenguaje natural sobre el proyecto
   │  ├─ StatusBadge.jsx            # Etiqueta visual del estado recepción→adjudicado
   │  └─ SupplierHistory.jsx        # Participaciones y alertas de un proveedor
   ├─ hooks/
   │  ├─ useProjects.js             # Consulta/carga de projects con TanStack Query
   │  ├─ useEvaluation.js           # Arranca evaluación y maneja estados de la corrida
   │  ├─ useTraceStream.js          # Suscripción a /evaluations/:id/events (SSE)
   │  └─ useAuth.js                 # Usuario actual, rol y cierre de sesión
   ├─ lib/
   │  ├─ api.js                     # Cliente axios/fetch con cookie httpOnly y BASE_URL
   │  ├─ supabase.js                # Cliente público de Supabase (solo clave anon)
   │  ├─ sse.js                     # Helper para abrir/cerrar EventSource con reconexión
   │  ├─ formatters.js              # Moneda, fechas -04:00 y porcentajes
   │  └─ validation.js              # Validación Zod de formularios antes de enviar
   └─ store/
      ├─ session.js                 # Zustand: usuario, rol y token de sesión
      └─ evaluation.js              # Zustand: selección de archivos y eventos de traza
```

## 2. Qué hace cada archivo (detalle)

| Archivo / carpeta | Responsabilidad | Comentario de cabecera sugerido |
| --- | --- | --- |
| `main.jsx` | Monta `<App />` en `#root` e importa estilos. | `// Application entry point: mounts React into the DOM.` |
| `App.jsx` | Envuelve la app con QueryClient y providers de Zustand; define el layout. | `// Root component: global providers and layout shell.` |
| `router.jsx` | Rutas `/login`, `/projects`, `/projects/:id`, `/evaluations/:id`, `/report/:id`, `/suppliers`. | `// Route table with role-based guards.` |
| `pages/LoginPage.jsx` | Formulario de acceso; llama a `POST /api/auth/login`. | `// Login screen using Supabase Auth through the API.` |
| `pages/ProjectsPage.jsx` | Lista de proyectos, estado y acceso al detalle. | `// Project list with process status badges.` |
| `pages/ProjectDetailPage.jsx` | Muestra requerimientos, documentos y propuestas asociadas. | `// Project overview: documents and uploaded proposals.` |
| `pages/DocumentsPage.jsx` | Carga documentos y presenta los análisis y precios unitarios Excel. | `// Project document list and extracted analysis.` |
| `pages/EvaluationPage.jsx` | Orquesta carga masiva, botón de evaluación y panel de traza. | `// Evaluation workspace: upload, run and trace the agent.` |
| `pages/ReportPage.jsx` | Renderiza Markdown del informe y botones de exportación. | `// Financial feasibility report and export actions.` |
| `pages/SuppliersPage.jsx` | Alta y consulta del directorio de proveedores. | `// Supplier directory and previous participation alerts.` |
| `components/Uploader.jsx` | Valida tipos/tamaños y muestra progreso por archivo. | `// Dropzone for 1 to 20 proposal files with client validation.` |
| `components/AnalysisCard.jsx` | Muestra análisis y tabla de precios unitarios con comparación de presupuesto para Excel. | `// Extracted analysis and per-item spreadsheet prices.` |
| `components/TracePanel.jsx` | Muestra en vivo lectura, búsquedas, fletes y recálculos. | `// Live trace panel fed by server-sent events.` |
| `components/ComparisonTable.jsx` | Tabla declarado vs. ajustado; resalta discrepancias. | `// Declared amounts versus real adjusted costs.` |
| `components/Verdict.jsx` | Recomendación y motivos de descarte citados. | `// Final recommendation and rejection rationale.` |
| `components/ChatPanel.jsx` | Envía preguntas a `POST /api/evaluations/:id/chat`. | `// Natural-language questions grounded on project documents.` |
| `hooks/useTraceStream.js` | Abre `EventSource` y acumula eventos sin perder reconexión. | `// Hook that subscribes to the evaluation SSE stream.` |
| `lib/api.js` | Cliente HTTP único; agrega credenciales y maneja errores `{ error }`. | `// Shared API client with credentials and error mapping.` |
| `lib/supabase.js` | Cliente con `SUPABASE_ANON_KEY`; nunca contiene `service_role`. | `// Public Supabase client; secrets stay on the backend.` |
| `lib/formatters.js` | Formatea USD/Bs, ISO `-04:00` y porcentajes. | `// Currency, date and percentage display helpers.` |
| `lib/validation.js` | Esquemas Zod compartidos con `packages/shared`. | `// Client-side schemas reused from the shared package.` |
| `store/session.js` | Estado de usuario/rol para guardas de ruta y UI. | `// Zustand store for the authenticated session.` |
| `store/evaluation.js` | Archivos seleccionados, eventos y resultado parcial. | `// Zustand store for the current evaluation run.` |

## 3. Endpoints REST/SSE que consume

| Método | Ruta | Desde | Para qué |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | `LoginPage` | Obtener cookie `httpOnly` de sesión |
| POST | `/api/auth/logout` | `AppShell` | Cerrar sesión |
| GET | `/api/auth/me` | `useAuth` | Usuario y rol actuales |
| GET / POST | `/api/projects` | `ProjectsPage`, `ProjectForm` | Listar/crear proyectos con tipo de operación y sector |
| GET / PATCH | `/api/projects/:id` | `ProjectDetailPage` | Detalle y cambios de estado |
| POST | `/api/projects/:id/documents` | `ProjectForm` | Subir documento base |
| POST | `/api/evaluations` | `EvaluationPage` | Iniciar evaluación |
| GET | `/api/evaluations/:id/events` (SSE) | `useTraceStream` | Trazabilidad en vivo |
| GET | `/api/evaluations/:id` | `ReportPage` | Ranking, hallazgos y decisión |
| PATCH | `/api/evaluations/:id/review` | `ReportPage` | Notas y confirmación del evaluador |
| POST | `/api/evaluations/:id/approve` | `ReportPage` | Adjudicación del aprobador |
| GET | `/api/evaluations/:id/report.md` | `ReportPage` | Informe Markdown |
| GET | `/api/evaluations/:id/report.pdf` | `ReportPage` | Informe PDF |
| GET | `/api/evaluations/:id/comparison.csv` | `ReportPage` | Tabla comparativa CSV/XLSX |
| POST | `/api/evaluations/:id/chat` | `ChatPanel` | Consulta en lenguaje natural |
| GET / POST | `/api/suppliers` | `SuppliersPage` | Directorio y alta de proveedores |
| GET | `/api/suppliers/:id/history` | `SupplierHistory` | Antecedentes y alertas |

## 4. Reglas del frontend

1. El navegador **nunca** llama a Gemini, Tavily ni usa la clave `service_role` de Supabase.
2. Toda petición pasa por `lib/api.js`; no se repiten `fetch` sueltos en componentes.
3. Los montos se formatean en `formatters.js` y se calculan en el backend con `decimal.js`.
4. Cada pantalla respeta el rol: cargador crea/sube, evaluador revisa, aprobador adjudica, auditor solo lee.
5. Los nombres de archivos y carpetas van en inglés; las notas de esta guía están en español para entenderlos.
6. La creación del proyecto requiere indicar compra/venta y el sector o tipo de negocio; este contexto acompaña el análisis de documentos.
7. Los archivos XLSX se abren en línea con el MIME de Excel cuando el backend logra descifrarlos.
