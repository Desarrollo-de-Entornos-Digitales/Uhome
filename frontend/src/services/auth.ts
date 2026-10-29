import { apiRequest } from "./api";

export interface AuthUser {
  id: number | string;
  email: string;
  fullName: string;
  username: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.message)) return data.message.join(", ");

    return "Ocurrió un error al comunicarse con el servidor.";
  } catch {
    return "No se pudo procesar la respuesta del servidor.";
  }
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as LoginResponse;
}

export async function logout(token: string): Promise<void> {
  const response = await apiRequest(
    "/auth/logout",
    { method: "POST" },
    token,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}
