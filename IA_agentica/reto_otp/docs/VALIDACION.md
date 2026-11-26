# Contrato y validación de `salida.json`

El modo lote debe escribir automáticamente `salida.json` en la raíz del repositorio. Esta es la única salida que lee la evaluación automática (25 puntos); el informe y la UI se evalúan por separado (75 puntos).

## 1. Estructura obligatoria

```json
{
  "reto": "propuesta_servicios",
  "repositorio": "grupo/chuao/chuao_grupo1/reto_otp",
  "commit": "4f9c2a1d7e3b8c6a5f0e1d2c3b4a59687f6e5d4c",
  "inicio": "2026-11-27T16:04:12-04:00",
  "fin": "2026-11-27T16:21:08-04:00",
  "procesados": [
    { "archivo": "Propuesta_101_Alfa_CA.pdf", "hora": "2026-11-27T16:04:15-04:00" },
    { "archivo": "Propuesta_202_Beta_CA.jpg", "hora": "2026-11-27T16:04:41-04:00" }
  ],
  "ranking": [
    "Propuesta_303_Gamma_CA",
    "Propuesta_101_Alfa_CA",
    "Propuesta_707_Zeta_CA",
    "Propuesta_202_Beta_CA"
  ]
}
```

## 2. Reglas de cada campo

| Campo | Regla |
| --- | --- |
| `reto` | Literal `propuesta_servicios`. |
| `repositorio` | Ruta del repositorio en el GitLab del hackatón; usar `https://gitlab.nube.gob.ve/grupo/chuao/chuao_grupo1/reto_otp.git` como referencia. |
| `commit` | Hash completo de 40 caracteres obtenido con `git rev-parse HEAD` durante la ejecución. |
| `inicio`, `fin` | ISO 8601 con zona horaria, p. ej. `-04:00` (America/Caracas). `fin` ≥ `inicio`. |
| `procesados` | Un elemento por archivo de `propuestas/`; `archivo` incluye extensión y `hora` es ISO 8601 con zona. |
| `ranking` | Identificadores = nombre de archivo sin extensión. Primero válidas de mejor a peor, luego descartadas en cualquier orden. Sin duplicados. |

## 3. Errores que invalidan o penalizan

- `ranking` con identificadores repetidos → archivo inválido, puntaje 0.
- Identificador que no corresponde a ningún archivo → cuenta como una propuesta descartada puesta por error.
- Propuestas omitidas → se califican igual, pero se pierden los puntos dependientes de ellas.
- Menos de 3 propuestas procesadas o formatos mezclados sin registrar → revisar el cargador.
- Timestamps sin zona horaria o con zona distinta a la exigida → corregir `TZ=America/Caracas`.

## 4. Cálculo automático (referencia)

- **Filtro (8 pts):** `8 × Vk / k`, donde `k` es el número de válidas y `Vk` cuántas válidas están en los primeros `k` puestos.
- **Orden (8 pts):** `8 × (1 − D / Dmax)`, con `D = Σ |puesto_correcto − puesto_obtenido|` sobre las válidas y `Dmax = ⌊k²/2⌋`.
- **Primera (4 pts):** 4 si la primera del ranking es la mejor válida; 0 en caso contrario.
- **Aporte final:** `1,25 × (filtro + orden + primera)`.
- **Desempate:** mayor filtro y menor tiempo `fin − inicio`.

## 5. Procedimiento de validación antes de commit

1. Ejecutar el modo lote:

   ```bash
   npm run batch -- --input "/home/participante/Escritorio/IA_agentica/Reto_Agente_Evaluador_de_Propuestas_de_Servicios" --out salida.json
   ```

   El programa acepta la carpeta que contiene `proyecto.pdf` y `propuestas/`; la ruta del hackatón no se llama `lote/`.

2. Verificar con el validador offline `validador_salida.html`, disponible en:

   ```text
   /home/participante/Hackaton2026_26112026/Hackaton2026/Desafios Individuales/
   Desafios y desarrollos de Aplicaciones en Inteligencia Artificial/validador_salida.html
   ```

   El validador revisa el formato, no las respuestas ni el puntaje.

3. Comprobaciones propias adicionales:

   ```bash
   node -e "const s=require('./salida.json'); const ids=s.ranking; console.log({ reto:s.reto, n:ids.length, unicos:new Set(ids).size, procesados:s.procesados.length });"
   ```

   - `unicos === n` y `n === procesados.length`.
   - Cada `ranking[i]` corresponde al nombre sin extensión de algún archivo en `procesados`.
   - `git rev-parse HEAD === commit`.

4. GitLab ejecuta una comprobación automática de formato en cada commit; asegurarse de que `salida.json` esté versionado y no en `.gitignore`.

## 6. Vestigios del lote

El análisis preliminar de los 10 archivos y la hipótesis de clasificación están en [LOTE_PRUEBAS.md](LOTE_PRUEBAS.md). La decisión final debe salir del pipeline completo, no de ese documento.
