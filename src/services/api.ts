import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

const resolveApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!rawBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  const normalizedProtocol = rawBaseUrl
    .replace(/^(https?):\/\/(?:https?|http)(?::)?\/\//i, "$1://")
    .replace(/^https\/\//i, "https://")
    .replace(/^http\/\//i, "http://");

  // Allow relative base URLs such as /api for same-origin setups.
  if (normalizedProtocol.startsWith("/")) {
    return normalizedProtocol.replace(/\/+$/, "");
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(normalizedProtocol);
  const withProtocol = hasProtocol
    ? normalizedProtocol
    : `${window.location.protocol}//${normalizedProtocol}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.pathname === "/" || parsed.pathname === "") {
      parsed.pathname = "/api";
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    console.warn(
      `Invalid VITE_API_BASE_URL value: \"${rawBaseUrl}\". Falling back to ${DEFAULT_API_BASE_URL}.`
    );
    return DEFAULT_API_BASE_URL;
  }
};

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queuedRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const flushQueueSuccess = (token: string) => {
  queuedRequests.forEach(({ resolve }) => resolve(token));
  queuedRequests = [];
};

const flushQueueError = (refreshError: unknown) => {
  queuedRequests.forEach(({ reject }) => reject(refreshError));
  queuedRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedRequests.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject
          });
        });
      }

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        redirectToLogin();
        throw error;
      }

      isRefreshing = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const newAccessToken = response.data.accessToken as string;
        const newRefreshToken = response.data.refreshToken as string;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        flushQueueSuccess(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        flushQueueError(refreshError);
        redirectToLogin();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);
function redirectToLogin() {
  window.location.href = "/login";
}

