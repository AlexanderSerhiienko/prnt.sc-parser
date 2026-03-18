function readPositiveInt(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

const isProduction = process.env.NODE_ENV === "production";

export default {
  env: process.env.NODE_ENV || "development",
  isProduction,
  port: readPositiveInt(process.env.PORT, 3001),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
  parser: {
    maxAttemptsPerRequest: readPositiveInt(process.env.PARSER_MAX_ATTEMPTS, 12),
    navigationTimeoutMs: readPositiveInt(process.env.PARSER_NAVIGATION_TIMEOUT_MS, 15000),
    operationTimeoutMs: readPositiveInt(process.env.PARSER_OPERATION_TIMEOUT_MS, 12000),
  },
  cache: {
    ttlMs: readPositiveInt(process.env.IMAGE_CACHE_TTL_MS, 1000 * 60 * 10),
    maxEntries: readPositiveInt(process.env.IMAGE_CACHE_MAX_ENTRIES, 100),
  },
  messages: {
    invalidImageId: "Image not found or expired.",
    parseFailed: "Unable to find a valid screenshot right now.",
    badRequest: "Invalid request.",
  },
};
