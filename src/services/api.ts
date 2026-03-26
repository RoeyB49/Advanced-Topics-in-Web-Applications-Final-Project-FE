import axios from "axios";

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000/api"
  : "/api";

const normalizeApiBaseUrl = (rawBaseUrl: string) => {
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

  const parsed = new URL(withProtocol);
  if (parsed.pathname === "/" || parsed.pathname === "") {
    parsed.pathname = "/api";
  }

  return parsed.toString().replace(/\/+$/, "");
};

const selectApiBaseUrlByHost = (candidates: string[]) => {
  const currentHost = window.location.hostname;

  const exactHostMatch = candidates.find((candidate) => {
    if (candidate.startsWith("/")) {
      return false;
    }

    try {
      return new URL(candidate).hostname === currentHost;
    } catch {
      return false;
    }
  });

  return exactHostMatch ?? candidates[0];
};

const resolveApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!rawBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const candidates = rawBaseUrl
      .split(",")
      .map((item: string) => item.trim())
      .filter(Boolean)
      .map(normalizeApiBaseUrl);

    if (!candidates.length) {
      return DEFAULT_API_BASE_URL;
    }

    return selectApiBaseUrlByHost(candidates);
  } catch {
    console.warn(
      `Invalid VITE_API_BASE_URL value: \"${rawBaseUrl}\". Falling back to ${DEFAULT_API_BASE_URL}.`
    );
    return DEFAULT_API_BASE_URL;
  }
};

const API_BASE_URL = resolveApiBaseUrl();

const resolveApiOrigin = () => {
  if (API_BASE_URL.startsWith("/")) {
    return window.location.origin;
  }

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
};

const API_ORIGIN = resolveApiOrigin();

export const resolveApiAssetUrl = (assetPath?: string) => {
  if (!assetPath) {
    return undefined;
  }

  if (/^https?:\/\//i.test(assetPath)) {
    try {
      const parsed = new URL(assetPath);
      const isLocalhostAsset =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "::1";

      if (isLocalhostAsset && parsed.origin !== API_ORIGIN) {
        return `${API_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      return assetPath;
    } catch {
      return assetPath;
    }
  }

  if (assetPath.startsWith("//")) {
    return `${window.location.protocol}${assetPath}`;
  }

  const normalizedPath = assetPath.startsWith("/")
    ? assetPath
    : `/${assetPath}`;

  return `${API_ORIGIN}${normalizedPath}`;
};

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

