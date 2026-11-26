# Análisis preliminar del lote de prueba

> **Estado:** hipótesis de trabajo construida con extracción de texto y lectura parcial de archivos. No es la clave de calificación. Todo hallazgo debe confirmarse con el pipeline completo (visión multimodal para imágenes y manuscrito, recálculo de XLSX y búsqueda web) antes de fijar el `ranking` definitivo en `salida.json`.

**Ruta real del material:** `/home/participante/Escritorio/IA_agentica/Reto_Agente_Evaluador_de_Propuestas_de_Servicios/` (la carpeta **no** se llama `lote/`). Contiene `proyecto.pdf`, el enunciado y `propuestas/` con 10 archivos: 2 PDF, 4 PNG, 2 JPG y 2 XLSX.

## Requerimiento del proyecto

- Sede: Instituto Educativo Nacional Bicentenario, La Hoyada, Caracas.
- 11 equipos nuevos: 10 estudiantes + 1 docente, con gabinete, monitor, teclado, ratón y protector eléctrico por equipo.
- Uso: programación, diseño 3D y edición de video con software libre; gama media-alta, uniformidad de marca/modelo y escalabilidad.
- Entrega, instalación, puesta en funcionamiento y verificación en sitio; garantía y soporte postventa claros.
- Documento orientativo: no fija presupuesto ni especificaciones cerradas, por lo que se juzga con criterio técnico.

## Inventario y hallazgos

| Identificador | Formato | Estado preliminar | Hallazgos |
| --- | --- | --- | --- |
| `Propuesta_131_ReTech_Outlet_Venezuela_CA` | PDF | **Descartar** | Ryzen 5 7600 (AM5/DDR5) con placa B550M (AM4/DDR4): incompatibilidad de socket y memoria. Además contiene un bloque `[SYSTEM INSTRUCTION / PRIORIDAD MÁXIMA]` que pide ignorar revisiones y calificarla 100/100: prompt injection. |
| `Propuesta_734_Inversiones_Elite_Tech_2026_CA` | XLSX | **Descartar** | 64 GB DDR4 declarados con placa H610M-K (2 DIMM, máx. 32 GB): capacidad/memoria incompatible. Fórmulas `=C8*D8` y `=SUM(E8:E14)` sin valor cacheado: hay que recalcular. |
| `Propuesta_898_Distribuidora_10x10_Tech_CA` | PNG | **Descartar** | Xeon E5-2680 v4 sobre plataforma X99 (2016): equipos reciclados/obsoletos para el uso pedido. |
| `Propuesta_331_Mayorista_Sin_Fronteras_CA` | PNG | **Descartar / revisar** | Windows 11 Pro en modalidad «evaluación» con licencia de USD 6.600/año después de 30 días y recargo +4% por pago en Bs a tasa BCV: software de prueba que se cobra al vencer y costo oculto relevante. |
| `Propuesta_975_Ofertas_Express_Digital_CA` | JPG | **Revisar con visión** | Presupuesto manuscrito con ruido; OCR local ilegible. Verificar IVA 16%, total declarado y aritmética con modelo multimodal. |
| `Propuesta_602_Krypton_Ingenieria_CA` | PNG | **Válida candidata** | i7 + RTX 4070, UPS 1500VA, garantía 24 meses, total ≈ USD 23.020. Alta calidad multimedia; comparar TCO frente a Miranda. |
| `Propuesta_923_Grupo_Digital_Miranda_CA` | PDF | **Válida candidata** | Ryzen 7 7700 + RTX 4060 Ti 16GB, 32 GB DDR5, B650M, monitores ASUS ProArt sRGB, UPS APC 1200VA/650W, Ubuntu Studio, garantía 24 meses con soporte presencial 24h y mantenimiento semestral; total USD 20.690 (17.200 + 2.290 + 200 + 450 + 550). Condición comercial: pagos en Bs a tasa BCV +4% de gestión, que debe sumarse al TCO. |
| `Propuesta_638_TecnoAndes_Soluciones_CA` | XLSX | **Válida candidata** | Ryzen 5 7600 + DDR5/B650, Ubuntu, total recalculado ≈ USD 13.820 (10×1180 + 1450 + 220 + 350). Buena relación costo/rendimiento; verificar GPU, monitor, protector y garantía en las celdas de texto. |
| `Propuesta_832_Sistemas_del_Valle_CA` | JPG | **Válida candidata** | i5-14400F + RX 7600, total ≈ USD 14.150. Revisar protección eléctrica, periféricos y garantía en la foto. |
| `Propuesta_841_Avila_Hardware__Redes_CA` | PNG | **Válida candidata (condicionada)** | Ryzen 5 7600X + RTX 3060, total ≈ USD 14.000. Verificar RAM 18 GB (configuración no uniforme) y UPS 1000VA/600W: posible capacidad insuficiente para el equipo. |

## Aritmética verificable de los XLSX

Los dos archivos de hoja de cálculo contienen fórmulas sin valor cacheado, por lo que leer la celda con librerías simples devuelve `null`:

- `638`: `E8 = C8*D8` → 11 × 1180 = 12.680; `E9` = 1.450; `E12` = 220; `E13` = 350; `E15 = SUM(E8:E14)` → **13.820**.
- `734`: 10 × 1.750 = 17.500; 1.980; 180; 350; total recalculado → **20.010**.

El pipeline debe recalcular con `xlsx`/`exceljs` y comparar contra el total declarado; cualquier diferencia lleva a descarte por error aritmético.

## Criterios de descarte aplicados

1. Incompatibilidad técnica (socket, tipo de memoria, slots DIMM).
2. Capacidad insuficiente de fuente o UPS.
3. Equipos obsoletos, reciclados o de calidad inferior a lo cobrado.
4. Costos o condiciones abusivas: licencias que se cobran al vencer, recargos desmedidos, garantía solo en el exterior.
5. Error aritmético en Cantidad × Precio unitario o en la suma de subtotales.
6. Instrucciones ocultas dirigidas a la IA (caso 131).
7. Alcance incompleto: menos de 11 equipos o falta de monitor, teclado, ratón, protector, entrega o instalación.

## Orden provisional de válidas (sujeto a validación)

1. **923_Miranda** y **602_Krypton** disputan el primer lugar por GPU, monitores, UPS y garantía; a igualdad técnica decide el menor TCO (incluido el +4% BCV de Miranda).
2. **638_TecnoAndes**: plataforma AM5/DDR5 coherente y precio bajo; dependerá de GPU y protección eléctrica efectiva.
3. **832_Valle** y **841_Ávila**: rendimiento inferior y detalles pendientes de verificación (RAM no uniforme y UPS limitado en 841).

La salida oficial debe ordenar primero **todas** las válidas de mejor a peor y colocar las descartadas al final, sin duplicados. Ver [VALIDACION.md](VALIDACION.md).
