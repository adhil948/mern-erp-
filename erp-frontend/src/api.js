import { useAppState } from "./context/AppContext";
import axios from "axios";

export function useApi() {
  const { token, activeOrgId } = useAppState();

  const api = axios.create({
    baseURL: "http://3.110.253.196:5000/api",
  });

  api.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (activeOrgId) config.headers["X-Org-Id"] = typeof activeOrgId === 'string'
      ? activeOrgId
      : activeOrgId?.toString?.();
    return config;
  });

  return api;
}
