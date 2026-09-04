import axios from "axios";

// ─── Base URL Resolution ──────────────────────────────────────────────────────
// Prod (Same VPS): Defaults to relative "/api" proxied by Nginx
// Dev / Custom: Resolves from VITE_API_URL environment variable
export const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? "/api"
    : typeof window !== "undefined"
      ? "/api"                        // Browser → Vite proxy → no CORS
      : "http://localhost:8081/api"); // SSR Node.js → direct (no CORS needed)

// ─── Axios instance ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request & normalize duplicate /api prefix
api.interceptors.request.use((config) => {
  if (config.url?.startsWith("/api/")) {
    config.url = config.url.substring(4);
  }
  const token = typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("hitch_token")
    : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 / expired session globally — use a soft redirect to avoid hard-reload loops
let _redirectingToAuth = false;
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const url: string = error.config?.url ?? "";
    // Never auto-redirect on auth endpoints
    const isAuthEndpoint = url.includes("/auth/");
    // Redirect on 401 Unauthorized OR 404 on /users/me (e.g. database reseeded/user deleted)
    const isStaleSession = status === 401 || (status === 404 && url.includes("/users/me"));
    const shouldRedirect = !isAuthEndpoint && isStaleSession && !_redirectingToAuth;

    if (shouldRedirect) {
      _redirectingToAuth = true;
      clearSession();
      window.location.replace("/auth");
      setTimeout(() => {
        _redirectingToAuth = false;
      }, 3000);
    }
    return Promise.reject(error);
  },
);

// ─── Admin Axios instance (uses separate admin token) ────────────────────────
export const adminApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? localStorage.getItem("dac_admin_token")
    : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth helpers ────────────────────────────────────────────────────────────
export function getStoredToken(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  return localStorage.getItem("hitch_token");
}

export function setSession(token: string, userId: string) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.setItem("hitch_token", token);
  localStorage.setItem("hitch_user_id", userId);
}

export function clearSession() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.removeItem("hitch_token");
  localStorage.removeItem("hitch_user_id");
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
