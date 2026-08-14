const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface AuthUser {
  id: number;
  email: string;
}

export class ApiError extends Error {}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.detail ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function signUp(email: string, password: string): Promise<AuthUser> {
  return postJson<AuthUser>("/api/auth/signup", { email, password });
}

export function signIn(email: string, password: string): Promise<AuthUser> {
  return postJson<AuthUser>("/api/auth/signin", { email, password });
}
