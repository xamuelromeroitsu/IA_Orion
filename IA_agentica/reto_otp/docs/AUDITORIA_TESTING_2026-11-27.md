# Auditoría de Testing, Bugs y Vulnerabilidades

- **Proyecto**: `IA_agentica/reto_otp` (Orion Evaluador de Propuestas)
- **Fecha**: 2026-11-27
- **Rol**: Tester de programación / QA + revisión de seguridad (10 años de experiencia, análisis estático y pruebas automatizadas)
- **Alcance**: Frontend React/Vite, backend Express/Node, casos de uso y reglas de dominio, infraestructura (Gemini, Supabase, storage, SSE, parsing, reporting, market), migraciones SQL, configuración y scripts.
- **Restricción cumplida**: **No se modificó ningún archivo existente del proyecto**. Este informe se entrega como documento aparte.

## Resumen ejecutivo

Se identificaron **23 hallazgos** (5 críticos, 7 altos, 8 medios, 3 bajos). Los riesgos más importantes son: **XSS por URL no saneada**, **autorización demo basada en header spoofeable**, **políticas RLS/demo permisivas con uso de `service_role`**, **fallback de cifrado AES con clave hardcodeada**, y **fuga de eventos SSE entre evaluaciones**.

El proyecto tiene integración con **Gemini API**; se revisó la configuración y el manejo de secretos sin exponer valores. `.env` existe localmente pero **no está versionado** (`.gitignore` lo excluye). No se hallaron secretos hardcodeados en código fuente, pero sí riesgos de configuración insegura por defecto en modo demo.

Las pruebas automatizadas de API pasan (`38/38`), pero la cobertura actual no detecta los fallos de autorización, aislamiento SSE, sanitización de URLs, carreras de estado en UI, validaciones de borde y errores de consistencia monetaria detectados en esta auditoría.

## Metodología

1. **Inventario y lectura estática** de estructura, rutas, hooks, stores, casos de uso, reglas, puertos, infraestructura y SQL.
2. **Búsquedas dirigidas**: `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `target="_blank"`, `x-demo-role`, `service_role`, `AES_KEY`, `fetch`, `SSE`, `AbortController`, `setInterval`, manejo de errores.
3. **Ejecución de pruebas/comprobaciones** (sin alterar código fuente):
   - `npm test` (API): **PASS** — 11 archivos, 38 tests.
   - `npm run lint` (repo original): **PASS**.
   - `npm run build` (repo original): **PASS** con warning de chunk grande.
4. **Higiene de secretos**: se verificó presencia de claves en `.env` solo por nombre; **no se reproducen valores**. Se confirmó que `.env` y `apps/api/.data/` están ignorados por git.
5. **Consolidación** de hallazgos de revisión manual y subagentes especializados (frontend, backend, seguridad/infra), con verificación de evidencia en código.

## Evidencia de ejecución

```text
npm test   (@orion/api): PASS
  Test Files  11 passed (11)
  Tests       38 passed (38)

npm run lint (repo original): PASS
npm run build (repo original): PASS
  Warning: dist/assets/index-CuOz-0n7.js ~707.46 kB (gzip 201.49 kB) > 500 kB
```

## Nota sobre Gemini API y secretos

- La integración Gemini se configura por variables de entorno (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EXTRACTION_MODEL`) en `apps/api/src/infrastructure/config.js` y se consume en `apps/api/src/infrastructure/ai/GeminiAuditor.js`.
- `.env` está presente localmente pero **ignorado por git** y no trackeado; `.env.example` contiene placeholders. **No se exponen valores de secretos en este documento**.
- Riesgo observado: cuando falta `GEMINI_API_KEY`, el sistema cae a `DeterministicAuditor`; esto es funcional, pero debe quedar claramente indicado al usuario para evitar falsa confianza en análisis “IA”.
- La edge function `supabase/functions/analyze-document` usa `GEMINI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` del entorno; su README sugiere despliegue demo con `--no-verify-jwt`, lo cual es inseguro fuera de demo controlada.

## Matriz de severidad

| Severidad | Criterio |
|---|---|
| Crítico | Compromiso de seguridad, ejecución de script, bypass de autorización, exposición/cifrado roto, fuga masiva. |
| Alto | Fuga de datos entre contextos, acceso no autorizado, corrupción de decisión de negocio, DoS plausible. |
| Medio | Bug funcional relevante, validación insuficiente, inconsistencia operativa, riesgo explotable con condiciones. |
| Bajo | UX/accesibilidad, hardening, mantenibilidad, observabilidad o defecto de bajo impacto directo. |

## Hallazgos detallados (ordenados por importancia)

| ID | Sev. | Área | Hallazgo | Evidencia |
|---|---:|---|---|---|
| AUD-001 | Crítico | Frontend/XSS | URL de fuente no saneada permite `javascript:` | `apps/web/src/presentation/components/AnalysisCard.jsx:198-201` |
| AUD-002 | Crítico | Auth/API | Autorización por header `x-demo-role` spoofeable | `apps/api/src/interfaces/middleware/auth.js:6-20`, `app.js:22` |
| AUD-003 | Crítico | Supabase/RLS | RLS demo permisivo para anon + service_role bypass | `apps/api/supabase/schema.sql:17-55,373-475,489-569`, `config.js:44-48`, `container.js:25` |
| AUD-004 | Crítico | Cifrado | Fallback AES con clave hardcodeada determinista | `apps/api/src/infrastructure/storage/DocumentStore.js:15-27` |
| AUD-005 | Crítico | Secrets/Ops | Edge Function demo abierta (`CORS *`, `--no-verify-jwt`) | `supabase/functions/analyze-document/index.ts:5-9`, `README.md:25-31` |
| AUD-006 | Alto | SSE | Eventos SSE se envían a todos los clientes; historial sin límite | `apps/api/src/infrastructure/events/SseEventBus.js:10-36`, `routes/evaluations.routes.js:77-88` |
| AUD-007 | Alto | API/AuthZ | Endpoints sensibles sin control de rol/autorización de recurso | `projects.routes.js:19,28,37`, `documents.routes.js:7`, `chat.routes.js:7,11`, `evaluations.routes.js:71,77,90,101,107` |
| AUD-008 | Alto | Cálculo | Desviación/ranking mezcla moneda original con USD | `EvaluateBatchUseCase.js:92-100`, `domain/rules/ranking.js:20-37` |
| AUD-009 | Alto | Infra/SSRF | `BCV_SOURCE_URL` configurable sin allowlist | `config.js:33`, `market/BcvRateProvider.js:21-31` |
| AUD-010 | Alto | Frontend/Estado | Chat conserva mensajes al cambiar evaluación | `hooks/useChat.js:4-52`, `components/ChatPanel.jsx:23` |
| AUD-011 | Alto | Frontend/Estado | Notas de revisión se filtran entre evaluaciones | `components/ReviewActions.jsx:14,21-27` |
| AUD-012 | Alto | Frontend/Race | Cargas async sin cancelación pisan estado vigente | `hooks/useDocuments.js:13-29`, `hooks/useEvaluation.js:46-80`, `lib/api.js:53-61` |
| AUD-013 | Medio | API/Estado | Evaluación queda `running` si falla batch en background | `routes/evaluations.routes.js:36-67` |
| AUD-014 | Medio | API/Validación | Chat falla 500 si evaluación no existe; falta validación body | `routes/chat.routes.js:11-17` |
| AUD-015 | Medio | API/Errores | Errores “not found” devuelven 400; mensajes internos expuestos | `ManageProjectWorkflowUseCase.js:13-16`, `middleware/errors.js:5-13` |
| AUD-016 | Medio | Persistencia | Fallback silencioso a local enmascara fallos Supabase | `persistence/SupabaseRepositories.js:96-106,118-384` |
| AUD-017 | Medio | Cálculo/Parsing | TCO parsea montos con normalización ambigua | `domain/rules/tco.js:3-9,25-28` |
| AUD-018 | Medio | IA/Prompt | Riesgo residual de prompt injection y confianza en salida LLM | `ai/GeminiAuditor.js:4-16,99-196`, edge function `index.ts:13-21,188-216` |
| AUD-019 | Medio | Frontend/Validación | Validación de proyecto incompleta; presupuesto negativo/ inválido | `components/ProjectForm.jsx:26-55,101-104` |
| AUD-020 | Medio | Frontend/Realtime | Polling sin backoff; SSE reconecta en cierre normal; historial no se recarga | `hooks/useEvaluation.js:64-80`, `hooks/useTraceStream.js:14-60` |
| AUD-021 | Bajo | Frontend/Descarga | Descarga revoca blob a 1s fijo; nombre no saneado en utilidad | `lib/api.js:90-100` |
| AUD-022 | Bajo | Frontend/UX | Errores de carga inicial silenciados en algunas vistas | `hooks/useDocuments.js:18-27`, `DashboardPage.jsx:22`, `EvaluationPage.jsx:28` |
| AUD-023 | Bajo | Accesibilidad/DB | A11y incompleta; snapshot/migración SQL con hardening mejorable | `Uploader.jsx:76-105`, `ReviewActions.jsx:142-143`, `schema.sql:1-3,515-569`, `migrations/003...sql:5-7` |

### AUD-001 — XSS por URL no saneada en hallazgos
- **Severidad**: Crítico
- **Evidencia**: `apps/web/src/presentation/components/AnalysisCard.jsx:198-201`
- **Descripción**: `finding.sourceUrl` se renderiza directo en `href` sin validar esquema.
- **Causa probable**: Confianza implícita en datos del análisis/backend/modelo.
- **Reproducción**: Inyectar `sourceUrl="javascript:alert(1)"` en un hallazgo; abrir tarjeta; clic en “Fuente”.
- **Impacto**: XSS en contexto de la app, robo de datos/acciones no autorizadas.
- **Recomendación**: Permitir solo `http/https` con `new URL()` y allowlist; no renderizar enlaces inválidos; agregar CSP.

### AUD-002 — Autorización demo por header `x-demo-role`
- **Severidad**: Crítico
- **Evidencia**: `apps/api/src/interfaces/middleware/auth.js:6-20`; `apps/api/src/interfaces/http/app.js:18,22`
- **Descripción**: El rol se toma del header. `requireRole` solo revisa ese rol autoasignado.
- **Causa probable**: MVP demo sin identidad real.
- **Reproducción**: Enviar `POST /api/evaluations/:id/approve` con `x-demo-role: aprobador`.
- **Impacto**: Escalada total de privilegios en acciones protegidas por rol.
- **Recomendación**: Autenticación JWT/Supabase; rol desde claims del servidor; deshabilitar header demo fuera de local.

### AUD-003 — RLS/permisos demo amplios y `service_role`
- **Severidad**: Crítico
- **Evidencia**: `apps/api/supabase/schema.sql:17-55,373-475,489-569`; `apps/api/src/infrastructure/config.js:44-48`; `container.js:25`
- **Descripción**: `is_demo_allowed()` permite acceso con `auth.uid() is null`; grants/policies amplias para `anon/authenticated`; backend usa `service_role` que bypassa RLS.
- **Causa probable**: Políticas temporales de demo.
- **Reproducción**: Con schema demo aplicado y anon key, realizar CRUD anónimo sobre tablas/bucket.
- **Impacto**: Exposición/modificación/borrado no autenticado de datos y documentos.
- **Recomendación**: Separar demo/prod; eliminar `is_demo_allowed()` en prod; usar JWT + RLS real; minimizar service_role.

### AUD-004 — Fallback AES con clave hardcodeada
- **Severidad**: Crítico
- **Evidencia**: `apps/api/src/infrastructure/storage/DocumentStore.js:15-27,31-42`
- **Descripción**: Si `AES_KEY` falta o es inválida, se deriva `sha256('orion-demo-key')`. AES-GCM está bien en IV/tag, pero la clave por defecto es conocida.
- **Causa probable**: Conveniencia demo.
- **Reproducción**: Arrancar sin `AES_KEY` válida, subir documento, descifrar binario con la clave determinista.
- **Impacto**: Confidencialidad comprometida de documentos.
- **Recomendación**: Fail-fast con `AES_KEY` válida; eliminar fallback; rotación/KMS.

### AUD-005 — Edge Function demo abierta
- **Severidad**: Crítico
- **Evidencia**: `supabase/functions/analyze-document/index.ts:5-9,138-248`; `README.md:25-31,65-69`
- **Descripción**: CORS `*`, despliegue sugerido con `--no-verify-jwt`, service role, payload base64 grande; sin auth/rate limiting visible.
- **Causa probable**: Configuración MVP.
- **Reproducción**: Desplegar con `--no-verify-jwt` e invocar POST desde origen externo.
- **Impacto**: Abuso de costo/cuota Gemini, escritura no autorizada, exposición.
- **Recomendación**: JWT obligatorio, CORS restringido, límites de tamaño/rate limit, autorización por proyecto/documento.

### AUD-006 — Fuga de eventos SSE entre evaluaciones
- **Severidad**: Alto
- **Evidencia**: `apps/api/src/infrastructure/events/SseEventBus.js:10-36`
- **Descripción**: `publish()` envía a todos los streams, no solo al `evaluationId`. `history` no se purga.
- **Causa probable**: Broadcast global simplificado.
- **Reproducción**: Abrir SSE A y B; emitir evento de B; A lo recibe. Crear muchas evaluaciones: memoria crece.
- **Impacto**: Fuga de información entre evaluaciones y posible DoS por memoria.
- **Recomendación**: Filtrar por `evaluationId`; TTL/límite de historial; limpiar en close; manejar desconexión.

### AUD-007 — Endpoints sensibles sin autorización de recurso/rol
- **Severidad**: Alto
- **Evidencia**: `projects.routes.js:19,28,37`; `documents.routes.js:7`; `chat.routes.js:7,11`; `evaluations.routes.js:71,77,90,101,107`
- **Descripción**: Lecturas de proyectos/documentos/evaluaciones/reportes/chat/SSE no exigen rol ni ownership. `GET /documents/:id/file` entrega archivo descifrado por ID.
- **Causa probable**: Controles aplicados solo a mutaciones.
- **Reproducción**: Solicitar recurso por ID conocido sin rol apropiado.
- **Impacto**: Exposición de datos confidenciales y documentos.
- **Recomendación**: AuthN/AuthZ por recurso; roles mínimos; URLs firmadas o verificación de pertenencia a proyecto.

### AUD-008 — Moneda mezclada en ranking/desviación
- **Severidad**: Alto
- **Evidencia**: `EvaluateBatchUseCase.js:92-100`; `domain/rules/ranking.js:20-37`
- **Descripción**: `declaredTotalUsd` se llena con `analysis.declaredTotal` sin conversión. Ranking compara `declaredTotal` original vs `tcoUsd`.
- **Causa probable**: Normalización de moneda incompleta.
- **Reproducción**: Propuesta VES con declaredTotal 13000 y tasa 130; comparar con TCO USD.
- **Impacto**: Desviación/ranking erróneos, decisión de compra/venta incorrecta.
- **Recomendación**: Normalizar todos los montos comparables a USD antes de ranking; guardar moneda original y convertida.

### AUD-009 — SSRF configurable por BCV
- **Severidad**: Alto
- **Evidencia**: `config.js:33`; `market/BcvRateProvider.js:21-31`
- **Descripción**: `BCV_SOURCE_URL` es string sin allowlist; backend hace `fetch` server-side.
- **Causa probable**: Flexibilidad sin validación de destino.
- **Reproducción**: Configurar URL interna/metadata y ejecutar consulta de tasa.
- **Impacto**: SSRF/reconocimiento interno.
- **Recomendación**: `z.string().url()`, allowlist HTTPS de host BCV, bloquear IPs privadas/metadata.

### AUD-010 — Estado de chat contaminado entre evaluaciones
- **Severidad**: Alto
- **Evidencia**: `apps/web/src/presentation/hooks/useChat.js:4-52`
- **Descripción**: Mensajes no se resetean al cambiar `evaluationId`.
- **Causa probable**: Estado local no ligado a identidad.
- **Reproducción**: Chatear en A, cambiar a B, ver historial mezclado.
- **Impacto**: Contexto incorrecto, posible fuga visual entre evaluaciones.
- **Recomendación**: Reset por `evaluationId` o cargar historial por evaluación.

### AUD-011 — Notas de revisión filtradas entre evaluaciones
- **Severidad**: Alto
- **Evidencia**: `apps/web/src/presentation/components/ReviewActions.jsx:14,21-27`
- **Descripción**: `setNotes((current) => current || evaluation?.reviewNotes || '')` preserva draft viejo.
- **Causa probable**: Condición de merge incorrecta.
- **Reproducción**: Escribir notas en A, cambiar a B, guardar.
- **Impacto**: Corrupción de auditoría/revisión.
- **Recomendación**: Reset por `evaluation.id`; drafts aislados por evaluación.

### AUD-012 — Race conditions en cargas async
- **Severidad**: Alto
- **Evidencia**: `useDocuments.js:13-29`; `useEvaluation.js:46-80`; `lib/api.js:53-61`
- **Descripción**: No hay `AbortController` ni guardas de vigencia; respuestas tardías sobrescriben estado actual.
- **Causa probable**: Falta de control de concurrencia en UI.
- **Reproducción**: Alternar rápido proyectos/evaluaciones con latencia variable.
- **Impacto**: Datos mostrados de otra entidad.
- **Recomendación**: AbortController, request ID, ignorar stale responses.

### AUD-013 — Evaluación queda `running` ante fallo background
- **Severidad**: Medio
- **Evidencia**: `apps/api/src/interfaces/http/routes/evaluations.routes.js:36-67`
- **Descripción**: El catch publica evento y escribe review, pero no actualiza `status` a `failed` ni `finishedAt`.
- **Causa probable**: Manejo de error incompleto.
- **Reproducción**: Provocar error en batch; consultar evaluación.
- **Impacto**: Estado inconsistente, polling/UI bloqueada.
- **Recomendación**: Persistir estado terminal `failed` con `finishedAt` y motivo seguro.

### AUD-014 — Chat sin 404/validación
- **Severidad**: Medio
- **Evidencia**: `apps/api/src/interfaces/http/routes/chat.routes.js:11-17`
- **Descripción**: No valida existencia de evaluación ni `question` útil antes de usar `evaluation.projectId`.
- **Causa probable**: Falta guard clause.
- **Reproducción**: POST chat a evaluación inexistente.
- **Impacto**: Error 500 evitable, mala semántica API.
- **Recomendación**: 404 si no existe; 400 si question vacía/larga/tipo inválido.

### AUD-015 — Errores HTTP mal semantizados y verbosos
- **Severidad**: Medio
- **Evidencia**: `ManageProjectWorkflowUseCase.js:13-16`; `middleware/errors.js:5-13`
- **Descripción**: Not-found se lanza como `Error` sin status y handler responde 400; además devuelve `error.message`.
- **Causa probable**: Handler genérico sin mapeo seguro.
- **Reproducción**: GET proyecto inexistente; forzar error interno.
- **Impacto**: Semántica incorrecta y posible fuga de detalles internos.
- **Recomendación**: Errores tipados con `status/code`; mensajes seguros para 5xx; log interno redactado.

### AUD-016 — Fallback silencioso a persistencia local
- **Severidad**: Medio
- **Evidencia**: `apps/api/src/infrastructure/persistence/SupabaseRepositories.js:96-106,118-384`
- **Descripción**: `withFallback` oculta fallos Supabase y puede devolver/guardar localmente.
- **Causa probable**: Modo demo/offline.
- **Reproducción**: Romper credencial/RLS Supabase y operar CRUD.
- **Impacto**: Inconsistencia, pérdida de trazabilidad, falsa confirmación.
- **Recomendación**: Solo en `DEMO_MODE`; en prod fallar y alertar.

### AUD-017 — Parsing de montos TCO ambiguo
- **Severidad**: Medio
- **Evidencia**: `apps/api/src/domain/rules/tco.js:3-9,25-28`
- **Descripción**: `findAmount` elimina puntos y cambia coma por punto, malinterpretando `1,200.00`.
- **Causa probable**: Normalización numérica simplista.
- **Reproducción**: Texto `Flete: 1,200.00 USD`; calcular TCO.
- **Impacto**: TCO/ranking/descarte presupuestario incorrectos.
- **Recomendación**: Reusar parser robusto común (`parseAmount`), soportar formatos y pruebas.

### AUD-018 — Prompt injection / confianza en LLM
- **Severidad**: Medio
- **Evidencia**: `apps/api/src/infrastructure/ai/GeminiAuditor.js:4-16,99-196`; `supabase/functions/analyze-document/index.ts:13-21,188-216`
- **Descripción**: Hay system prompt y schema, pero el contenido documental no confiable entra al prompt; catches amplios pueden ocultar fallos y caer a fallback.
- **Causa probable**: Riesgo inherente LLM + defensa en profundidad incompleta.
- **Reproducción**: Documento con instrucciones adversariales; pregunta de chat maliciosa.
- **Impacto**: Hallazgos omitidos/sesgados, decisión errónea.
- **Recomendación**: Validación post-LLM determinista, logs de fallback/injection, límites de contexto, no delegar controles de seguridad al modelo.

### AUD-019 — Validación incompleta de formulario/proyecto
- **Severidad**: Medio
- **Evidencia**: `apps/web/src/presentation/components/ProjectForm.jsx:26-55,101-104`
- **Descripción**: Solo valida nombre y tipo; `budgetReferenceUsd` acepta negativos/valores inválidos según input.
- **Causa probable**: Validación mínima en cliente.
- **Reproducción**: Ingresar `-100` o valor inválido en presupuesto.
- **Impacto**: Datos inconsistentes, errores backend, mala UX.
- **Recomendación**: Validar rango/tipo/NaN/finito en UI y Zod en API.

### AUD-020 — Polling/SSE poco robustos
- **Severidad**: Medio
- **Evidencia**: `apps/web/src/presentation/hooks/useEvaluation.js:64-80`; `useTraceStream.js:14-60`
- **Descripción**: Polling fijo sin backoff; SSE reconecta ante cierre normal; historial no se reconstruye.
- **Causa probable**: Manejo realtime simplificado.
- **Reproducción**: Simular caída API o completar evaluación.
- **Impacto**: Carga innecesaria, UX confusa, pérdida de trazabilidad visible.
- **Recomendación**: Backoff+jitter, evento terminal, recarga historial, cancelación.

### AUD-021 — Descarga de archivos frágil
- **Severidad**: Bajo
- **Evidencia**: `apps/web/src/presentation/lib/api.js:90-100`
- **Descripción**: Revoca object URL tras 1s fijo; no sanea nombre.
- **Causa probable**: Utilidad simplificada.
- **Reproducción**: Descarga grande/lenta; nombre con caracteres inesperados.
- **Impacto**: Descarga intermitente; riesgo de reutilización insegura.
- **Recomendación**: Saneamiento de filename y revocación segura.

### AUD-022 — Errores de carga silenciados
- **Severidad**: Bajo
- **Evidencia**: `hooks/useDocuments.js:18-27`; `DashboardPage.jsx:22`; `EvaluationPage.jsx:28`
- **Descripción**: `catch(() => {})` y vistas sin estado de error.
- **Causa probable**: Evitar unhandled rejection sin UX de error.
- **Reproducción**: Forzar fallo de endpoint de documentos.
- **Impacto**: Usuario interpreta vacío como “sin datos”.
- **Recomendación**: UI de error/reintento y logging.

### AUD-023 — A11y y hardening de esquema
- **Severidad**: Bajo
- **Evidencia**: `Uploader.jsx:76-105`; `ReviewActions.jsx:142-143`; `schema.sql:1-3,515-569`; `migrations/003_add_project_business_context.sql:5-7`
- **Descripción**: Falta live regions/semántica ARIA consistente; `schema.sql` es snapshot mixto; constraint en 003 no idempotente; bucket permite `application/octet-stream`.
- **Causa probable**: Priorización MVP.
- **Reproducción**: Navegación con lector de pantalla; reaplicar migración 003.
- **Impacto**: Barreras de accesibilidad y riesgos operativos de despliegue.
- **Recomendación**: A11y básica (aria-live, labels, focus), snapshot automatizado, migraciones idempotentes, validar magic bytes/MIME.

## Controles positivos observados

- `.env` no trackeado; `.env.example` con placeholders; `.gitignore` cubre secretos y `.data/`.
- AES-256-GCM con IV aleatorio y tag (base criptográfica correcta, pendiente gestión de clave).
- Validación de MIME/tamaño en uploads (`multer`, `ALLOWED_MIME`, `MAX_PROPOSALS`).
- Reglas de negocio deterministas para TCO/ranking/aritmética con 38 tests pasando.
- Sanitización básica de nombres de archivo en storage/download headers.

## Priorización recomendada

1. **P0 (inmediato)**: AUD-001 a AUD-005.
2. **P1 (corto plazo)**: AUD-006 a AUD-012.
3. **P2 (planificado)**: AUD-013 a AUD-020.
4. **P3 (mejora continua)**: AUD-021 a AUD-023.

## Limitaciones

- No se realizó pentest activo destructivo ni explotación contra servicios externos reales.
- No se ejecutó fuzzing extensivo de PDF/XLSX/imágenes ni pruebas de carga SSE.
- No se inspeccionaron valores de secretos en `.env`; solo presencia/ausencia de claves.
- Resultados de lint/build reportados sobre el repo original; un clon temporal sin `node_modules` propio dio fallos de resolución, considerado artefacto de entorno.
