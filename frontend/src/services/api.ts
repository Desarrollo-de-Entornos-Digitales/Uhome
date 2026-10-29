const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  if (!API_URL) {
    throw new Error("Falta configurar NEXT_PUBLIC_API_URL.");
  }

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });
}
