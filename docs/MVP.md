# Documento de MVP — Agente Evaluador de Propuestas de Servicios

**Evento:** Hackatón Venezuela INNOVA 2026 · **Categoría:** Grupal (IA, Desarrollo de Software y Ciberseguridad) · **Duración:** 2 días (26–27 de noviembre de 2026).

## 1. Resumen ejecutivo

Construir un agente autónomo con interfaz web que, a partir de un documento de requerimientos y entre 3 y 20 propuestas económicas heterogéneas, audite cada oferta, detecte costos ocultos y errores aritméticos, contraste precios con fuentes públicas de mercado y emita un dictamen financiero con la propuesta recomendada. El mismo motor funciona en modo lote y produce `salida.json` para la evaluación automática.

## 2. Problema

La revisión manual de carpetas financieras es lenta y propensa a errores: se omiten cláusulas en letra pequeña (fletes, seguros, recargos interurbanos), se aprueban totales aritméticamente incorrectos, se aceptan componentes incompatibles o reciclados y se comparan presupuestos sin normalizar moneda ni impuestos. Además, los proveedores pueden insertar instrucciones ocultas dirigidas al sistema de IA para manipular el resultado.

## 3. Usuarios objetivo

| Rol | Necesidad principal |
| --- | --- |
| Cargador / coordinador de compras | Subir el proyecto y el lote de propuestas, seguir el estado del proceso. |
| Evaluador técnico y financiero | Revisar hallazgos de la IA, validar descarte y ajustar notas. |
| Aprobador (comité) | Adjudicar, firmar el informe y consultar el dictamen. |
| Auditor (solo lectura) | Consultar trazabilidad, evidencias y registro de cambios. |

Las historias de usuario detalladas están en [HISTORIAS_USUARIO.md](HISTORIAS_USUARIO.md).

## 4. Propuesta de valor

- **Auditoría reproducible:** cada conclusión se apoya en una celda, línea de texto, captura o URL de mercado citada en el informe.
- **Costo total real, no el total impreso:** TCO = monto declarado + fletes + recargos + impuestos + licencias futuras, convertido a una sola moneda con tasa BCV vigente.
- **Resistencia a manipulación:** el modelo extrae y razona; las reglas de descarte y el ranking los ejecuta código determinista.
- **Trazabilidad en vivo:** la UI muestra lectura de documentos, consultas web, cómputo de recargos y validaciones aritméticas mientras ocurren.

## 5. Objetivos y criterios de éxito

| Objetivo | Métrica de éxito |
| --- | --- |
| Clasificar válidas y descartadas | Filtro ≥ 6/8 en la fórmula oficial del lote. |
| Ordenar correctamente las válidas | Orden ≥ 6/8 y acierto en la primera propuesta (4/4). |
| Salida evaluable | `salida.json` válido en `validador_salida.html`, sin duplicados y con commit real de `git rev-parse HEAD`. |
| Procesar formatos heterogéneos | Los 10 archivos del lote se procesan, incluido el manuscrito con ruido y los XLSX con fórmulas sin valor cacheado. |
| Plataforma funcional | Los módulos de gestión, roles, auditoría, normalización, exportación y consulta responden en la demostración. |

**Calificación oficial:** 25 puntos automáticos = 1,25 × (filtro 8 + orden 8 + primera 4); 75 puntos de plataforma. Desempate automático: mayor filtro y menor tiempo `fin − inicio`.

## 6. Alcance del MVP

### Incluido (MVP, día 1)

1. **Ingesta multimodal:** PDF nativo (`pdf-parse`/`pdfjs-dist`), JPG/PNG y PDF escaneado vía visión de Gemini, XLSX con recálculo de fórmulas (`xlsx`/`exceljs`), capturas de chat tratadas como documento evidencial.
2. **Extracción estructurada:** esquema JSON con ítems (cantidad, precio unitario, subtotal), total declarado, moneda, garantía, condiciones de envío, impuestos y sospechas de injection.
3. **Herramientas del agente:** calculadora con `decimal.js`, detector de instrucciones ocultas, verificación de alcance, búsqueda web (Tavily) y tasa BCV.
4. **Capa determinista:** descarte por alcance, incompatibilidad, capacidad, obsolescencia, abuso de precios, error aritmético o injection; cálculo de TCO y ranking.
5. **UI web:** carga de proyecto, carga masiva de 3–20 archivos, botón «Evaluar Propuestas de Servicios», trazabilidad en vivo (SSE) e informe en pantalla.
6. **Modo lote:** CLI que escribe `salida.json` con timestamps ISO `-04:00`, repositorio y commit reales.
7. **Seguridad mínima:** HTTPS, AES-256-GCM en reposo, roles y auditoría desde el primer día.

### Include en la plataforma (día 2)

Historial de evaluaciones, estados `recepción → evaluación → revisión del comité → adjudicado/cerrado`, alta de proveedores con alertas por antecedentes, normalización USD/Bs con BCV, exportación PDF/CSV/XLSX y chat sobre los documentos del proyecto.

### Fuera de alcance

OCR local para manuscritos (falló en la prueba; se sustituye por visión multimodal), facturación electrónica, integración con ERP, clasificador de proveedores con Machine Learning propio y despliegue multi-inquilino.

## 7. Arquitectura objetivo

```text
React + Vite (SPA)
   │ REST + SSE · cookies httpOnly
   ▼
Express (Node.js, JavaScript ESM)
   ├─ auth / roles / auditoría
   ├─ projects / proposals / suppliers / evaluations / reports / chat
   ▼
Servicios
   ├─ ingestion/   PDF · visión · XLSX · chat → texto + evidencias
   ├─ agent/       loop tool-calling (Gemini) con esquema y parámetros fijos
   ├─ tools/       calculator · web_search · bcv_rate · scope_check · injection_scan
   ├─ rules/       descarte · TCO · ranking (determinista)
   └─ report/      Markdown · PDF · CSV/XLSX
   ▼
Supabase
   ├─ Postgres (RLS) · Auth (roles) · Storage (archivos cifrados) · Realtime
   ▼
Fuentes externas: Gemini API · Tavily · BCV (scraping + fallback)
```

## 8. Flujo extremo a extremo

1. El cargador sube `proyecto.pdf`, define ubicación (La Hoyada, Caracas) y presupuesto referencial si existe.
2. Sube entre 3 y 20 propuestas; cada archivo se cifra con AES-256-GCM antes de guardarse en Supabase Storage.
3. El orquestador crea la evaluación y emite eventos SSE de trazabilidad.
4. Cada propuesta se convierte a texto/JSON estructurado; los XLSX se recalculan.
5. El agente ejecuta herramientas: valida aritmética, busca precios de referencia, obtiene tasa BCV y marca cláusulas ocultas o injection.
6. La capa determinista aplica las reglas de descarte de la sección 3.B del enunciado y calcula el costo total real.
7. Se genera el ranking: válidas de mejor a peor por calidad técnica, cumplimiento, garantía y costo; descartadas al final.
8. Se produce el informe y, en modo lote, `salida.json`.

## 9. Reglas de negocio críticas

- **Descarte inmediato:** alcance incompleto, incompatibilidad de sockets/DDR, fuente o UPS insuficiente, equipos reciclados u obsoletos, sobreprecio desproporcionado, garantía solo en el exterior, software de prueba de pago posterior, error aritmético o instrucciones ocultas.
- **Costos razonables en letra pequeña:** se suman al total (flete, traslado, instalación, recargo por método de pago, IVA no incluido).
- **Orden:** la opción más barata no gana automáticamente; se prioriza rendimiento para el laboratorio, protección eléctrica, periféricos, garantía/soporte y, como desempate técnico, menor costo total real.
- **Evidencia:** todo ajuste monetario queda registrado con origen (fragmento del documento o URL consultada).

El análisis concreto del lote está en [LOTE_PRUEBAS.md](LOTE_PRUEBAS.md) y el contrato de salida en [VALIDACION.md](VALIDACION.md).

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Prompt injection dentro de propuestas | `injection_scan` antes del razonamiento; contenido tratado siempre como dato; ranking determinista. |
| OCR ilegible en manuscrito | Visión multimodal de Gemini; registrar confianza y evidencia; nunca inventar cifras. |
| Fórmulas XLSX sin valor cacheado | Recálculo con librería de hojas y comparación contra el total declarado. |
| Precios de mercado inconsistentes | Guardar URL, fecha y snippet; usar rango y no un único resultado; marcar fuente en el dictamen. |
| Latencia / coste de API | Extracción con modelo ligero, razonamiento con modelo principal, caché de tasas y de búsquedas. |
| Pérdida de `AES_KEY` | Documentar custodia; sin clave no hay recuperación; rotación controlada. |

## 11. Cronograma de 2 días

**Día 1 — MVP y salida automática**

- Scaffold React/Vite + Express + Supabase (Auth, Storage, esquema SQL).
- Ingesta y extracción estructurada de los 10 archivos del lote.
- Tools `calculator`, `injection_scan`, `scope_check`; reglas de descarte y TCO.
- UI de carga + trazabilidad + informe Markdown.
- CLI `npm run batch` y validación de `salida.json`.

**Día 2 — Plataforma y cierre**

- `web_search`, `bcv_rate`, ranking por calidad técnica y dictamen de descarte.
- Exportación PDF/CSV/XLSX y panel de revisión humana con auditoría.
- Estados del proceso, ficha de proveedores y alertas por antecedentes.
- Chat sobre el proyecto, endurecimiento TLS/AES y ensayo final con el lote.

## 12. Definición de terminado

- `npm run dev` levanta API y web sin errores.
- `npm run batch -- --input <ruta del lote> --out salida.json` produce un archivo válido con 10 identificadores únicos.
- El informe muestra recomendada, tabla comparativa y dictamen por propuesta descartada.
- No existen claves secretas versionadas y los documentos se almacenan cifrados.
- La documentación de este repositorio refleja el estado final del código.
