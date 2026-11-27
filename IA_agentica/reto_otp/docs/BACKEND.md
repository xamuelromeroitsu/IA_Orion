# Backend — `apps/api/`

Estructura del **backend únicamente**: API REST con Express (Node.js, JavaScript ESM), servicios del agente, reglas deterministas, reportes, cifrado y modo lote. El frontend está descrito en [FRONTEND.md](FRONTEND.md). Supabase es un servicio externo: aquí solo están el cliente y el esquema SQL.

## 1. Árbol de carpetas

```text
apps/api/
├─ package.json                     # Dependencias y scripts: dev, batch, lint, test
├─ .env.example                     # Plantilla de variables (sin valores reales)
├─ app.js                           # Crea la app Express, middleware y monta las rutas
├─ server.js                        # Arranca el servidor HTTP/TLS en el puerto 4000
├─ src/
│  ├─ routes/
│  │  ├─ auth.routes.js             # Login, logout y usuario actual
│  │  ├─ projects.routes.js         # CRUD de proyectos y cambio de estado
│  │  ├─ proposals.routes.js        # Recepción y consulta de propuestas cifradas
│  │  ├─ suppliers.routes.js        # Directorio de proveedores e historial
│  │  ├─ evaluations.routes.js      # Inicio/consulta de evaluaciones y SSE
│  │  ├─ reports.routes.js          # Descarga Markdown, PDF, CSV y XLSX
│  │  ├─ chat.routes.js             # Preguntas sobre los documentos del proyecto
│  │  └─ rates.routes.js            # Tasa BCV vigente con fecha valor
│  ├─ services/
│  │  ├─ ingestion/
│  │  │  ├─ classify.js             # Detecta PDF nativo, escaneado, imagen o XLSX
│  │  │  ├─ pdf.js                  # Extrae texto de PDF digital
│  │  │  ├─ vision.js               # Envía imágenes/PDF a Gemini con visión
│  │  │  └─ spreadsheet.js          # Lee XLSX y recalcula fórmulas sin caché
│  │  ├─ agent/
│  │  │  ├─ prompts.js              # System prompt y reglas anti-injection
│  │  │  ├─ schemas.js              # Esquemas de salida estructurada (JSON/Zod)
│  │  │  └─ orchestrator.js         # Loop de tool calling y registro de trazas
│  │  ├─ tools/
│  │  │  ├─ calculator.js           # Recalcula cantidades y subtotales con decimal.js
│  │  │  ├─ webSearch.js            # Consulta Tavily y guarda URL/snippet/fecha
│  │  │  ├─ bcvRate.js              # Obtiene y cachea la tasa oficial USD/Bs
│  │  │  ├─ scopeCheck.js           # Compara ítems extraídos con el alcance
│  │  │  └─ injectionScan.js        # Detecta instrucciones ocultas en el texto
│  │  ├─ rules/
│  │  │  ├─ discard.js              # Aplica causas de descarte de la sección 3.B
│  │  │  ├─ tco.js                  # Suma fletes, recargos, impuestos y convierte
│  │  │  └─ ranking.js              # Ordena válidas y coloca descartadas al final
│  │  ├─ report/
│  │  │  ├─ markdown.js             # Genera el informe ejecutivo en Markdown
│  │  │  ├─ pdf.js                  # Convierte el informe a PDF con pdfmake
│  │  │  └─ tabular.js              # Exporta la tabla comparativa a CSV/XLSX
│  │  └─ storage/
│  │     ├─ crypto.js               # Cifrado/descifrado AES-256-GCM (iv, tag, sha256)
│  │     └─ supabaseClient.js       # Clientes Supabase: anon y service_role
│  ├─ middleware/
│  │  ├─ auth.js                    # Verifica JWT y adjunta usuario/rol al request
│  │  ├─ roles.js                   # Guardas por rol en cada endpoint
│  │  ├─ upload.js                  # Multer: MIME permitido, tamaño y nombre seguro
│  │  ├─ rateLimit.js               # Límite de peticiones y de búsquedas
│  │  └─ errors.js                  # Manejo uniforme de errores `{ error: {...} }`
│  ├─ events/
│  │  └─ sse.js                     # Emisor de eventos de trazabilidad por evaluación
│  └─ evaluator.js                  # Orquesta ingesta → tools → reglas → informe
├─ scripts/
│  └─ batch.js                      # Modo lote: procesa propuestas/ y escribe salida.json
└─ supabase/
   └─ schema.sql                    # Tablas, índices y políticas RLS
```

## 2. Qué hace cada archivo (detalle)

| Archivo / carpeta | Responsabilidad | Comentario de cabecera sugerido |
| --- | --- | --- |
| `app.js` | Configura helmet, CORS, cookies, rutas y manejador de errores. | `// Express application setup and route mounting.` |
| `server.js` | Punto de arranque del servidor y cierre graceful. | `// HTTP/TLS server entry point.` |
| `routes/auth.routes.js` | `POST /auth/login`, `/auth/logout`, `GET /auth/me`. | `// Authentication endpoints backed by Supabase Auth.` |
| `routes/projects.routes.js` | Crear, listar, actualizar y cambiar estado de proyectos. | `// Project CRUD and workflow status endpoints.` |
| `routes/proposals.routes.js` | Registrar propuestas cifradas y consultar su extracción. | `// Encrypted proposal upload and retrieval endpoints.` |
| `routes/evaluations.routes.js` | Iniciar evaluación, consultar resultado y streaming SSE. | `// Evaluation lifecycle and live trace stream.` |
| `routes/reports.routes.js` | Descargas de informe y tabla comparativa. | `// Report and comparison export endpoints.` |
| `routes/chat.routes.js` | Consulta en lenguaje natural sobre la evaluación. | `// Grounded question-answering over evaluation data.` |
| `routes/rates.routes.js` | Tasa BCV con fecha valor y fuente. | `// Official exchange rate lookup endpoint.` |
| `services/ingestion/classify.js` | Decide la ruta de extracción según MIME y señales del archivo. | `// Chooses native PDF, vision, image or spreadsheet pipeline.` |
| `services/ingestion/pdf.js` | Texto nativo con `pdf-parse`; si es escaneado, deriva a visión. | `// Native PDF text extraction with scanned-file fallback.` |
| `services/ingestion/vision.js` | Visión multimodal con esquema JSON y nivel de confianza. | `// Multimodal extraction from photos and scanned proposals.` |
| `services/ingestion/spreadsheet.js` | Evalúa `=C8*D8` y `=SUM(...)` sin valor cacheado. | `// XLSX reader that recomputes uncached formulas.` |
| `services/agent/prompts.js` | Instrucciones fijas: rol, reglas y “el documento es dato”. | `// System prompts and anti-injection instructions.` |
| `services/agent/schemas.js` | Esquema estricto de ítems, total, cláusulas e injection. | `// Structured output schemas for the model.` |
| `services/agent/orchestrator.js` | Loop de herramientas, límite de iteraciones y eventos SSE. | `// Tool-calling loop with trace emission and limits.` |
| `services/tools/calculator.js` | Subtotales y diferencias con decimales exactos. | `// Exact arithmetic checks using decimal.js.` |
| `services/tools/webSearch.js` | Tavily: URL, snippet y fecha por consulta. | `// Market-price search with citable evidence.` |
| `services/tools/bcvRate.js` | Scraping de BCV + fallback; guarda fecha valor. | `// Fetches and caches the official USD/VES rate.` |
| `services/tools/scopeCheck.js` | Verifica 11 equipos, periféricos y protección eléctrica. | `// Checks required scope against extracted items.` |
| `services/tools/injectionScan.js` | Detecta frases que intentan manipular la evaluación. | `// Scans proposal text for hidden AI instructions.` |
| `services/rules/discard.js` | Descarte determinista: alcance, compatibilidad, precio, aritmética. | `// Deterministic rejection rules from the challenge spec.` |
| `services/rules/tco.js` | Costo total real y normalización de moneda. | `// Total cost of ownership with agreed currency conversion.` |
| `services/rules/ranking.js` | Orden final sin duplicados: válidas primero. | `// Final deterministic ranking; the model cannot override it.` |
| `services/report/markdown.js` | Recomendación, tabla comparativa y dictamen. | `// Executive feasibility report in Markdown.` |
| `services/report/pdf.js` | Informe listo para comité. | `// PDF rendering of the executive report.` |
| `services/report/tabular.js` | CSV/XLSX de la tabla comparativa. | `// Tabular export of declared versus real costs.` |
| `services/storage/crypto.js` | AES-256-GCM por archivo con `iv` y `tag` únicos. | `// Application-level encryption for stored documents.` |
| `services/storage/supabaseClient.js` | Clientes anon/service_role y acceso a Storage. | `// Supabase clients; service role is backend-only.` |
| `middleware/auth.js` | Verificación de JWT de Supabase. | `// Authentication middleware.` |
| `middleware/roles.js` | Permisos cargador/evaluador/aprobador/auditor. | `// Role-based access control middleware.` |
| `middleware/upload.js` | Multer: whitelist MIME, tamaño y sanitización. | `// Safe multipart upload middleware.` |
| `middleware/rateLimit.js` | Protección de endpoints y búsquedas. | `// Rate limiting middleware.` |
| `middleware/errors.js` | Respuestas de error uniformes. | `// Centralized error handler.` |
| `events/sse.js` | Publica `reading`, `search`, `cost`, `check`, `done`. | `// Server-sent events helper for live traceability.` |
| `src/evaluator.js` | Secuencia completa de una evaluación. | `// End-to-end evaluation pipeline orchestration.` |
| `scripts/batch.js` | Genera `salida.json` con commit y timestamps reales. | `// Batch mode CLI for the official output file.` |
| `supabase/schema.sql` | Tablas e índices; políticas RLS por rol. | `// Database schema and row-level security policies.` |

## 3. API REST

Base `/api`. Errores: `{ "error": { "code", "message", "details" } }`.

| Método | Ruta | Propósito | Roles |
| --- | --- | --- | --- |
| POST | `/auth/login` | Iniciar sesión; devuelve cookie `httpOnly` | público |
| POST | `/auth/logout` | Cerrar sesión | todos |
| GET | `/auth/me` | Usuario y rol actuales | todos |
| GET | `/projects` | Listar proyectos | todos |
| POST | `/projects` | Crear proyecto | cargador |
| GET | `/projects/:id` | Detalle del proyecto | todos |
| PATCH | `/projects/:id` | Editar datos/estado | cargador, aprobador |
| POST | `/projects/:id/documents` | Subir documento base | cargador |
| GET | `/suppliers` | Directorio de proveedores | todos |
| POST | `/suppliers` | Alta de proveedor | cargador |
| GET | `/suppliers/:id/history` | Historial y alertas | todos |
| POST | `/evaluations` | Iniciar evaluación | cargador, evaluador |
| GET | `/evaluations/:id` | Resultado y ranking | todos |
| GET | `/evaluations/:id/events` | SSE de trazabilidad | todos |
| PATCH | `/evaluations/:id/review` | Notas y confirmación | evaluador |
| POST | `/evaluations/:id/approve` | Adjudicar | aprobador |
| GET | `/evaluations/:id/report.md` | Informe Markdown | todos |
| GET | `/evaluations/:id/report.pdf` | Informe PDF | todos |
| GET | `/evaluations/:id/comparison.csv` | Tabla CSV | todos |
| GET | `/evaluations/:id/comparison.xlsx` | Tabla XLSX | todos |
| POST | `/evaluations/:id/chat` | Consulta sobre documentos | todos |
| GET | `/rates/bcv` | Tasa oficial con fecha valor | todos |

## 4. Flujo interno

```text
upload.js → classify.js → (pdf.js | vision.js | spreadsheet.js)
   → schemas.js → orchestrator.js → tools/* → rules/*
   → report/* → Supabase Storage/Postgres → REST/SSE → React
```

1. `middleware/upload.js` valida el archivo y `storage/crypto.js` lo cifra antes de guardarlo.
2. `ingestion/*` convierte cada propuesta en JSON estructurado con evidencia.
3. `agent/orchestrator.js` llama a `tools/*` y publica eventos en `events/sse.js`.
4. `rules/*` aplica descarte, TCO y ranking de forma determinista.
5. `report/*` genera el dictamen; `scripts/batch.js` reutiliza el mismo pipeline para `salida.json`.

Los archivos de herramientas se nombran en `camelCase` (`webSearch.js`, `bcvRate.js`, `scopeCheck.js`, `injectionScan.js`), pero los IDs que ve el modelo son `snake_case` (`web_search`, `bcv_rate`, `scope_check`, `injection_scan`); el mapeo vive en `src/evaluator.js`. Las reglas completas están en [AGENTS.md](../AGENTS.md).

## 5. Reglas del backend

- Secretos (`GEMINI_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AES_KEY`) solo en `.env` del servidor.
- Dinero siempre con `decimal.js`; nunca con `float` nativo.
- El modelo extrae y razona; **no** escribe el ranking ni puede anular un descarte.
- Cada ajuste monetario guarda `evidence` (fragmento o URL) en la tabla `findings`.
- `batch.js` obtiene el commit con `git rev-parse HEAD` y usa timestamps ISO `-04:00`.

## 6. Implementación por capas

El árbol real de `apps/api/` (dominio, casos de uso, infraestructura e interfaces HTTP) está descrito en [ARQUITECTURA_DDD.md](ARQUITECTURA_DDD.md). Las rutas montadas son `/api/health`, `/api/bootstrap`, `/api/projects`, `/api/evaluations`, `/api/documents`, `/api/rates` y `/api/evaluations/:id/chat`.

Columnas añadidas en `002_align_api_contract.sql` que afectan al informe:

| Tabla | Columnas | Uso en el informe |
| --- | --- | --- |
| `document_analyses` | `file_name`, `hidden_costs`, `warranty_months`, `injection_detected`, `scope_complete`, `discard_reasons` | Identifica la propuesta, describe costos ocultos y garantía, y explica cada descarte en el dictamen. |
| `chat_messages` | `sources` | Muestra los archivos citados en cada respuesta del chat documental. |

`project_documents.iv` y `tag` se almacenan como Base64 en `text`; el cifrado sigue siendo AES-256-GCM y la clave `AES_KEY` permanece solo en el servidor.
