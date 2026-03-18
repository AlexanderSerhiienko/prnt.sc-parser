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
    batchMaxCount: readPositiveInt(process.env.PARSER_BATCH_MAX_COUNT, 100),
    minIdLength: readPositiveInt(process.env.PARSER_MIN_ID_LENGTH, 5),
    maxIdLength: readPositiveInt(process.env.PARSER_MAX_ID_LENGTH, 9),
    defaultIdLength: readPositiveInt(process.env.PARSER_DEFAULT_ID_LENGTH, 6),
    batchConcurrency: readPositiveInt(process.env.PARSER_BATCH_CONCURRENCY, 1),
    batchAttemptMultiplier: readPositiveInt(process.env.PARSER_BATCH_ATTEMPT_MULTIPLIER, 18),
    maxConcurrentPages: readPositiveInt(process.env.PARSER_MAX_CONCURRENT_PAGES, 1),
    delayMinMs: readPositiveInt(process.env.PARSER_DELAY_MIN_MS, 2200),
    delayMaxMs: readPositiveInt(process.env.PARSER_DELAY_MAX_MS, 4200),
    cooldownMs: readPositiveInt(process.env.PARSER_COOLDOWN_MS, 1000 * 60 * 30),
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
    invalidBatchCount: "Requested batch size is invalid.",
    cooldownActive: "Parser is cooling down after repeated access denials. Please wait before retrying.",
  },
};
