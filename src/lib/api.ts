export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

/**
 * Monta a URL do backend a partir de um caminho.
 * Ex: apiUrl("/estoque") -> "https://seu-backend.com/estoque"
 */
export function apiUrl(path: string) {
  if (!path) return API_BASE_URL;
  // Se alguém passar uma URL completa, devolve como veio.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

