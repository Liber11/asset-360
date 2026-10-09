# Conocimiento del proyecto — Asset 360

Notas prácticas para trabajar en esta app, escritas mientras la construíamos.
Las reglas técnicas para el asistente están en `CLAUDE.md` (sección 10).

---

## 1. Cómo abrir la app mientras la desarrollas

1. Abre **PowerShell** y ve a la carpeta del proyecto:
   ```
   cd C:\Users\mcampass\dev\asset-360
   npm run dev
   ```
2. **Deja esa ventana abierta** mientras trabajas. Para apagar la app: `Ctrl+C`.
3. Abre la app **dentro de Fusion** con esta dirección (guárdala como favorito):
   ```
   https://publicdata.fusion.cognite.com/publicdatacdm//custom-apps/development/asset-360/3001?cluster=api.cognitedata.com&workspace=flows
   ```
4. La barra naranja **"asset-360 in Development Mode"** confirma que Fusion está mostrando la app que corre en tu PC.
5. Cuando se cambia el código, la página se actualiza sola. Si no, recarga con **F5**.

### Problemas conocidos y su solución

| Lo que ves | Por qué pasa | Qué hacer |
|---|---|---|
| Al ejecutar `npm run dev`: ventana de Windows "no puede encontrar el archivo `\https://...`" | La app intenta abrir Fusion sola y en Windows falla (agrega una `\` al principio) | Clic en **Aceptar** y abre a mano la dirección del punto 3 |
| "Su conexión no es privada" en `https://localhost:3001` | El certificado de seguridad es casero (`self-signed`) | **Avanzado → Continuar a localhost**. Solución definitiva: `npx @cognite/cli apps setup-https` |
| Dentro de Fusion, una nube con "la página web de https://localhost:3001 podría estar teniendo problemas" | El navegador no aceptó el certificado todavía, o `npm run dev` no está corriendo | Abre `https://localhost:3001` en otra pestaña, acepta el certificado y recarga Fusion |
| En `https://localhost:3001`: "Failed to connect to Fusion host" | **Es normal.** La app está hecha para vivir dentro de Fusion; abierta sola no encuentra a Fusion | Usa la dirección del punto 3 |
| "Aplicaciones personalizadas" muestra "No apps available" | Ese es el catálogo de apps **publicadas**. La tuya aún no está publicada (se publica con *deploy* al final) | No es un error. Vuelve con la dirección del punto 3 |
| Escribiste `npm run dev` dentro de la ventana donde ya corre | Esa ventana está ocupada por el servidor | No pasa nada; se ignora. Usa otra ventana para otros comandos |

---

## 2. El camino de la certificación (y dónde estamos)

```
Step 1 scaffold → Step 2 App Brief → Step 3 SPEC → Step 4 plan → Step 5 construir y conectar datos
→ Step 6 diseño con Aura → Step 7 revisiones (flows-code-review, flows-design-review) → envío
```

| Archivo | Para qué sirve |
|---|---|
| `App-Brief.md` | Para quién es la app, qué problema resuelve, cómo se mide el éxito. Lo leen las revisiones finales |
| `SPEC.md` | Qué hace exactamente la app (historias, requisitos FR, criterios SC, modelo de datos). Se actualiza cuando cambia algo visible |
| `CLAUDE.md` / `AGENTS.md` | Reglas de código para el asistente (son idénticos; uno para Claude Code y otro para Cursor) |
| `conocimiento.md` | Este archivo |

Plan de construcción (Step 5), una etapa = un commit:

1. Bases (estado en la URL, errores) ✅
2. Búsqueda + encabezado + recientes ✅ — probado con datos reales
3. Órdenes de trabajo ✅ en código — **pendiente probar con datos reales**
4. Series de tiempo con gráfico
5. Documentos con vista previa
6. Diseño final de la página

---

## 3. Cosas importantes que aprendimos

### Sobre los datos (`publicdatacdm`)
- Los datos son de la plataforma **Valhall** (raíz de la jerarquía: `VAL`).
- El **tag del equipo** (ej. `23-PC-9109`) está en el **nombre** del activo. El identificador interno (`externalId`) lleva un prefijo: `WMT:23-PC-9109`.
- Todo se lee del **Core Data Model** de Cognite, en el space `cdf_cdm`: `CogniteAsset`, `CogniteTimeSeries`, `CogniteActivity` (órdenes de trabajo), `CogniteFile` (documentos).
- Las series, órdenes y documentos "apuntan" al activo mediante su propiedad `assets`.

### Sobre revisar lo que produce el asistente (lo pide la guía)
- El SPEC de referencia de la guía menciona un **"status"** de las órdenes de trabajo, pero `CogniteActivity` **no tiene esa propiedad** en la documentación oficial. Siempre verifica vistas y propiedades contra la documentación (Cognite Docs MCP), no de memoria.
- El primer borrador del gráfico usaba "últimos 7 días desde hoy". Con datos de demo, que pueden ser viejos, el gráfico habría salido vacío. Se corrigió: la ventana de tiempo termina en el **último dato disponible**.

### Decisiones de diseño
- **Lo que queda en la URL** (se restaura al recargar o compartir el link): activo abierto, búsqueda, series marcadas, rango de tiempo y orden de trabajo abierta.
- **Lo que queda solo en tu navegador:** la lista "Recently viewed" (últimos 10 activos, por dispositivo).
- La búsqueda usa el componente `Search` de Aura. La guía sugiere el `Combobox`, pero ese solo filtra una lista fija ya cargada y no puede consultar CDF mientras escribes.
- Cada panel muestra sus propios estados (cargando, vacío, error con **Retry**, sin acceso). Si uno falla, los demás siguen funcionando.
- Cada panel muestra como máximo 100 elementos y avisa si hay más.

---

## 4. Procedimiento técnico (cómo trabajamos)

- **Tests primero:** antes de cada funcionalidad se escriben los tests (fallan), después el código (pasan).
- **Antes de cada commit:** `npm run lint`, `npm test` y `npm run build` tienen que pasar.
- **Commits con formato Conventional Commits:** `feat: ...` (funcionalidad), `fix: ...` (arreglo), `docs: ...` (documentación), `chore: ...` (configuración).
- Tu identidad de git está configurada **solo en este repo**: `Liber11 <libertadcampassi@gmail.com>`.
- **Todo es local por ahora.** Nada se subió a GitHub. Para la entrega final hará falta subir el repo y publicar la app (*deploy*).
- Al instalar librerías, `npm` avisó de **vulnerabilidades en dependencias** que ya venían con el scaffold. Se revisan con la skill `dependencies-audit` antes de `flows-code-review`.

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app en tu PC (puerto 3001) |
| `npm test` | Corre todos los tests |
| `npm run lint` | Revisa el estilo del código |
| `npm run build` | Compila la app como para publicarla |
| `npm run test:coverage` | Mide qué porcentaje del código cubren los tests (la revisión exige 80 % o más) |
| `npx @cognite/cli apps setup-https` | Instala un certificado confiable para `localhost` |
| `npm run deploy` | Publica la app en Fusion (al final) |
