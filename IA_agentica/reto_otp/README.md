# reto_otp

Agente evaluador de propuestas de servicios para el Hackatón Venezuela INNOVA 2026 (categoría grupal: IA, Desarrollo de Software y Ciberseguridad).

**Este README es el punto de entrada:** desde aquí se accede a toda la documentación del proyecto y a las reglas obligatorias para construirlo.

## Participantes

- Jeily Baudino
- Xamuel Romero
- Oliver Osio

## Descripción del proyecto

Plataforma web que registra un proyecto y analiza un lote de propuestas económicas de proveedores (PDF, JPG, PNG, XLSX), extrae su contenido con IA multimodal, audita aritmética, alcance y compatibilidad técnica, contrasta precios contra referencias de mercado en internet, calcula el costo total real (fletes, recargos, impuestos, conversión BCV) y emite un dictamen con la propuesta recomendada y las causas de descarte. Los requerimientos del proyecto se cargan en el formulario de creación; la ingestión de un documento de requerimientos separado está pendiente.

El sistema expone además un modo lote que procesa la carpeta de propuestas y escribe `salida.json` con el formato exigido por la evaluación automática.

## Alcance

- **MVP (día 1):** ingesta multimodal, extracción estructurada, herramientas de cálculo/injection scan, reglas deterministas de descarte y ranking, interfaz web con trazabilidad e informe, modo lote con `salida.json`.
- **Plataforma (día 2):** gestión de proyectos con estados, roles y auditoría, ficha de proveedores, normalización USD/Bs con tasa BCV, exportación PDF/CSV/XLSX y consulta en lenguaje natural.
- **Seguridad transversal:** TLS 1.2/1.3, cifrado AES-256-GCM de documentos en reposo, control de acceso por roles y registro de auditoría.

## Estructura de carpetas

```text
reto_otp/
├─ apps/api/                       API Express + scripts de migración y modo lote
│  ├─ server.js                    arranque del servidor y señales de apagado
│  ├─ src/domain/                  CAPA DOMINIO: entidades, value objects, reglas y puertos
│  │  ├─ entities/                 ProjectRequirement, SupplierProposal, EvaluationReport, AuditFinding
│  │  ├─ valueObjects/             Money (decimal.js)
│  │  ├─ rules/                    arithmetic, scopeCheck, discard, tco, ranking, injectionScan
│  │  └─ ports/                    interfaces que la infraestructura debe implementar
│  ├─ src/application/useCases/    CAPA APLICACIÓN: flujos que orquestan dominio y puertos
│  ├─ src/infrastructure/          CAPA INFRAESTRUCTURA: Gemini/fallback, Supabase, Storage, BCV, SSE, reportes
│  │  └─ config.js                 validación Zod de variables de entorno
│  ├─ src/interfaces/              CAPA DE INTERFACES: rutas HTTP, middleware y app Express
│  ├─ supabase/                    migraciones, snapshot `schema.sql` y semilla demo
│  └─ scripts/                     `batch.js` (salida.json) y `migrate.js`
├─ apps/web/src/
│  ├─ domain/                      tipos y contratos de la vista
│  ├─ application/                 hooks y servicios que llaman a la API
│  ├─ infrastructure/              cliente HTTP y adaptadores (SSE, descargas)
│  └─ presentation/                CAPA PRESENTACIÓN: páginas, componentes y estilos Tailwind
├─ packages/shared/                esquemas y constantes reutilizados por API y web
├─ docs/                           documentación de producto, técnica y validación
├─ .env.example                    plantilla versionada sin secretos
└─ AGENTS.md                       reglas obligatorias de nomenclatura y flujo
```

**Por qué estas capas:** `domain` no depende de frameworks y concentra las decisiones auditables; `application` coordina casos de uso sin conocer Express ni Supabase; `infrastructure` implementa los puertos (IA, persistencia, red, archivos); `interfaces` expone HTTP; `presentation` es la UI. El modelo propone extracciones, pero el ranking y los descartes los calculan las reglas de `domain/rules/`. La explicación completa está en [docs/ARQUITECTURA_DDD.md](docs/ARQUITECTURA_DDD.md).

## Índice de documentación

```text
README.md                    ← estás aquí
├─ AGENTS.md                 reglas obligatorias para agentes y personas
└─ docs/
   ├─ MVP.md                 producto, arquitectura, métricas y cronograma
   ├─ HISTORIAS_USUARIO.md   épicas, historias y criterios de aceptación
   ├─ AGILE_PLAN.md          tareas por rol, sprints y tablero Kanban
   ├─ DESARROLLO.md          guía técnica: esquema, módulos, seguridad, pruebas
   ├─ FRONTEND.md            estructura de apps/web/ y endpoints que consume
   ├─ BACKEND.md             estructura de apps/api/ y API REST
   ├─ STACK_HERRAMIENTAS.md  librerías JS, APIs y parámetros del modelo
   ├─ LOTE_PRUEBAS.md        análisis preliminar de las 10 propuestas
   ├─ VALIDACION.md          contrato de salida.json y validación final
   └─ REACTBITS_PIPELINE.md   estructura e instalación de Pipeline
```

### Producto y proceso

| Documento | Contenido |
| --- | --- |
| [docs/MVP.md](docs/MVP.md) | Producto, alcance, arquitectura objetivo, métricas, riesgos y cronograma. |
| [docs/HISTORIAS_USUARIO.md](docs/HISTORIAS_USUARIO.md) | 18 historias de usuario con criterios de aceptación y prioridad P0/P1. |
| [docs/AGILE_PLAN.md](docs/AGILE_PLAN.md) | 6 épicas, tareas por rol, 5 sprints y reglas del tablero Kanban. |

### Desarrollo

| Documento | Contenido |
| --- | --- |
| [docs/DESARROLLO.md](docs/DESARROLLO.md) | Guía práctica y referencia técnica: esquema de datos, módulos, seguridad y pruebas. |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Estructura de `apps/web/` en inglés, nota por archivo y endpoints que consume. |
| [docs/REACTBITS_PIPELINE.md](docs/REACTBITS_PIPELINE.md) | Estructura, configuración y adaptación ORION de Pipeline. |
| [docs/BACKEND.md](docs/BACKEND.md) | Estructura de `apps/api/` en inglés, nota por archivo y API REST. |
| [docs/STACK_HERRAMIENTAS.md](docs/STACK_HERRAMIENTAS.md) | Librerías JS, APIs externas y parámetros correctos del agente de IA. |

### Prueba y entrega

| Documento | Contenido |
| --- | --- |
| [docs/LOTE_PRUEBAS.md](docs/LOTE_PRUEBAS.md) | Análisis preliminar de las 10 propuestas del lote real. |
| [docs/VALIDACION.md](docs/VALIDACION.md) | Contrato de `salida.json`, cálculo automático y pasos de validación. |

## Reglas obligatorias

Resumen; la fuente de verdad es [AGENTS.md](AGENTS.md).

- **JS:** `camelCase` en variables/funciones, `PascalCase` en componentes `.jsx`, `camelCase` en módulos JS.
- **SQL y entorno:** `snake_case` en tablas/columnas y `UPPER_SNAKE_CASE` en `.env`.
- **Herramientas de IA:** IDs en `snake_case` (`web_search`, `bcv_rate`); implementación JS en `camelCase`.
- **`.env`:** `.env.example` versionado con placeholders, `.env` ignorado; el front solo lee `VITE_API_URL`.
- **Migraciones:** `NNN_descripcion.sql` secuenciales en `apps/api/supabase/migrations/`; nunca editar una aplicada.
- **Dinero:** `decimal.js` en código y `numeric(14,2)` en BD; el ranking lo decide código determinista.

## Requerimientos del sistema

- Node.js 20 LTS o superior y npm 10+.
- Cuenta de Supabase (Postgres, Auth y Storage) y sus claves `anon` y `service_role`.
- Clave de API de Google AI Studio (Gemini) y de un proveedor de búsqueda web (Tavily).
- Variable `AES_KEY` de 32 bytes en Base64 para cifrar documentos en la aplicación (`openssl rand -base64 32`).
- Certificado TLS (Caddy en producción, `mkcert` en desarrollo local).
- Navegador moderno; sin dependencia de OCR local para presupuestos manuscritos.

## Modo demo y secretos

- `.env` contiene credenciales reales y está ignorado por Git; `.env.example` solo tiene placeholders. Nunca se registran secretos en logs, commits, informes ni respuestas HTTP.
- Sin `GEMINI_API_KEY` la API usa `DeterministicAuditor`: extrae lo que puede del texto de PDF/XLSX y aplica las mismas reglas deterministas. Si el documento es ilegible o no aporta datos suficientes, se devuelve un error en lugar de generar un análisis supuesto. El proyecto define operación (compra/venta) y sector para contextualizar a Gemini.
- Sin `SUPABASE_URL`/clave pública la API persiste en JSON local y cifra los archivos con `AES_KEY`; es el modo usado para el ensayo funcional. Las migraciones de `apps/api/supabase/` se aplican cuando la base remota esté accesible.
- El MVP no tiene pantalla de login: el header `x-demo-role` selecciona `cargador`, `revisor`, `aprobador` o `auditor` para probar los permisos.

## Paso a paso de instalación / despliegue

1. Clonar el repositorio y situarse en la rama `desarrollo`:

   ```bash
   git clone https://gitlab.nube.gob.ve/grupo/chuao/chuao_grupo1/reto_otp.git
   cd reto_otp
   git checkout desarrollo
   ```

2. Instalar dependencias (los workspaces de npm instalan API, web y paquete compartido de una sola vez):

   ```bash
   npm install
   ```

3. Copiar `.env.example` a `.env` y completar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `TAVILY_API_KEY` y `AES_KEY`. Nunca versionar el `.env`. Para probar sin servicios externos, dejar esas claves vacías: la API usa almacenamiento local y el auditor determinista.

4. Aplicar el esquema SQL y las políticas RLS de Supabase con `npm run db:migrate`, o ejecutar `apps/api/supabase/schema.sql` en el editor de Supabase.

5. Iniciar desarrollo (API en `:4000`, web en `:5173`):

   ```bash
   npm run dev
   ```

6. Procesar el lote de prueba y generar la salida evaluada:

   ```bash
   npm run batch -- --input "<ruta>/Reto_Agente_Evaluador_de_Propuestas_de_Servicios" --out salida.json
   ```

   El comando obtiene el commit con `git rev-parse HEAD`, registra timestamps ISO 8601 con zona `-04:00` y valida el resultado con [docs/VALIDACION.md](docs/VALIDACION.md).

7. Verificar el formato de `salida.json` con `validador_salida.html` (incluido en el material del hackatón) antes de hacer commit.

8. Comprobaciones de calidad y ensayo funcional:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

   Con la API en marcha, el recorrido mínimo es `GET /api/health` → `GET /api/bootstrap` → `POST /api/projects` → `POST /api/projects/:id/documents` (multipart `files`) → `POST /api/evaluations` → `GET /api/evaluations/:id/events` (SSE) → `GET /api/evaluations/:id/report.pdf` → `POST /api/evaluations/:id/chat` → `PATCH /api/evaluations/:id/review` → `POST /api/evaluations/:id/approve`. El ensayo final con las 10 propuestas reales terminó en verde: 10 documentos, 10 análisis, ranking determinista con recomendación, 13 eventos SSE y exportaciones PDF/CSV/XLSX válidas.
