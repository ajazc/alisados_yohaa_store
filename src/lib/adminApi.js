const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || "https://ajazc.com.ar"
).replace(/\/+$/, "");

let accessToken = null;

async function readResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function responseError(response, payload) {
  const detail =
    typeof payload === "string"
      ? payload
      : payload?.detail || payload?.error || JSON.stringify(payload);
  const error = new Error(
    response.status === 401
      ? "La sesion de la API vencio. Ingresa nuevamente."
      : `La API respondio ${response.status}: ${detail || "sin detalles"}`
  );
  error.status = response.status;
  return error;
}

export async function iniciarSesionApi(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload = await readResponse(response);

  if (!response.ok || !payload?.access) {
    throw responseError(response, payload);
  }

  accessToken = payload.access;
}

export async function guardarProductoApi(action, product, image, codigoOriginal) {
  if (!accessToken) throw new Error("Inicia sesion para administrar productos.");
  if (action !== "crear" && action !== "editar") {
    throw new Error("Accion de producto no valida.");
  }

  const formData = new FormData();
  for (const [field, value] of Object.entries(product)) {
    formData.append(field, String(value));
  }
  if (image) formData.append("imagen", image, image.name);

  const path =
    action === "crear"
      ? "/api/productos/"
      : `/api/productos/${encodeURIComponent(codigoOriginal)}/editar/`;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: action === "crear" ? "POST" : "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    body: formData,
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    if (response.status === 401) accessToken = null;
    throw responseError(response, payload);
  }

  return payload;
}

export function cerrarSesionApi() {
  accessToken = null;
}