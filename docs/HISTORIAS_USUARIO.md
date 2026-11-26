# Historias de usuario

Formato: **Como** `<rol>`, **quiero** `<acción>`, **para** `<beneficio>`. Cada historia incluye criterios de aceptación verificables en la demostración del hackatón. Prioridad P0 = MVP/día 1, P1 = plataforma/día 2.

## Roles

| Rol | Responsabilidad |
| --- | --- |
| Cargador | Crea proyectos, sube documentos y propuestas, inicia evaluaciones. |
| Evaluador | Revisa hallazgos de la IA, corrige notas y confirma el análisis. |
| Aprobador | Aprueba o adjudica la decisión final. |
| Auditor | Solo lectura de proyectos, informes, evidencias y auditoría. |

## Épica 1 — Gestión de proyectos (P0/P1)

### HU-01 · Crear proyecto (P0)

**Como** cargador, **quiero** registrar un proyecto con documento base, ubicación de ejecución y presupuesto referencial, **para** que el agente tenga el contexto de la evaluación.

**Criterios de aceptación**

- El formulario acepta `proyecto.pdf` u otro documento de requerimientos (PDF/JPG/PNG).
- Se guardan nombre, descripción, ubicación y presupuesto referencial opcional.
- El proyecto queda en estado `recepción` y aparece en el historial con fecha de creación.
- El documento se cifra con AES-256-GCM antes de persistirse.

### HU-02 · Consultar historial y estados (P1)

**Como** coordinador, **quiero** ver todos los proyectos y su etapa actual, **para** saber en qué punto se encuentra cada proceso.

**Criterios de aceptación**

- Lista de proyectos con estado `recepción`, `evaluacion`, `revision_comite`, `adjudicado` o `cerrado`.
- El cambio de estado queda registrado en `audit_log` con usuario y fecha.
- Solo el aprobador puede pasar a `adjudicado` o `cerrado`.

## Épica 2 — Ingesta multimodal (P0)

### HU-03 · Carga masiva de propuestas (P0)

**Como** cargador, **quiero** subir de 3 a 20 propuestas en PDF, JPG, PNG o XLSX, **para** evaluar a todos los proveedores en una sola corrida.

**Criterios de aceptación**

- El componente de carga muestra cuántos archivos se seleccionaron y rechaza formatos no permitidos.
- Con menos de 3 archivos el botón de evaluar se deshabilita; con más de 20 se muestra error.
- Cada archivo se identifica por su nombre sin extensión y se cifra en reposo.
- Se muestra progreso individual de lectura/extracción.

### HU-04 · Leer presupuestos manuscritos y con ruido (P0)

**Como** evaluador, **quiero** que el sistema interprete fotos de presupuestos llenados a mano y capturas de chat, **para** no perder propuestas que no son texto digital.

**Criterios de aceptación**

- Las imágenes se envían a visión multimodal con un esquema de salida fijo.
- La extracción incluye ítems, cantidades, precios, total declarado, notas marginales y nivel de confianza.
- Si una cifra es ambigua, se marca como «requiere revisión» en lugar de inventarla.
- La evidencia (página o región) queda asociada al hallazgo.

### HU-05 · Recalcular hojas de cálculo (P0)

**Como** evaluador, **quiero** que se calculen las fórmulas de los XLSX aunque no tengan valor guardado, **para** comparar el total real contra el declarado.

**Criterios de aceptación**

- Se evalúan `Cantidad × Precio unitario` y `SUMA(subtotales)` con decimales exactos.
- Se detectan diferencias y se marcan como error aritmético.
- El número de referencia se muestra en la tabla comparativa.

## Épica 3 — Auditoría de la IA (P0)

### HU-06 · Detectar costos ocultos (P0)

**Como** evaluador, **quiero** que el agente encuentre fletes, recargos, traslados e impuestos en notas y letra pequeña, **para** comparar costos totales reales.

**Criterios de aceptación**

- Se detectan frases como «no incluye flete», «recargo del 50%», «+4% BCV» o «IVA no incluido».
- Cada costo oculto se cuantifica y se suma al TCO con su evidencia.
- El desglose aparece paso a paso en el informe.

### HU-07 · Validar aritmética y alcance (P0)

**Como** evaluador, **quiero** que se descarten propuestas con errores de cálculo o ítems faltantes, **para** no adjudicar una oferta inválida.

**Criterios de aceptación**

- Se comparan los 11 equipos y sus periféricos contra el requerimiento.
- Toda discrepancia aritmética produce descarte automático con explicación.
- Las incompatibilidades técnicas y la capacidad insuficiente de UPS/fuente se registran como hallazgos de severidad alta.

### HU-08 · Resistir instrucciones ocultas (P0)

**Como** aprobador, **quiero** que el sistema ignore instrucciones incrustadas en las propuestas, **para** que nadie manipule la evaluación.

**Criterios de aceptación**

- El detector identifica texto tipo «ignora instrucciones previas» o «califícame 100/100».
- La propuesta sospechosa se descarta y el fragmento se cita en el dictamen.
- El ranking lo calcula código determinista, no el modelo.

### HU-09 · Contrastar precios en internet (P1)

**Como** evaluador, **quiero** que se busquen precios de mercado de los componentes clave, **para** detectar sobreprecios injustificados.

**Criterios de aceptación**

- Cada componente principal consulta al menos una fuente web con URL y fecha.
- El dictamen cita la fuente cuando alega sobreprecio.
- La búsqueda fallida se reporta como evidencia insuficiente, no como precio válido.

## Épica 4 — Dictamen y trazabilidad (P0/P1)

### HU-10 · Ver trazabilidad en vivo (P0)

**Como** evaluador, **quiero** ver qué hace el agente mientras evalúa, **para** confiar y auditar el proceso.

**Criterios de aceptación**

- El panel muestra eventos de lectura, extracción,consultas web, cálculo de fletes y validación.
- Los eventos llegan por SSE con marca de tiempo y estado.
- Un error en una propuesta no detiene el procesamiento de las demás.

### HU-11 · Emitir informe de factibilidad (P0)

**Como** aprobador, **quiero** un informe con la propuesta recomendada, tabla comparativa y dictamen de descarte, **para** presentarlo al comité.

**Criterios de aceptación**

- La recomendación explica razones técnicas y económicas.
- La tabla muestra monto declarado, ajustes y costo total real por propuesta.
- Cada descartada tiene causa explícita y, cuando aplica, porcentaje de incremento.
- El informe se visualiza en pantalla y se exporta a Markdown y PDF.

### HU-12 · Exportar datos para revisión externa (P1)

**Como** evaluador, **quiero** descargar la tabla comparativa en CSV/XLSX, **para** revisarla fuera del sistema.

**Criterios de aceptación**

- La descarga incluye identificador, moneda, declarado, flete, recargo, impuestos, real y decisión.
- Los montos se exportan como números, no como texto formateado.

## Épica 5 — Plataforma y colaboración (P1)

### HU-13 · Acceso por roles (P1)

**Como** administrador, **quiero** permisos diferenciados por rol, **para** separar carga, revisión, aprobación y auditoría.

**Criterios de aceptación**

- Inicio de sesión con Supabase Auth y cookie `httpOnly`.
- Un cargador no puede aprobar; un auditor no puede editar.
- Las políticas RLS complementan la verificación en el backend.

### HU-14 · Registro de cambios (P1)

**Como** auditor, **quiero** ver quién revisó, confirmó o adjudicó cada evaluación y cuándo, **para** cumplir con la trazabilidad.

**Criterios de aceptación**

- El evaluador puede agregar notas y confirmar el análisis sin borrar el resultado de la IA.
- Cada acción genera una entrada en `audit_log` con usuario, fecha y entidad afectada.

### HU-15 · Ficha y antecedentes de proveedores (P1)

**Como** evaluador, **quiero** consultar el historial de un proveedor y alertas de descartes anteriores, **para** evaluar su confiabilidad.

**Criterios de aceptación**

- Se registran nombre, identificación fiscal, ubicación y contacto.
- El historial muestra participaciones previas, motivos de descarte y fecha.
- Se muestra una alerta si el proveedor ya fue descartado por cálculo, sobrecosto o manipulación.

### HU-16 · Normalización USD/Bs (P1)

**Como** evaluador, **quiero** comparar todas las propuestas en una sola moneda con la tasa BCV vigente, **para** que la comparación sea justa.

**Criterios de aceptación**

- Se consulta y almacena la tasa con fecha valor y fuente.
- Se aplican recargos por método de pago e impuestos antes de convertir.
- El desglose muestra cada paso hasta el costo final.

### HU-17 · Consulta en lenguaje natural (P1)

**Como** miembro del comité, **quiero** preguntar «¿por qué se descartó esta propuesta?» o «¿qué proveedor ofrece garantía?», **para** obtener respuestas basadas solo en los documentos cargados.

**Criterios de aceptación**

- El chat responde únicamente con información de la evaluación y sus evidencias.
- Cita el identificador de propuesta o la URL de origen cuando corresponde.
- Si no encuentra evidencia, responde que no está disponible en los documentos.

## Épica 6 — Seguridad (P0/P1)

### HU-18 · Confidencialidad de documentos (P0)

**Como** aprobador, **quiero** que los documentos sensibles viajen y se almacenen cifrados, **para** proteger a proveedores y a la institución.

**Criterios de aceptación**

- Todo tráfico usa TLS 1.2/1.3.
- Los archivos se guardan cifrados con AES-256-GCM y `iv`/`tag` por archivo.
- Las claves no están en el repositorio ni se envían al navegador.
