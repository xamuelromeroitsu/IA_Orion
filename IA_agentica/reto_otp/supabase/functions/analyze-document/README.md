# Edge Function `analyze-document`

Extrae una propuesta con Gemini, devuelve JSON estructurado y guarda el análisis en `document_analyses`.

## 1. Secretos

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son inyectados por Supabase en la Edge Function; no hay que copiarlos al repositorio. Solo se configuran explicitamente las variables de Gemini:

```bash
supabase secrets set GEMINI_API_KEY="<api_key_de_google_ai_studio>"
supabase secrets set GEMINI_MODEL="gemini-2.5-flash"
```

`GEMINI_MODEL` es opcional: si falta, la función usa `gemini-2.5-flash`. Para comprobar los secretos sin mostrarlos:

```bash
supabase secrets list
```

Nunca ejecutar `supabase secrets set` con una clave real dentro de un script versionado ni pegar el valor en un issue, log o informe.

## 2. Despliegue

```bash
supabase link --project-ref "<project_ref>"
supabase db push
supabase functions deploy analyze-document --no-verify-jwt
```

`--no-verify-jwt` permite el modo demo anónimo del MVP. En producción se elimina ese flag y se exige JWT válido, además de borrar las políticas RLS que usan `is_demo_allowed()`.

## 3. Prueba local

```bash
supabase start
supabase db reset
supabase functions serve analyze-document --no-verify-jwt
```

En otra terminal:

```bash
curl -i "http://localhost:54321/functions/v1/analyze-document" \
  -H "Authorization: Bearer <anon_key_local>" \
  -H "Content-Type: application/json" \
  -d '{
    "documentBase64": "<base64_del_documento>",
    "mimeType": "application/pdf",
    "fileName": "propuesta_demo.pdf",
    "instruction": "Extrae proveedor, moneda, total declarado, ítems y letra pequeña.",
    "projectId": "00000000-0000-4000-8000-000000000010",
    "documentId": "00000000-0000-4000-8000-000000000030"
  }'
```

`projectId` y `documentId` son opcionales; si se omiten, el análisis se guarda sin vincular y la UI puede asociarlo después. El campo `documentBase64` admite el prefijo `data:<mime>;base64,`.

## 4. Respuesta

Éxito (`200`): el objeto JSON del esquema con `supplier`, `currency`, `declaredTotal`, `items`, `hiddenCosts`, `warrantyMonths`, `scopeComplete`, `injectionDetected`, `summary`, `conclusion`, `pros`, `cons` y `finePrint`.

Error: `{ "error": { "code": "...", "message": "..." } }`. Códigos posibles: `method_not_allowed`, `missing_configuration`, `invalid_request`, `model_error`, `persistence_error`.

## 5. Seguridad

- La instrucción del sistema va separada del contenido: archivo, MIME e instrucción del usuario se tratan como datos no confiables.
- `responseMimeType: 'application/json'` y `responseSchema` fuerzan la forma de salida; la aritmética, el TCO y el ranking los calcula después el código determinista del backend.
- `CORS` usa `*` solo para el MVP; en producción se restringe al origen de `apps/web`.
- La clave `service_role` permanece en el entorno de la Edge Function y nunca se devuelve en la respuesta.
