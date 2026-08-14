import axios from "axios";

let accessToken = null;
let csrfToken = localStorage.getItem("csrfToken");

export const setAuthTokens = ({ accessToken: nextAccessToken, csrfToken: nextCsrfToken }) => {
  accessToken = nextAccessToken || null;
  csrfToken = nextCsrfToken || null;
  if (csrfToken) localStorage.setItem("csrfToken", csrfToken);
  else localStorage.removeItem("csrfToken");
};

export const clearAuthTokens = () => setAuthTokens({ accessToken: null, csrfToken: null });

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (csrfToken && !config.headers["X-CSRF-Token"]) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isRefreshRequest = request?.url?.endsWith("/users/refresh");
    const isLoginRequest = request?.url?.endsWith("/users/login");

    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !request._skipAuthRefresh &&
      !isRefreshRequest &&
      !isLoginRequest &&
      csrfToken
    ) {
      request._retry = true;
      try {
        const response = await apiClient.post("/users/refresh", null, {
          _skipAuthRefresh: true,
          headers: { "X-CSRF-Token": csrfToken },
        });
        setAuthTokens(response.data);
        request.headers.Authorization = `Bearer ${accessToken}`;
        request.headers["X-CSRF-Token"] = csrfToken;
        return apiClient(request);
      } catch {
        // The common cleanup path below intentionally handles refresh failure.
      }
    }

    if (error.response?.status === 401 && !isRefreshRequest) {
      clearAuthTokens();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
