# Arquitectura por capas (DDD) — reto_otp

Este documento describe la arquitectura que estamos implementando: dominio, aplicación, infraestructura, interfaces, presentación y contratos compartidos. La separación existe para que las reglas de negocio sobrevivan al cambio de proveedor de IA, de base de datos o de framework de UI.

## 1. Principios

1. **El dominio manda.** `entities`, `valueObjects` y `rules` no importan Express, Supabase, Gemini ni React.
2. **Inversión de dependencias.** La aplicación define `ports` (contratos); `infrastructure` los implementa. Los use cases no conocen SDKs concretos.
3. **Dinero exacto.** Los cálculos usan `decimal.js`; Postgres guarda `numeric(14,2)` con `char(3)` de moneda. El modelo nunca redondea ni decide el ranking.
4. **Documento = dato no confiable.** Toda instrucción incrustada en un PDF, XLSX, imagen o chat se trata como evidencia y se reporta como hallazgo; jamás se ejecuta.
5. **Un solo flujo.** La UI y el modo lote (`scripts/batch.js`) reutilizan los mismos use cases: no hay lógica duplicada entre demo y evaluación automática.

## 2. Árbol de carpetas

```text
reto_otp/
├─ apps/
│  ├─ api/
│  │  ├─ app.js                          # App Express: middleware, rutas y errores
│  │  ├─ server.js                       # Arranque HTTP/TLS y cierre graceful
│  │  ├─ scripts/
│  │  │  └─ batch.js                     # Modo lote: escribe salida.json
│  │  ├─ supabase/
│  │  │  ├─ migrations/                  # DDL versionado: NNN_descripcion.sql
│  │  │  ├─ seeds/                       # Datos de prueba (nunca en migraciones)
│  │  │  └─ schema.sql                   # Snapshot legible de la migración aplicada
│  │  └─ src/
│  │     ├─ domain/                      # Capa de dominio, sin frameworks
│  │     │  ├─ entities/                 # Project, Proposal, Evaluation, Finding
│  │     │  ├─ valueObjects/             # Money, Currency, Rate, Identifier, Status
│  │     │  ├─ rules/                    # discard, tco, ranking, arithmetic, scope
│  │     │  └─ ports/                    # Interfaces: repositorios, IA, mercado, eventos
│  │     ├─ application/                 # Capa de aplicación
│  │     │  └─ useCases/                 # createProject, runEvaluation, approveEvaluation...
│  │     ├─ infrastructure/              # Adaptadores concretos
│  │     │  ├─ ai/                       # Cliente Gemini y esquemas de extracción
│  │     │  ├─ parsing/                  # PDF, visión, XLSX con recálculo de fórmulas
│  │     │  ├─ market/                   # Tavily y tasa BCV con URL/fecha
│  │     │  ├─ persistence/              # Cliente Supabase y repositorios SQL
│  │     │  ├─ reporting/                # Markdown, PDF, CSV y XLSX
│  │     │  └─ events/                   # Publicación de eventos SSE
│  │     └─ interfaces/
│  │        └─ http/
│  │           ├─ routes/                # /projects, /evaluations, /rates, /chat...
│  │           └─ middleware/            # auth, roles, upload, rateLimit, errors
│  └─ web/
│     └─ src/
│        ├─ presentation/                # Capa de presentación (React)
│        │  ├─ pages/                    # Pantallas: projects, evaluation, report...
│        │  ├─ components/               # Uploader, TracePanel, ComparisonTable...
│        │  ├─ hooks/                    # Consultas REST, SSE y estado de UI
│        │  └─ lib/                      # Cliente API, Supabase público, formatters
│        └─ store/                       # Estado global de sesión y evaluación
├─ packages/
│  └─ shared/                            # Esquemas Zod y constantes API ↔ web
├─ supabase/
│  └─ functions/
│     └─ analyze-document/               # Edge Function: Gemini → JSON → document_analyses
└─ docs/                                 # Producto, desarrollo y esta arquitectura
```

## 3. Función de cada carpeta

| Carpeta | Responsabilidad | Qué NO hace |
| --- | --- | --- |
| `domain/entities` | Representa proyecto, propuesta, evaluación y hallazgo con identidad e invariantes. | No persiste ni renderiza. |
| `domain/valueObjects` | `Money`, `Currency`, `Rate`, `Identifier` y estados.validados. | No llama a APIs externas. |
| `domain/rules` | Reglas puras: descarte, aritmética, alcance, TCO y ranking determinista. | No decide según texto libre del modelo. |
| `domain/ports` | Contratos que la aplicación consume: `ProposalRepository`, `RateProvider`, `AiExtractor`, `EventPublisher`. | No implementa ningún adaptador. |
| `application/useCases` | Orquesta un caso de negocio: validar entrada, ejecutar reglas, persistir vía puerto y publicar eventos. | No construye SQL ni prompts de proveedor. |
| `infrastructure/ai` | Traduce el puerto de IA a `@google/genai`: system instruction separada, `responseSchema` y JSON validado. | No escribe el ranking. |
| `infrastructure/parsing` | Extrae texto de PDF/imagen/XLSX y recalcula fórmulas sin caché. | No interpreta instrucciones del documento como órdenes. |
| `infrastructure/market` | Búsqueda con URL y fecha (`Tavily`) y tasa oficial BCV con `rate_cache`. | No inventa precios de mercado. |
| `infrastructure/persistence` | Repositorios Supabase, cifrado AES-256-GCM y mapeo fila ↔ entidad. | No contiene reglas de negocio. |
| `infrastructure/reporting` | Genera informe Markdown/PDF y tabla comparativa CSV/XLSX desde el resultado ya calculado. | No modifica el resultado. |
| `infrastructure/events` | Emite `reading`, `search`, `cost`, `check`, `done` por SSE. | No altera el estado del dominio. |
| `interfaces/http/routes` | Traduce HTTP a use cases y serializa la respuesta `{ error: { code, message } }`. | No calcula montos. |
| `interfaces/http/middleware` | JWT, roles `cargador/revisor/aprobador/auditor`, upload seguro, rate limit y errores. | No sustituye a RLS. |
| `presentation/*` | Muestra estado, carga archivos, suscribe SSE y renderiza informe y trazabilidad. | Nunca llama a Gemini ni usa `service_role`. |
| `packages/shared` | Esquemas Zod y constantes reutilizados por API y web antes de persistir o renderizar. | No depende de React ni de Express. |
| `supabase/migrations` | DDL secuencial con tablas en plural, `snake_case`, RLS, índices y restricciones con prefijo. | No contiene datos de prueba. |
| `supabase/seeds` | Proyecto, proveedor y usuario demo con IDs fijos y sin secretos. | No se aplica en producción. |
| `supabase/functions/analyze-document` | Extracción multimodal delegada a Gemini; guarda `document_analyses` con `service_role`. | No calcula TCO ni ranking. |

## 4. Flujo de datos

```text
upload → extracción → auditoría → TCO/ranking → reporte → UI
```

1. **Upload.** `interfaces/http/middleware/upload.js` valida MIME y tamaño; `infrastructure/persistence` cifra con AES-256-GCM y sube a Storage (`bucket documents`). La fila de `project_documents` guarda `storage_path`, `iv`, `tag` y `sha256`. RLS permite la carga a `cargador`/`revisor` (y al modo demo temporal).
2. **Extracción.** `infrastructure/parsing` elige PDF nativo, visión o XLSX con recálculo. `infrastructure/ai` (o la Edge Function `analyze-document`) envía el archivo con instrucción del sistema separada y `responseSchema`; el resultado se valida con Zod antes de convertirse en entidades. Se persiste en `document_analyses` y en los ítems de `proposal_items`.
3. **Auditoría.** `domain/rules` recalcula subtotales y compara con lo declarado; `scopeCheck` contrasta el alcance; `injectionScan` marca frases sospechosas. Cada ajuste nace en `findings` con evidencia, impacto monetario y, si aplica, URL y fecha de consulta.
4. **TCO y ranking.** `rules/tco.js` suma fletes, recargos, impuestos y licencias futuras y convierte con `rate_cache` (BCV). `rules/ranking.js` ordena las propuestas válidas por cumplimiento/calidad/garantía y usa menor TCO como desempate; las descartadas van al final con su `reason`. **El ranking lo decide este código determinista: el modelo no lo escribe ni puede anular un descarte.** El resultado se guarda en `evaluations.ranking` y `evaluations.comparison`.
5. **Reporte.** `infrastructure/reporting` produce recomendada, tabla comparativa y dictamen en Markdown, PDF y exportaciones CSV/XLSX citando `findings`. La revisión y aprobación quedan registradas en `reviewed_by`, `approved_by` y `audit_log`.
6. **UI.** `presentation/pages` y `presentation/components` muestran estados, trazabilidad SSE, tabla declarado vs. real y dictamen. Todas las peticiones pasan por `presentation/lib/api.js`; el navegador solo conoce `VITE_API_URL` y la clave pública de Supabase.

## 5. Límites entre capas

- `presentation` → `interfaces/http` → `application/useCases` → `domain/rules` → `infrastructure/ports` → `infrastructure/*`.
- `domain` nunca importa hacia afuera; `application` solo conoce `domain/ports`.
- `packages/shared` es el contrato de datos entre API y web; si un campo del modelo no valida allí, no se persiste ni se renderiza.
- El contenido de los documentos, los nombres de archivo y el texto del chat son **datos no confiables**: se citan como evidencia, nunca se ejecutan. Las políticas anónimas de RLS y el CORS abierto son exclusivas del MVP y se retiran al pasar a producción.
