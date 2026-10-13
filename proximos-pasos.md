# Próximos pasos — Asset 360 (para retomar otro día)

Última sesión: **2026-10-13**. Avance estimado: **~62 % de toda la actividad** (~73 % del ejercicio guiado, pasos 1 a 7).

> **Si es la primera vez que abres este archivo después de reiniciar:** lee primero
> "1. Cómo retomar" y después "3. Lo que falta". El detalle técnico y los problemas
> conocidos están en `conocimiento.md`.

---

## 1. Cómo retomar (después de reiniciar la computadora)

**Nada se pierde al reiniciar.** Todo el trabajo está guardado en git, en
`C:\Users\mcampass\dev\asset-360`. Lo único que se apaga es la app corriendo y la
conversación con Claude.

### 1.1 Volver a levantar la app
1. Abre **PowerShell**:
   ```
   cd C:\Users\mcampass\dev\asset-360
   npm run dev
   ```
2. Si aparece la ventana de Windows "no puede encontrar el archivo `\https://...`", haz clic en **Aceptar**. Es un error conocido y no afecta.
3. En el navegador abre `https://localhost:3001`. Si dice "Su conexión no es privada": **Avanzado → Continuar a localhost**. Verás "Failed to connect to Fusion host", y es normal.
   **Hay que hacerlo cada vez que se reinicia `npm run dev`** (se genera un certificado nuevo). Para evitarlo: `npx @cognite/cli apps setup-https`.
4. Abre la app dentro de Fusion (guárdala como favorito):
   ```
   https://publicdata.fusion.cognite.com/publicdatacdm//custom-apps/development/asset-360/3001?cluster=api.cognitedata.com&workspace=flows
   ```
5. Deberías ver la barra naranja **"asset-360 in Development Mode"** y la pantalla **Asset 360**.

### 1.2 Volver a trabajar con Claude Code
1. Abre Claude Code **en la carpeta** `C:\Users\mcampass\dev\asset-360`.
2. Pega este mensaje:
   > Estoy retomando el "Flows Builder Certification — Guided Hands-On Build" de Cognite con la app asset-360.
   > Lee `proximos-pasos.md`, `conocimiento.md`, `SPEC.md` y `App-Brief.md` antes de hacer nada.
   > Seguimos con el siguiente paso pendiente. Guíame paso a paso, un paso a la vez, en español, explicando brevemente el porqué.
   > Las capturas de pantalla las dejo en `C:\Users\mcampass\dev\capturas`.
3. Claude ya lee solo `CLAUDE.md`, que tiene las reglas técnicas y la sección 10 con lo aprendido del proyecto.

---

## 2. Lo que hicimos

| Paso de la guía | Estado | Resultado |
|---|---|---|
| **1. Scaffold** | ✅ | App `asset-360` en org `publicdata`, proyecto `publicdatacdm` |
| **2. App Brief** (`flows-app-brief`) | ✅ | `App-Brief.md` (Tier 1, owner Liber11) |
| **3. SPEC** | ✅ | `SPEC.md` verificado con el Cognite Docs MCP; detectamos 2 propiedades inventadas en el SPEC de referencia de la guía |
| **4. Plan** | ✅ | Plan de 6 etapas aprobado |
| **5. Construir y conectar datos** | 🟡 5 de 6 etapas | Ver detalle abajo |
| **6. Diseño con Aura** | 🟡 parcial | Todo usa componentes Aura; falta pulir |
| **7. Revisiones** | ⬜ | — |
| **Certificación** | ⬜ | — |

### Detalle del paso 5 (todo probado con datos reales en Fusion)

| Etapa | Estado | Qué hace |
|---|---|---|
| 1. Bases | ✅ | Estado en la URL (recargar o compartir el link restaura la vista), pantalla de error con Reload |
| 2. Búsqueda + encabezado + recientes | ✅ | Busca activos por tag, nombre o descripción; muestra la jerarquía (`VAL / 23 / …`); lista "Recently viewed" |
| 3. Órdenes de trabajo | ✅ | Tabla Aura con las 100 más recientes + detalle en ventana. `23-PC-9109`: 16 propias, 36 con sub-activos |
| 4. Series de tiempo | ✅ | Lista + un mini-gráfico por serie, anclado al último dato, rangos 1D/7D/30D/1Y, Refresh. Verificado con `CurrentL2` del motor de `23-PC-9109` |
| Extra: "Include sub-assets" | ✅ | Interruptor (encendido por defecto) para incluir lo que cuelga del activo. Necesario porque en Valhall las series están en los instrumentos |
| 5. Documentos | ✅ | Panel + vista previa de PDF/imágenes (visor de Cognite) + descarga. Como los archivos de `publicdatacdm` no están ligados a activos, se muestran los que **contienen el tag en el nombre** (sección "Matched by name — Not linked in CDF"). Verificado: `23-HA-9114` → abre `23-HA-9114_manual.pdf`. F5 restaura activo + documento abierto |
| **6. Layout final** | ⬜ | **Siguiente paso** |

**Calidad actual:** 211 tests pasan, el lint y el build pasan, y todo está guardado en git.

---

## 3. Lo que falta para terminar todo

### 3.1 Etapa 5 — Documentos ✅ (hecha el 2026-10-13)

### 3.2 Etapa 6 — Layout final (siguiente)
- Encabezado arriba; paneles en grilla de 2 columnas en pantallas anchas y apilados en una laptop de 13" (sin scroll horizontal).
- **Arreglar:** la columna **ID** de las órdenes corta textos largos (`FAO-141088-0...`).
- Considerar: el bundle principal pesa ~1 MB (gráficos + tablas); revisar con la skill `performance` antes de la revisión de código.
- Si cambia algo visible, actualizar `SPEC.md`.

### 3.3 Paso 6 de la guía — Pulir el diseño con Aura
- Revisar espacios, estados vacíos y de carga, y que no haya estilos "sueltos" fuera de Aura.
- Opcional: la skill `aura-review` mide el cumplimiento de Aura.

### 3.4 Paso 7 de la guía — Revisiones (obligatorias para certificar)
1. **Antes:** skill `dependencies-audit`. `npm` avisó de vulnerabilidades en dependencias del scaffold.
2. **`flows-code-review`**: repetir hasta tener **0 "Must Fix"**. Exige **≥ 80 % de cobertura de tests** (`npm run test:coverage`).
3. **`flows-design-review`**: genera el informe de diseño. Pide recorrer la app en Fusion como el usuario y puntuar 10 preguntas.

### 3.5 Certificación (entrega)
1. **Autoevaluación de diseño**: promedio **≥ 3,8** en las 10 preguntas (sale de `flows-design-review`).
2. **Subir el repo a GitHub** (cuenta `Liber11`, repo sugerido `asset-360`): crear el repo vacío (sin README) en github.com, después `git remote add origin …` y `git push`. Completar `repoUrl` en `App-Brief.md`. Desde ahí también se puede abrir en **Codespaces** en la computadora personal.
3. **Deploy** (publicar la app en Fusion): `npm run deploy`.
   - ⚠️ Necesita el permiso **`appHostingAcl` WRITE** en `publicdata`. Si no lo tienes, hay que pedirlo. **Es el riesgo más grande fuera de nuestro control: conviene pedirlo con tiempo.**
4. **Demo corta** (video) mostrando: buscar un activo → ver series → ver órdenes → abrir un documento.
5. **`flows-external-app-submit`**: verifica que todo esté en orden y prepara el envío.
6. **Enviar** con la herramienta de certificación (link en la página interna "Cognite Flows Builder Certification: Process, Requirements, and Links"), con los links al repo, al deploy y a la demo.

---

## 4. ¿Hay que guardar algo antes de apagar?

- **El código y los documentos:** no hace falta hacer nada. Todo está en git, en `C:\Users\mcampass\dev\asset-360` (`git status` limpio).
- **Copia de seguridad:** el repo **solo existe en esta computadora**. Hay una copia en
  `OneDrive …\Documents\Cursos\Cognite\asset-360-backup.bundle`. Para restaurarla en otra máquina:
  ```
  git clone asset-360-backup.bundle asset-360
  cd asset-360
  npm install
  ```
  Cuando el repo esté en GitHub, la copia deja de ser necesaria.
- **Capturas de pantalla:** están en `C:\Users\mcampass\dev\capturas`. No son necesarias para continuar.
- **Lo que se pierde y no importa:** la app corriendo (se vuelve a levantar con `npm run dev`), el certificado aceptado en el navegador (se vuelve a aceptar) y el contexto de la conversación (lo reemplazan estos archivos).

---

## 5. Archivos clave del proyecto

| Archivo | Para qué |
|---|---|
| `proximos-pasos.md` | Este archivo: dónde estamos y qué sigue |
| `conocimiento.md` | Procedimientos, problemas conocidos y lo aprendido (en español) |
| `App-Brief.md` | Para quién es la app y qué problema resuelve |
| `SPEC.md` | Qué hace la app: requisitos FR-001…FR-018 y criterios de éxito |
| `CLAUDE.md` / `AGENTS.md` | Reglas de código para el asistente (idénticos) |
| Guía | `C:\Users\mcampass\OneDrive - NTT DATA EMEAL\Documents\Cursos\Cognite\Flows Builder Certification — Guided Hands-On Build.pdf` |
