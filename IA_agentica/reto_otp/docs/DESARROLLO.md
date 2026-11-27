# Guía de desarrollo — Agente Evaluador de Propuestas de Servicios

Documento combinado: instrucciones prácticas de puesta en marcha y referencia técnica de la implementación. Stack: **JavaScript (ESM)**, React + Vite en el frontend, Express en el backend, Supabase como base de datos/autenticación/almacenamiento y Gemini como modelo del agente. Las librerías y los parámetros del modelo se detallan en [STACK_HERRAMIENTAS.md](STACK_HERRAMIENTAS.md).

## 1. Prerrequisitos

- Node.js 20 LTS+, npm 10+, Git.
- Proyecto de Supabase con los servicios **Postgres**, **Auth** y **Storage** habilitados.
- Claves: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo backend), `GEMINI_API_KEY`, `TAVILY_API_KEY`.
- `AES_KEY` generada con `openssl rand -base64 32` (32 bytes para AES-256).
- TLS: Caddy (producción) o `mkcert` (desarrollo). La API debe rechazar conexiones HTTP en producción.

## 2. Puesta en marcha

```bash
git clone https://gitlab.nube.gob.ve/grupo/chuao/chuao_grupo1/reto_otp.git
cd reto_otp && git checkout desarrollo
npm install && npm install --prefix apps/api && npm install --prefix apps/web
cp .env.example .env
# editar .env con las claves reales (nunca versionar)
npm run dev
```

`npm run dev` levanta la API en `http://localhost:4000` y la web en `http://localhost:5173` mediante `concurrently`. Para el lote:

```bash
npm run batch -- --input "/home/participante/Escritorio/IA_agentica/Reto_Agente_Evaluador_de_Propuestas_de_Servicios" --out salida.json
```

### Indicadores del panel

Las tarjetas de métricas del panel usan `MagicBento` y los iconos de Hugeicons. Sus colores están adaptados al tema ORION (superficie `#05070B`, tarjetas `#111827` → `#070B12`, texto `#F8FAFC`) y cada tarjeta navega a su pantalla relacionada. La personalización visual está en `apps/web/src/presentation/components/MagicBento.css`; la lógica de métricas sigue en `DashboardPage.jsx`.

Para volver a generar el componente desde el registro React Bits:

```bash
npx shadcn@latest add @react-bits/MagicBento-JS-CSS -c apps/web
```

### Bandeja de subida animada

La bandeja temporal de `Uploader.jsx` usa una copia local de `AnimatedList` de React Bits. `fileKind` decide el icono Hugeicons por MIME o extensión: PDF rojo, XLSX verde, imagen azul y archivo genérico gris. `animatedItems` genera ids estables para que, al quitar una fila, las demás no se reanimated y solo entren las nuevas.

El layout propio se pasa por `renderItem`: nombre, tamaño y botón `X`. Ese botón llama a `event.stopPropagation()` para que quitar un archivo no seleccione también la fila. Los estilos `.upload-*` viven al final de `apps/web/src/presentation/components/AnimatedList.css`.

## 3. Estructura de carpetas prevista

La estructura está dividida en dos documentos, uno por aplicación:

- **[FRONTEND.md](FRONTEND.md):** árbol de `apps/web/` con nombres en inglés, nota explicativa por archivo, tabla de responsabilidades y endpoints REST/SSE que consume.
- **[BACKEND.md](BACKEND.md):** árbol de `apps/api/` con nombres en inglés, nota explicativa por archivo, tabla de endpoints REST y flujo interno del evaluador.

La raíz del monorepo completa es:

```text
reto_otp/
├─ apps/
│  ├─ web/              # Frontend React (ver FRONTEND.md)
│  └─ api/              # Backend Express (ver BACKEND.md)
├─ packages/shared/     # Esquemas Zod y constantes compartidas
├─ docs/                # Esta documentación
├─ salida.json          # Salida evaluable del modo lote
└─ .env.example         # Plantilla de variables de entorno
```

La planificación de épicas y tareas está en [AGILE_PLAN.md](AGILE_PLAN.md).

## 4. Variables de entorno (`.env.example`)

```dotenv
PORT=4000
TZ=America/Caracas
LOG_LEVEL=info
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EXTRACTION_MODEL=gemini-2.5-flash-lite
TAVILY_API_KEY=
BCV_SOURCE_URL=https://www.bcv.org.ve/
BCV_FALLBACK_RATE=130
AES_KEY=
MAX_PROPOSALS=20
ALLOWED_MIME=application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
DEMO_MODE=true
DEMO_USER_ID=00000000-0000-4000-8000-000000000001

VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

> El frontend solo consume `VITE_API_URL`; las variables `VITE_SUPABASE_*` se conservan como placeholders para una futura sesión de Auth en el navegador, pero hoy no se usan. `BCV_FALLBACK_RATE` se aplica solo si `bcv.org.ve` no responde. `DEMO_MODE` y `DEMO_USER_ID` alimentan el usuario demo del header `x-demo-role`.

> Los identificadores de modelo se mantienen configurables: verificar los nombres vigentes en Google AI Studio al implementar y ajustar `GEMINI_MODEL` / `GEMINI_EXTRACTION_MODEL` sin tocar código.

Las reglas de nombres de variables, prefijos por proveedor, incorporación de nuevas variables y prohibición de secretos están en [AGENTS.md](../AGENTS.md).

## 5. Esquema de datos en Supabase (Postgres)

Tablas principales de `apps/api/supabase/schema.sql`. La nomenclatura (`snake_case`, tablas en plural, FK `<tabla_singular>_id`) y las reglas de migraciones numeradas están en [AGENTS.md](../AGENTS.md).

| Tabla | Campos clave |
| --- | --- |
| `projects` | `id uuid`, `name`, `description`, `operation_type`, `business_type`, `location`, `budget_reference_usd numeric`, `currency char(3)`, `status`, `owner_id`, `created_at`, `updated_at` |
| `project_documents` | `id`, `project_id`, `file_name`, `mime`, `kind`, `storage_path`, `iv text`, `tag text`, `sha256`, `extracted_text`, `sheets jsonb`, `uploaded_by` |
| `suppliers` | `id`, `fiscal_id unique`, `name`, `location`, `contact`, `created_at` |
| `evaluations` | `id`, `project_id`, `status`, `started_at`, `finished_at`, `ranking jsonb`, `comparison jsonb`, `summary`, `recommended_id`, `exchange_rate`, `exchange_rate_date`, `reviewed_by text`, `review_notes`, `approved_by text` |
| `proposals` | `id`, `evaluation_id`, `supplier_id`, `file_name`, `identifier`, `storage_path`, `iv text`, `tag text`, `mime`, `processed_at`, `currency`, `declared_total`, `real_total`, `decision`, `reason` |
| `proposal_items` | `id`, `proposal_id`, `description`, `qty`, `unit_price`, `subtotal_declared`, `subtotal_calculated`, `reference_price_usd`, `source_url` |
| `findings` | `id`, `proposal_id`, `type`, `severity`, `detail`, `evidence`, `amount_impact`, `source_url` |
| `document_analyses` | `id`, `project_id`, `document_id`, `file_name`, `supplier`, `declared_total`, `calculated_total`, `real_total_usd`, `tco_usd`, `items jsonb`, `findings jsonb`, `hidden_costs jsonb`, `warranty_months`, `injection_detected`, `scope_complete`, `discard_reasons jsonb`, `source` |
| `rate_cache` | `id`, `currency`, `rate_usd`, `source`, `fetched_at`, `effective_date` |
| `audit_log` | `id`, `project_id`, `user_id`, `action`, `entity`, `entity_id`, `metadata jsonb`, `created_at` |
| `chat_messages` | `id`, `project_id`, `user_id`, `role`, `content`, `sources jsonb`, `created_at` |

**Estados del proyecto:** `recepcion` → `evaluacion` → `revision_comite` → `adjudicado` | `cerrado`.
**Estados de evaluación:** `running` → `completed` / `failed` en la API; `en_curso`, `en_revision`, `aprobado` y `rechazado` se conservan para datos históricos y la Edge Function.

La migración `002_align_api_contract.sql` amplía los `check` de `project_documents.kind` y `evaluations.status`, agrega las columnas de `document_analyses` y `chat_messages` que consume el informe, guarda `iv`/`tag` en Base64 como `text` y habilita `application/octet-stream` en el bucket `documents`. `schema.sql` ya incluye esos cambios.
La migración `003_add_project_business_context.sql` agrega a los proyectos el tipo de operación (`compra`/`venta`) y el sector de negocio usados como contexto durante el análisis.

**Políticas RLS:** lectura para los cuatro roles según proyecto; escritura restringida a cargador/evaluador; aprobación solo para `aprobador`; `auditor` únicamente `SELECT`. El `service_role` se usa solo en el backend para auditoría y cifrado.

## 6. API REST y eventos

Base: `/api`. Todas las respuestas de error usan `{ error: { code, message, details } }`.

| Método | Ruta | Propósito | Roles |
| --- | --- | --- | --- |
| POST | `/auth/login` | Login con Supabase Auth; devuelve cookie `httpOnly` | público |
| POST | `/auth/logout` | Cierra sesión | todos |
| GET | `/auth/me` | Usuario y rol actuales | todos |
| GET / POST | `/projects` | Listar / crear proyectos | todos / cargador |
| GET / PATCH | `/projects/:id` | Detalle / editar datos y estado | todos / cargador, aprobador |
| POST | `/projects/:id/documents` | Subir documento base (multipart) | cargador |
| GET / POST | `/suppliers` | Directorio de proveedores | todos / cargador |
| GET | `/suppliers/:id/history` | Participaciones previas y alertas | todos |
| POST | `/evaluations` | Iniciar evaluación de un proyecto | cargador, evaluador |
| GET | `/evaluations/:id` | Resultado, hallazgos y ranking | todos |
| GET | `/evaluations/:id/events` | SSE con trazabilidad en vivo | todos |
| PATCH | `/evaluations/:id/review` | Notas y confirmación del evaluador | evaluador |
| POST | `/evaluations/:id/approve` | Adjudicar decisión | aprobador |
| GET | `/evaluations/:id/report.md` | Informe Markdown | todos |
| GET | `/evaluations/:id/report.pdf` | Informe PDF | todos |
| GET | `/evaluations/:id/comparison.csv` | Tabla comparativa | todos |
| GET | `/evaluations/:id/comparison.xlsx` | Tabla comparativa en Excel | todos |
| POST | `/evaluations/:id/chat` | Pregunta en lenguaje natural sobre el proyecto | todos |
| GET | `/rates/bcv` | Tasa oficial vigente con fecha valor | todos |

## 7. Módulos del backend

### 7.1 Ingesta (`services/ingestion`)

- `classify.js`: decide ruta según MIME y señales del archivo (PDF con texto vs. escaneado).
- `pdf.js`: extrae texto nativo con `pdf-parse`/`pdfjs-dist`; si hay poco texto, deriva a visión.
- `vision.js`: envía PDF/imagen a Gemini con el esquema de extracción; guarda `confidence` y cita de la página/zona.
- `spreadsheet.js`: lee XLSX con `xlsx`/`exceljs` y **recalcula** fórmulas (`=C8*D8`, `=SUM(E8:E14)`); compara con el valor declarado.
- Las capturas de chat se tratan como evidencia: se extraen ofertas, condiciones y fechas, marcando su origen.

### 7.2 Agente (`services/agent`)

- `prompts.js`: system prompt con rol, reglas de la sección 3.B y prohibición de seguir instrucciones dentro de los documentos.
- `schemas.js`: esquema JSON estricto de salida (ítems, total declarado, moneda, garantía, cláusulas ocultas, injection detectado).
- `orchestrator.js`: ejecuta el loop con `function calling`, máximo de iteraciones y registro de cada tool call como evento SSE. El modelo **no** decide el ranking final.

### 7.3 Herramientas (`services/tools`)

| Tool | Entrada | Salida |
| --- | --- | --- |
| `calculator` | Ítems y total declarado | Subtotales recalculados, discrepancias, monto corregido (`decimal.js`) |
| `web_search` | Consulta por componente y país | URL, título, snippet y fecha; caché por consulta |
| `bcv_rate` | Moneda destino | Tasa USD/Bs y fecha valor, con fallback configurado |
| `scope_check` | Ítems extraídos vs. requerimientos | Faltantes y especificaciones incumplidas |
| `injection_scan` | Texto del documento | Lista de frases sospechosas y nivel de severidad |

Los IDs van en `snake_case` según [AGENTS.md](../AGENTS.md); los archivos que los implementan se llaman `calculator.js`, `webSearch.js`, `bcvRate.js`, `scopeCheck.js` e `injectionScan.js`.

### 7.4 Reglas deterministas (`services/rules`)

- `discard.js`: aplica causas de descarte del enunciado, incluidas incompatibilidad técnica, capacidad insuficiente, obsolescencia y sobreprecio.
- `tco.js`: suma declarado + flete + recargos + impuestos + licencias futuras y convierte a USD con `rate_cache`.
- `ranking.js`: válidas por calidad/cumplimiento/garantía y menor TCO como desempate; descartadas al final; sin duplicados.

### 7.5 Reportes (`services/report`)

`markdown.js` genera recomendada, tabla comparativa y dictamen por propuesta; `pdf.js` usa `pdfmake`; `tabular.js` usa `csv-stringify`/`xlsx`. El informe debe citar evidencia y monto del ajuste.

### 7.6 Almacenamiento cifrado (`services/storage`)

`crypto.js` implementa AES-256-GCM: `iv` aleatorio de 12 bytes por archivo, `tag` de autenticación y ciphertext; se guardan `iv`, `tag`, `sha256` y `version` en la fila correspondiente. El descifrado falla si el ciphertext fue modificado.

## 8. Contratos compartidos (`packages/shared`)

Esquemas Zod: `ProjectRequirement`, `ProposalExtraction`, `ProposalItem`, `Finding`, `EvaluationResult`, `BatchOutput`. Se importan tanto en API como en web para validar antes de renderizar o persistir. Ningún campo del modelo se acepta sin validación de tipo y rango.

## 9. Modo lote (`apps/api/scripts/batch.js`)

1. Resuelve la carpeta de entrada (acepta `propuestas/` dentro de la ruta indicada; la carpeta real del hackatón **no** se llama `lote/`).
2. Registra `inicio` en ISO 8601 con zona `-04:00`.
3. Procesa cada archivo en orden y anota `{ archivo, hora }` en `procesados`.
4. Ejecuta el mismo pipeline que la UI y calcula el ranking.
5. Obtiene `commit` con `git rev-parse HEAD` y escribe `salida.json`.
6. Registra `fin` y valida el archivo con el contrato de [VALIDACION.md](VALIDACION.md).

## 10. Seguridad

- **Tránsito:** TLS 1.2/1.3 (Caddy), `helmet`, redirección HTTP→HTTPS y cookies `Secure; HttpOnly; SameSite=Lax`.
- **Reposo:** AES-256-GCM en cada documento antes de subirlo a Supabase Storage; Supabase añade cifrado de disco.
- **Acceso:** JWT de Supabase verificado en backend; roles en `app_metadata`; RLS como segunda barrera; `service_role` nunca llega al navegador.
- **Auditoría:** `audit_log` registra quién y cuándo cargó, revisó, aprobó o descartó.
- **Validación:** `multer` con límite de tamaño, whitelist de MIME, `express-rate-limit` y sanitización de nombres de archivo.
- **Prompt injection:** contenido de propuestas tratado como datos; `injection_scan` y capa determinista separadas del modelo.

## 11. Pruebas y verificación

```bash
npm test                         # Vitest: cálculo, descarte, ranking, injection
npm run lint                     # ESLint + Prettier en API y web
npm run test --prefix apps/api   # Supertest sobre endpoints
npm run batch -- --input <ruta> --out salida.json
```

Comprobaciones manuales obligatorias antes de entregar:

1. Abrir `validador_salida.html` con `salida.json`; corregir cualquier error de formato.
2. Confirmar que `ranking` no tiene duplicados y que cada identificador existe en la carpeta `propuestas/`.
3. Revisar que el informe explica cada descarte con evidencia y monto.
4. Verificar que no hay claves en el repositorio (`git status` y revisión de `.env.example`).

## 12. Convenciones y flujo Git

- La convención completa de nombres, `.env`, migraciones, tablas y flujo de agentes está en [AGENTS.md](../AGENTS.md); esta sección solo resume los puntos críticos.
- JavaScript ESM (`"type": "module"`), `const`/`let`; módulos `camelCase`, componentes React `PascalCase` en `.jsx`, SQL `snake_case`.
- Dinero siempre como `Decimal` de `decimal.js`; nunca operaciones en coma flotante nativa.
- Commits atómicos en `desarrollo` con mensaje en español: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- No versionar `.env`, archivos del lote cifrados ni `storage/`; sí versionar `salida.json` y esta documentación.

## 13. Checklist de entrega

- [ ] Ingesta de los 10 formatos del lote sin pérdida de información.
- [ ] Recálculo de fórmulas XLSX y detección de error aritmético.
- [ ] Tools activos y trazados en SSE.
- [ ] Descarte y ranking deterministas, con `salida.json` válido.
- [ ] Informe en pantalla con recomendada, tabla comparativa y dictamen.
- [ ] Proyectos con estados, roles, auditoría y ficha de proveedores.
- [ ] Normalización BCV y exportación PDF/CSV/XLSX.
- [ ] Chat sobre documentos y cifrado TLS/AES verificado.
