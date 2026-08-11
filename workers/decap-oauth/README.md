# Proxy de autenticación del CMS

Este Worker es lo único que falta para sacar el CMS de Netlify.

**Desplegado el 10 de agosto de 2026** en https://economia-santander-auth.digitautom.workers.dev — vivo pero **sin credenciales todavía**: responde `500 Faltan GITHUB_CLIENT_ID o GITHUB_CLIENT_SECRET` a todo. Eso es lo correcto por ahora y **no cambia nada del portal**: hasta que no se toque `src/admin/`, el CMS sigue entrando por Netlify Identity como hasta hoy y nada apunta a esta URL.

Se desplegó vacío a propósito, para invertir el orden que traía este documento: la OAuth App de GitHub pide una *callback URL* que solo existe después del primer despliegue. Ahora ya se sabe cuál es y se puede pegar de una:

```
https://economia-santander-auth.digitautom.workers.dev/callback
```

## Por qué hace falta

Decap CMS usa hoy `backend: git-gateway` con **Netlify Identity**. La documentación de Decap da Git Gateway por deprecado, y Netlify Identity no existe fuera de Netlify. El reemplazo es `backend: github`, que necesita a alguien que haga el intercambio de OAuth con GitHub — ese paso usa un secreto que no puede vivir en el navegador. Eso es este Worker.

Ventaja de este caso concreto: **Francisco es dueño del repositorio** (`pachogom2000-ux/economia-santander`, con permisos de administrador). El backend `github` exige permiso de escritura y él ya lo tiene. No hay cuentas que crear ni invitaciones que aceptar. Lo único que cambia para él: entra a `/admin/` con su cuenta de GitHub en vez de con usuario y contraseña de Netlify.

## Qué ya está verificado

Probado en local con `wrangler dev` y credenciales falsas:

| Comprobación | Resultado |
|---|---|
| `/auth` redirige a `github.com/login/oauth/authorize` con `scope=repo` | ✅ |
| La cookie de `state` sale `HttpOnly`, `Secure`, `SameSite=Lax`, con prefijo `__Host-` | ✅ |
| `/callback` con `state` inventado | rechazado, 400 |
| `/callback` con `state` bueno pero sin cookie (otro navegador) | rechazado, 400 |
| El *client secret* aparece en alguna respuesta o cabecera | ❌ nunca |
| El token se manda con `postMessage(..., "*")` | ❌ no: solo a orígenes de la lista blanca |

## Pasos para ponerlo en marcha

Queda **una cosa en el navegador** y dos comandos. El despliegue ya está hecho. **Nada de esto toca el portal.**

### 1. Crear la OAuth App en GitHub · *paso de navegador, es el único*

**Settings → Developer settings → OAuth Apps → New OAuth App** (https://github.com/settings/applications/new).

| Campo | Valor |
|---|---|
| Application name | `Economía Santander CMS` |
| Homepage URL | `https://economiasantander.com` |
| Authorization callback URL | `https://economia-santander-auth.digitautom.workers.dev/callback` |

> **De quién debe ser la app.** Lo natural es la cuenta de Francisco, que es el dueño del repositorio. Si se crea en la de Edwin para no depender de una sesión ajena, **no es un callejón sin salida**: GitHub permite transferir una OAuth App a otro usuario u organización desde sus ajustes, y al hacerlo el Client ID y el secreto siguen siendo los mismos. Los dos campos de arriba también son editables después.
>
> Quien entra al CMS se autentica **siempre con su propia cuenta de GitHub**, sea de quien sea la app; lo que la app decide es a nombre de quién se pide el permiso.

Al guardar, GitHub muestra el **Client ID** y deja generar un **Client secret** (se ve una sola vez).

### 2. Poner el Client ID y volver a desplegar

```bash
# 1. Pegar el Client ID en workers/decap-oauth/wrangler.jsonc → vars.GITHUB_CLIENT_ID
# 2. Desplegar
npm run oauth:deploy
```

El Client ID es público —viaja en la URL de GitHub—, por eso sí va en el repositorio.

### 3. Guardar el secreto

```bash
npm run oauth:secret
# pega el Client secret cuando lo pida
```

Queda cifrado en Cloudflare. **Nunca entra al repositorio.**

### 4. Comprobar

```bash
curl -sI "https://economia-santander-auth.digitautom.workers.dev/auth?provider=github" | head -3
```

Debe responder `302` con un `Location` hacia `github.com`. Si es así, el proxy funciona.

Mientras falte cualquiera de los dos valores, responde `500 Faltan GITHUB_CLIENT_ID o GITHUB_CLIENT_SECRET` — que es justo lo que responde hoy.

## Y solo entonces: conectar el CMS

Este es el paso que **sí** cambia cómo entra Francisco. Se hace **con el sitio todavía en Netlify**, a propósito: así el cambio de CMS y el cambio de hosting no se prueban a la vez, y si algo falla se revierte con `git revert` sin que el hosting tenga nada que ver.

> **Ya está escrito, en la rama local `cms-github-oauth`** (10 de agosto de 2026). No se ha fusionado a `main` a propósito: en cuanto llegue a `main`, Netlify despliega y Francisco entra por GitHub. Si eso pasa antes de que el proxy tenga sus credenciales, **se queda sin poder entrar al CMS**. El orden es: crear la OAuth App → `oauth:deploy` → `oauth:secret` → comprobar el `302` → recién ahí fusionar.

**`src/admin/config.yml`** — reemplazar el bloque `backend:`:

```yaml
backend:
  name: github
  repo: pachogom2000-ux/economia-santander
  branch: main
  base_url: https://economia-santander-auth.digitautom.workers.dev
  auth_endpoint: auth
```

> ⚠️ **`base_url` es obligatorio.** Si falta, Decap manda el login a `https://api.netlify.com` por defecto: se saldría de Netlify por la puerta y se volvería a entrar por la ventana.

`publish_mode: editorial_workflow` **se queda como está**. El backend `github` lo soporta: ramas, pull requests y botón de publicar siguen igual.

**`src/admin/index.html`** — quitar el widget de Identity, que ya no pinta nada:

```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

…y el bloque `<script>` que lo usa.

### Prueba de aceptación, con Francisco delante

1. Entra a `/admin/` → debe pedirle GitHub, no usuario y contraseña.
2. Crea un borrador → aparece en "Borradores".
3. Lo pasa por el flujo editorial → se crea la rama y el pull request.
4. Publica → se fusiona y Netlify despliega.

Si algo falla: `git revert` del commit de `src/admin/` y vuelve Identity.

## Notas

- El Worker no guarda nada: no hay base de datos, no hay estado. El token vive en el navegador de Francisco.
- `ORIGENES_PERMITIDOS` solo hace falta para probar desde una URL distinta al dominio real (por ejemplo la de `workers.dev` del sitio). El dominio de producción ya está en el código.
- Si algún día se filtra el secreto: se revoca en GitHub, se genera otro y se vuelve a correr `npm run oauth:secret`. No hay que tocar nada más.
