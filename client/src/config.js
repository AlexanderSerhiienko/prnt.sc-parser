const fallbackApiUrl = "http://localhost:3001";

export const API_URL = (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/$/, "");
export const MAX_REQUEST_COUNT = 100;
export const ID_LENGTH_OPTIONS = [5, 6, 7, 8, 9];
export const DEFAULT_ID_LENGTH = 6;
