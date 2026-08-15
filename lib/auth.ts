import { apiFetch, setStoredToken } from "./api";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  language: string;
  is_guest: boolean;
  date_of_birth: string | null;
  profile_picture: string;
  level: number;
  xp: number;
  points: number;
  tutorial_completed: boolean;
  date_joined: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function login(username: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function continueAsGuest(): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/guest/", {
    method: "POST",
    body: JSON.stringify({}),
  });
  setStoredToken(data.token);
  return data;
}

export function logout(): void {
  setStoredToken(null);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me/");
}
