import axios from "axios";
import { getBackendBaseUrl } from "./image-utils";

export function getApiBaseUrl() {
  return `${getBackendBaseUrl()}/api`;
}

export function createApiUrl(pathname) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

export default api;
