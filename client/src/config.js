const fallbackApiUrl = "http://localhost:3001";

export const API_URL = (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/$/, "");
export const MAX_REQUEST_COUNT = 24;
