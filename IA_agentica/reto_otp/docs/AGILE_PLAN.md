# Plan ágil: épicas, tareas y sprints

Plan de ejecución para 2 días con metodología ágil ligera. Las historias de usuario de origen están en [HISTORIAS_USUARIO.md](HISTORIAS_USUARIO.md); la estructura de código está en [FRONTEND.md](FRONTEND.md) y [BACKEND.md](BACKEND.md).

## 1. Reglas de trabajo

- **Roles responsables:** Frontend, Backend/API, IA/Datos, Seguridad/DevOps. No se asignan nombres; cada rol toma sus tareas del tablero.
- **Tablero Kanban:** `To Do → En Progreso → En Revisión → Done`.
- **WIP:** máximo 2 tareas por rol y máximo 2 en `En Revisión`.
- **Tamaño:** cualquier tarea mayor de 4 h se divide antes de empezar.
- **Estimación:** Fibonacci (1, 2, 3, 5) en puntos de complejidad; 5 = tarea crítica que requiere prueba.
- **Standups:** 5 min al inicio de cada timebox: qué terminé, qué hago, qué bloquea.
- **Definición de terminado (DoD):** función demostrable en pantalla o CLI + prueba automatizada o validación manual documentada + nota actualizada en este repositorio + commit en `desarrollo`.
- **Prioridad:** primero lo que asegura los 25 puntos automáticos (`salida.json`), después la plataforma de 75 puntos.

## 2. Épicas y tareas

### E0 · Configuración base

| ID | Tarea | Rol | Pts | Entregable |
| --- | --- | --- | --- | --- |
| T0.1 | Crear `.env.example`, `schema.sql`, `package.json` de API y web | Backend/API | 2 | Repositorio listo para `npm install` |
| T0.2 | Configurar Vite, Express, ESLint, Prettier y script `npm run dev` | Frontend + Backend/API | 3 | API `:4000` y web `:5173` arrancan |
| T0.3 | Generar `AES_KEY`, configurar TLS local con `mkcert` | Seguridad/DevOps | 2 | HTTPS en desarrollo y clave fuera del repo |

### E1 · Gestión de proyectos

| ID | Tarea | Rol | Pts | HU |
| --- | --- | --- | --- | --- |
| T1.1 | Formulario de proyecto y carga del documento base | Frontend | 3 | HU-01 |
| T1.2 | Endpoint `POST /projects/:id/documents` + cifrado AES en Storage | Backend/API + Seguridad | 3 | HU-01 |
| T1.3 | Listado de proyectos, estados y cambio `recepción → … → cerrado` | Frontend + Backend/API | 3 | HU-02 |
| T1.4 | Registro de cada cambio de estado en `audit_log` | Backend/API | 2 | HU-02, HU-14 |

### E2 · Ingesta multimodal

| ID | Tarea | Rol | Pts | HU |
| --- | --- | --- | --- | --- |
| T2.1 | `Uploader.jsx`: dropzone de 3–20 archivos con validación MIME | Frontend | 3 | HU-03 |
| T2.2 | Endpoint de carga masiva y persistencia cifrada por archivo | Backend/API | 3 | HU-03 |
| T2.3 | Clasificador PDF nativo / escaneado / imagen / XLSX | IA/Datos | 2 | HU-04 |
| T2.4 | Extracción con visión Gemini y esquema JSON estricto | IA/Datos | 5 | HU-04 |
| T2.5 | Recálculo de fórmulas XLSX sin valor cacheado | IA/Datos | 3 | HU-05 |
| T2.6 | Prueba con los 10 archivos del lote real | IA/Datos | 2 | HU-03–05 |

### E3 · Auditoría con herramientas

| ID | Tarea | Rol | Pts | HU |
| --- | --- | --- | --- | --- |
| T3.1 | `calculator.js`: cantidades, subtotales y total declarado con `decimal.js` | Backend/API | 3 | HU-07 |
| T3.2 | `injectionScan.js` y cuarentena de propuesta manipuladora | Seguridad/DevOps | 3 | HU-08 |
| T3.3 | `scopeCheck.js`: 11 equipos, periféricos y protección eléctrica | IA/Datos | 3 | HU-07 |
| T3.4 | Detección y cuantificación de costos ocultos + TCO | IA/Datos | 3 | HU-06 |
| T3.5 | `webSearch.js` con Tavily: URL, snippet y fecha por componente | IA/Datos | 3 | HU-09 |
| T3.6 | `bcvRate.js`: tasa oficial, caché y fecha valor | Backend/API | 2 | HU-16 |

### E4 · Ranking, trazabilidad e informe

| ID | Tarea | Rol | Pts | HU |
| --- | --- | --- | --- | --- |
| T4.1 | `discard.js` + `ranking.js` deterministas, sin duplicados | Backend/API | 5 | HU-07, HU-08 |
| T4.2 | `scripts/batch.js`: procesa `propuestas/` y escribe `salida.json` | Backend/API | 5 | Salida automática |
| T4.3 | `events/sse.js` + `TracePanel.jsx`: trazabilidad en vivo | Frontend + Backend/API | 3 | HU-10 |
| T4.4 | Informe Markdown: recomendada, tabla comparativa y dictamen | Backend/API | 3 | HU-11 |
| T4.5 | Visualización del informe con `react-markdown` | Frontend | 2 | HU-11 |
| T4.6 | Exportación CSV/XLSX de la tabla comparativa | Backend/API | 2 | HU-12 |
| T4.7 | Exportación PDF del informe ejecutivo | Backend/API | 3 | HU-11 |
| T4.8 | Validación de `salida.json` con `validador_salida.html` | Backend/API | 2 | Entrega |

### E5 · Plataforma de gestión

| ID | Tarea | Rol | Pts | HU |
| --- | --- | --- | --- | --- |
| T5.1 | Login con Supabase Auth, cookie `httpOnly` y `GET /auth/me` | Backend/API | 3 | HU-13 |
| T5.2 | Guardas de ruta y permisos por rol en frontend | Frontend | 2 | HU-13 |
| T5.3 | Políticas RLS y middleware `roles.js` | Seguridad/DevOps | 3 | HU-13 |
| T5.4 | Notas de revisión y confirmación del evaluador | Frontend + Backend/API | 3 | HU-14 |
| T5.5 | Adjudicación por el aprobador con registro en auditoría | Backend/API | 2 | HU-14 |
| T5.6 | Directorio de proveedores e historial con alertas | Frontend + Backend/API | 3 | HU-15 |
| T5.7 | `ChatPanel.jsx` + endpoint `/chat` basado solo en evidencias | Frontend + IA/Datos | 5 | HU-17 |

### E6 · Seguridad y cierre

| ID | Tarea | Rol | Pts | HU |
| --- | --- | --- | --- | --- |
| T6.1 | `helmet`, `rateLimit`, whitelist MIME y sanitización de nombres | Seguridad/DevOps | 2 | HU-18 |
| T6.2 | Verificación de cifrado AES-256-GCM y custodia de `AES_KEY` | Seguridad/DevOps | 3 | HU-18 |
| T6.3 | Ensayo final: demo completa + revisión de secretos en Git | Todos | 3 | Entrega |

## 3. Sprints / timeboxes

| Sprint | Momento | Objetivo | Tareas |
| --- | --- | --- | --- |
| S0 · Setup | Día 1, primeros 45 min | Que todo el equipo pueda arrancar | T0.1–T0.3 |
| S1 · MVP ingesta | Día 1, mañana | Extraer los 10 archivos y clasificar válidas/descartadas | T1.1, T1.2, T2.1–T2.6, T3.1–T3.4 |
| S2 · Salida válida | Día 1, tarde | `salida.json` correcto y trazabilidad visible | T4.1–T4.5, T4.8, T6.1, T6.2 |
| S3 · Plataforma | Día 2, mañana | Roles, auditoría, proveedores y exportación | T1.3, T1.4, T3.5, T3.6, T4.6, T5.1–T5.6 |
| S4 · Cierre | Día 2, tarde | Mercado citado, BCV, chat, PDF y ensayo | T4.7, T5.7, T6.3 + ajustes del ranking |

## 4. Dependencias críticas

```text
T0.1 → T0.2 → T2.1/T2.2 → T2.3/T2.4/T2.5 → T3.1/T3.3/T3.4 → T4.1 → T4.2 → T4.8
                                      ↘ T3.5/T3.6 → T4.4 → T4.7
T0.3 → T1.2 → T5.3 → T5.1 → T5.2
```

- `T4.2` (batch) depende de `T4.1` (ranking) y es la tarea más valiosa: debe terminarse en S2 aunque falten módulos de plataforma.
- `T5.7` (chat) se hace al final: necesita los hallazgos y evidencias ya persistidos.
- Si el tiempo aprieta, se recorta `T4.7` (PDF) antes que `T4.8` (validación de `salida.json`).

## 5. Tablero de seguimiento

| Columna | Regla para mover |
| --- | --- |
| To Do | Tarea estimada y con rol responsable. |
| En Progreso | Se inició en este timebox; máximo 2 por rol. |
| En Revisión | Otro rol comprueba la demo y el DoD. |
| Done | Commit en `desarrollo` + nota actualizada. |

**Ritmo sugerido:** standup 5 min, trabajo 90 min, revisión 10 min, ajuste 5 min. Repetir dos veces por timebox. Al final de cada sprint se muestra una demo de 3 minutos; lo que no pase el DoD vuelve a `To Do` con la tarea dividida.

## 6. Tablero activo

| ID | Tarea | Estado |
| --- | --- | --- |
| T5.3 | Alinear políticas RLS y esquema con los repositorios de la API | Done |
| T6.3 | Ensayo final: demo completa y revisión de secretos en Git | Done |
