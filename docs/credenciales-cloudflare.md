# Credenciales de Cloudflare

Dos caminos. El segundo es el que conviene si no vas a estar frente al teclado en el momento exacto.

---

## Camino 1 — `wrangler login` (rápido, pero con reloj)

```bash
npm exec wrangler login
```

Abre el navegador en la pantalla de autorización de Cloudflare. **Hay que aprobar en unos dos minutos**: pasado ese tiempo wrangler corta con *"Timed out waiting for authorization code"* y hay que volver a empezar. Si no hay sesión de Cloudflare abierta, el tiempo se va en iniciar sesión y casi siempre expira al primer intento.

Sirve bien cuando se lanza el comando y se aprueba de inmediato.

---

## Camino 2 — token de API (sin reloj, y es el que se puede automatizar)

Se crea una vez en el panel, se guarda, y ya no vuelve a pedir nada. Es también el único camino que sirve para despliegues automáticos.

### 1. Crear el token

En **dash.cloudflare.com → Manage Account → Account API Tokens → Create Token**.

Usar la plantilla **"Edit Cloudflare Workers"**, que ya trae los permisos correctos. Si se prefiere armarlo a mano, los mínimos para desplegar son:

| Ámbito | Permiso | Nivel |
|---|---|---|
| Account | Workers Scripts | Edit |
| Account | Account Settings | Read |
| User | User Details | Read |

> Para las fases de DNS (mover el dominio) hacen falta además **Zone → DNS → Edit** y **Zone → Zone Settings → Edit**. No se necesitan todavía: las fases C y D se hacen en el panel.

El token se muestra **una sola vez**. Copiarlo en ese momento.

### 2. Usarlo

En la terminal donde se vaya a trabajar:

```bash
export CLOUDFLARE_API_TOKEN="el-token"     # Git Bash
$env:CLOUDFLARE_API_TOKEN = "el-token"     # PowerShell
```

Comprobar que quedó:

```bash
npm exec wrangler whoami
```

Debe mostrar la cuenta y los permisos. Si dice que no hay autenticación, el token no llegó a la variable.

### 3. Y entonces

```bash
npm run cf:deploy                 # publica el sitio en *.workers.dev
node scripts/comprobar-paridad.mjs https://economia-santander.<sub>.workers.dev
```

Esto es la Fase B completa: Cloudflare vivo en paralelo, sin tocar el dominio ni a Netlify.

---

## Reglas

- **El token nunca entra al repositorio.** Va en una variable de entorno o en `.dev.vars`, que ya está en `.gitignore`. Si alguna vez se pega en un archivo versionado: revocarlo en el panel y crear otro, no basta con borrar la línea.
- Un token se puede revocar en cualquier momento desde el mismo panel donde se creó.
- Si la cuenta de Cloudflare va a ser de Francisco y no tuya, el token debe salir de **su** cuenta: es la que va a quedar como dueña del sitio. Vale la pena decidirlo antes de crear el token, no después.
