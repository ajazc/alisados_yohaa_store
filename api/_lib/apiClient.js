/**
 * Cliente de la API Ajazc — SOLO SERVIDOR.
 *
 * Este módulo corre dentro de las funciones serverless de Vercel (/api/*).
 * Nunca debe importarse desde el código del cliente: contiene credenciales.
 *
 * Responsabilidades:
 *  - Login contra /api/auth/login/ y cacheo del access token en memoria.
 *  - Renovación automática: el access token de la API expira a los 60 minutos.
 *  - Un reintento ante 401 por token vencido.
 *
 * El backend (Django) no envia headers CORS, por eso el navegador nunca llama
 * a la API directamente: lo hace esta funcion serverless, que es same-origin.
 */

const API_BASE_URL = (
  process.env.API_BASE_URL || "https://ajazc.com.ar"
).replace(/\/+$/, "");

// Sin default intencional: si faltan las variables, el handler falla con un
// error claro en los logs del server en vez de caerse con una credencial
// hardcodeada en el repo.
const USERNAME = process.env.API_USERNAME;
const PASSWORD = process.env.API_PASSWORD;

/**
 * Cache en memoria del access token.
 *
 * En Vercel las instancias se reutilizan entre invocaciones, asi que este cache
 * evita un login por cada request. El TTL se calcula un poco corto a proposito
 * (5 minutos de margen) para que nunca intentemos reutilizar un token vencido.
 */
let cachedToken = null;
let cachedTokenExpiresAt = 0;
const TOKEN_SAFETY_MARGIN_MS = 5 * 60 * 1000;

async function requestLogin() {
  if (!USERNAME || !PASSWORD) {
    throw new Error(
      "Faltan API_USERNAME / API_PASSWORD. Configuralas en las variables de " +
        "entorno del proyecto (Vercel: Settings > Environment Variables)."
    );
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Login fallido (${response.status}): ${detail.slice(0, 200)}`);
  }

  const { access } = await response.json();
  if (!access) throw new Error("Login sin access token en la respuesta");

  // JWT: payload.<header>.<signature>, base64url. Solo para calcular expiracion.
  const payloadSegment = access.split(".")[1];
  const expSeconds = JSON.parse(
    Buffer.from(payloadSegment, "base64url").toString("utf8")
  ).exp;

  cachedToken = access;
  cachedTokenExpiresAt = expSeconds * 1000 - TOKEN_SAFETY_MARGIN_MS;

  return access;
}

/** Devuelve un token vigente, renovandolo si el cache esta por vencer. */
async function getAccessToken() {
  const stillValid = cachedToken && Date.now() < cachedTokenExpiresAt;
  if (stillValid) return cachedToken;
  return requestLogin();
}

async function apiFetch(path, { retryOnUnauthorized = true } = {}) {
  const token = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  // Token expirado o revocado: se invalida el cache y se reintenta una vez.
  if (response.status === 401 && retryOnUnauthorized) {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
    return apiFetch(path, { retryOnUnauthorized: false });
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${path} respondio ${response.status}: ${detail.slice(0, 200)}`);
  }

  return response.json();
}

export { apiFetch, getAccessToken, API_BASE_URL };
