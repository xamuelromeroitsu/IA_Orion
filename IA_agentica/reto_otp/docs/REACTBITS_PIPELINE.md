# Pipeline (React Bits Pro) en ORION

Esta guía deja visible la estructura necesaria para instalar y usar `Pipeline`, un grafo de flujo de React Bits Pro donde los pasos se ejecutan mientras los datos avanzan entre ellos. ORION lo usa en el panel como representación visual del flujo: proyecto → documentos → evaluación → TCO/dictamen.

## 1. Estructura de archivos

```text
apps/web/
├─ components.json                         # registros públicos y de React Bits Pro
├─ .env.local                              # solo local: REACTBITS_LICENSE_KEY (ignorado por git)
├─ src/presentation/components/
│  └─ ui/
│     └─ pipeline.jsx                      # archivo generado por shadcn (ruta esperada)
└─ src/presentation/pages/
   └─ DashboardPage.jsx                    # integra <Pipeline /> junto al Centro de mando
```

## 2. Configuración previa

`apps/web/components.json` conserva `@react-bits` y añade:

```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json",
    "@reactbits-starter": {
      "url": "https://pro.reactbits.dev/api/r/starter/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REACTBITS_LICENSE_KEY}"
      }
    },
    "@reactbits-pro": {
      "url": "https://pro.reactbits.dev/api/r/pro/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REACTBITS_LICENSE_KEY}"
      }
    }
  }
}
```

La key se pone en `apps/web/.env.local`, junto al `package.json` de la web:

```bash
REACTBITS_LICENSE_KEY=...
```

Nunca pegar la key en docs, logs, commits ni mensajes de chat. El root `.gitignore` ya ignora `.env.local` por el patrón `.env.*`.

## 3. Instalación

Ejecutar siempre desde `apps/web/`:

```bash
npx shadcn@latest add @reactbits-starter/pipeline-tw
```

Si aparece `401`, revisar la key. Si aparece `429`, esperar el tiempo indicado por `Retry-After`; no reintentar en bucle.

## 4. Adaptación ORION

El componente se usa con la configuración exacta solicitada:

```jsx
<Pipeline />
```

Se coloca en una tarjeta nueva dentro de `DashboardPage.jsx`, inmediatamente después de `MagicBento` y antes de la sección “Empieza con un proyecto / TCO por proveedor”. Así se combina con el bloque “Centro de mando” y hace visible el recorrido del producto sin reemplazar los datos reales del tablero.

El componente trae por defecto un pipeline de ejemplo (`lead pipeline`). No se le pasan props para cumplir la configuración pedida. Si en el futuro se quiere reflejar el estado real del proyecto, se pueden usar las props `nodes`, `edges`, `accentColor`, `theme` y `onNodeComplete`.

## 5. Verificación

```bash
npm run lint
npm run build
git diff --check
```

Revisar además que `/` siga respondiendo en `vite preview` y que el bundle no haya crecido de forma inesperada.
