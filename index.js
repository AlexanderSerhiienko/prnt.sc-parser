import express from "express";
import cors from "cors";
import consola from "consola";
import path from "path";
import config from "./config.js";
import { ImageCache } from "./image-cache.js";
import { closeBrowser, collectScreenshots } from "./parser.js";

const app = express();
const imageCache = new ImageCache(config.cache);
const CLIENT_DIST_DIR = path.resolve("client", "dist");

const circuitBreaker = {
  cooldownUntil: 0,
  lastReason: null,
};

function sendError(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function getRequestBaseUrl(req) {
  if (config.publicBaseUrl) {
    return config.publicBaseUrl;
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto : req.protocol;

  return `${protocol}://${req.get("host")}`;
}

function normalizeBatchCount(rawCount) {
  const parsedCount = Number.parseInt(rawCount ?? "1", 10);

  if (Number.isNaN(parsedCount) || parsedCount < 1 || parsedCount > config.parser.batchMaxCount) {
    return null;
  }

  return parsedCount;
}

function normalizeIdLength(rawLength) {
  if (rawLength === undefined) {
    return config.parser.defaultIdLength;
  }

  const parsedLength = Number.parseInt(rawLength, 10);

  if (
    Number.isNaN(parsedLength)
    || parsedLength < config.parser.minIdLength
    || parsedLength > config.parser.maxIdLength
  ) {
    return null;
  }

  return parsedLength;
}

function createBatchPayload({ requested, items, attempted, failedAttempts }) {
  return {
    items,
    requested,
    returned: items.length,
    attempted,
    failed: failedAttempts,
  };
}

function createBatchError({ requested, returned, failed }) {
  return {
    code: "PARSE_RETRY_LIMIT_EXCEEDED",
    message: `${config.messages.parseFailed} Attempts: ${requested * config.parser.batchAttemptMultiplier}.`,
    requested,
    returned,
    failed,
  };
}

function writeSseEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function createCooldownError() {
  const secondsLeft = Math.max(Math.ceil((circuitBreaker.cooldownUntil - Date.now()) / 1000), 1);

  return {
    code: "ACCESS_DENIED_COOLDOWN",
    message: `${config.messages.cooldownActive} Retry in about ${secondsLeft}s.`,
  };
}

function isCooldownActive() {
  return Date.now() < circuitBreaker.cooldownUntil;
}

function activateCooldown(reason) {
  circuitBreaker.cooldownUntil = Date.now() + config.parser.cooldownMs;
  circuitBreaker.lastReason = reason;
  consola.error(
    `[cooldown] Activated for ${config.parser.cooldownMs}ms because of ${reason}`,
  );
}

async function fetchBatchItems({ targetCount, proxyBaseUrl, idLength }) {
  const maxAttempts = Math.max(targetCount * config.parser.batchAttemptMultiplier, targetCount);
  consola.info(
    `[batch] Fetch target=${targetCount} concurrency=${config.parser.batchConcurrency} maxAttempts=${maxAttempts}`,
  );

  const result = await collectScreenshots({
    targetCount,
    maxAttempts,
    concurrency: config.parser.batchConcurrency,
    imageCache,
    proxyBaseUrl,
    idLength,
    excludedIds: new Set(),
  });

  if (result.failureCounts.ACCESS_DENIED) {
    activateCooldown("ACCESS_DENIED");
  }

  consola.info(
    `[batch] Fetch complete returned=${result.items.length} attempted=${result.attempted} failureCounts=${JSON.stringify(result.failureCounts)}`,
  );

  return result;
}

async function resolveBatch({ requested, proxyBaseUrl, idLength }) {
  consola.info(`[resolveBatch] Requested ${requested} items with idLength=${idLength}`);
  return fetchBatchItems({
    targetCount: requested,
    proxyBaseUrl,
    idLength,
  });
}

async function streamBatch({ requested, proxyBaseUrl, idLength, res, shouldStop }) {
  const maxAttempts = Math.max(requested * config.parser.batchAttemptMultiplier, requested);
  const items = [];

  writeSseEvent(res, "start", {
    requested,
    idLength,
    maxAttempts,
  });

  const result = await collectScreenshots({
    targetCount: requested,
    maxAttempts,
    concurrency: config.parser.batchConcurrency,
    imageCache,
    proxyBaseUrl,
    idLength,
    excludedIds: new Set(),
    shouldStop,
    onProgress(progressEvent) {
      if (shouldStop()) {
        return;
      }

      if (progressEvent.type === "success" && progressEvent.item) {
        items.push(progressEvent.item);
        writeSseEvent(res, "item", {
          item: progressEvent.item,
          requested,
          idLength,
          attempted: progressEvent.attempted,
          returned: progressEvent.successful,
          failed: progressEvent.failed,
        });
      }

      writeSseEvent(res, "progress", {
        requested,
        idLength,
        attempted: progressEvent.attempted,
        returned: progressEvent.successful,
        failed: progressEvent.failed,
        lastEvent: progressEvent.type,
        code: progressEvent.code || null,
      });
    },
  });

  if (result.failureCounts.ACCESS_DENIED) {
    activateCooldown("ACCESS_DENIED");
  }

  return {
    items,
    attempted: result.attempted,
    failedAttempts: result.failedAttempts,
    failureCounts: result.failureCounts,
  };
}

app.use(express.json());
app.use(cors());

app.get("/img/:id", (req, res) => {
  const imageId = req.params.id;

  if (!imageId) {
    return sendError(res, 400, {
      code: "BAD_REQUEST",
      message: config.messages.badRequest,
    });
  }

  const cachedImage = imageCache.get(imageId);

  if (!cachedImage) {
    return sendError(res, 404, {
      code: "IMAGE_NOT_FOUND",
      message: config.messages.invalidImageId,
    });
  }

  res.writeHead(200, {
    "Content-Type": cachedImage.contentType,
    "Content-Length": cachedImage.buffer.length,
    "Cache-Control": "public, max-age=300",
  });

  return res.end(cachedImage.buffer);
});

app.get("/rimg/batch", async (req, res) => {
  consola.info(`[route:/rimg/batch] Request count=${req.query.count}`);
  const requested = normalizeBatchCount(req.query.count);
  const idLength = normalizeIdLength(req.query.length);

  if (!requested || !idLength) {
    return sendError(res, 400, {
      code: "BAD_REQUEST",
      message: `${config.messages.invalidBatchCount} Max count: ${config.parser.batchMaxCount}, id length: ${config.parser.minIdLength}-${config.parser.maxIdLength}.`,
    });
  }

  if (isCooldownActive()) {
    consola.warn(
      `[route:/rimg/batch] Cooldown active until ${new Date(circuitBreaker.cooldownUntil).toISOString()}`,
    );
    return sendError(res, 429, createCooldownError());
  }

  try {
    const proxyBaseUrl = getRequestBaseUrl(req);
    const result = await resolveBatch({ requested, proxyBaseUrl, idLength });
    const payload = createBatchPayload({
      requested,
      items: result.items.slice(0, requested),
      attempted: result.attempted,
      failedAttempts: result.failedAttempts,
    });

    if (!payload.returned) {
      return sendError(res, 502, createBatchError(payload));
    }

    return res.json(payload);
  } catch (error) {
    consola.error(`[route:/rimg/batch] Unhandled error: ${error.message}`);
    return sendError(res, 500, {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error while resolving the batch.",
    });
  }
});

app.get("/rimg/stream", async (req, res) => {
  consola.info(`[route:/rimg/stream] Stream request count=${req.query.count}`);
  const requested = normalizeBatchCount(req.query.count);
  const idLength = normalizeIdLength(req.query.length);

  if (!requested || !idLength) {
    return sendError(res, 400, {
      code: "BAD_REQUEST",
      message: `${config.messages.invalidBatchCount} Max count: ${config.parser.batchMaxCount}, id length: ${config.parser.minIdLength}-${config.parser.maxIdLength}.`,
    });
  }

  if (isCooldownActive()) {
    return sendError(res, 429, createCooldownError());
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let closed = false;
  req.on("close", () => {
    closed = true;
  });

  try {
    const proxyBaseUrl = getRequestBaseUrl(req);
    const result = await streamBatch({
      requested,
      proxyBaseUrl,
      idLength,
      res,
      shouldStop: () => closed,
    });

    if (closed) {
      return;
    }

    if (!result.items.length) {
      writeSseEvent(res, "run-error", createBatchError({
        requested,
        returned: 0,
        failed: result.failedAttempts || requested,
      }));
      res.end();
      return;
    }

    writeSseEvent(res, "done", {
      requested,
      idLength,
      returned: result.items.length,
      attempted: result.attempted,
      failed: result.failedAttempts,
      items: result.items,
    });
    res.end();
  } catch (error) {
    consola.error(`[route:/rimg/stream] Unhandled error: ${error.message}`);

    if (!closed) {
      writeSseEvent(res, "run-error", {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error while streaming screenshots.",
      });
      res.end();
    }
  }
});

app.get("/rimg", async (req, res) => {
  consola.info("[route:/rimg] Single-image request");

  if (isCooldownActive()) {
    consola.warn(
      `[route:/rimg] Cooldown active until ${new Date(circuitBreaker.cooldownUntil).toISOString()}`,
    );
    return sendError(res, 429, createCooldownError());
  }

  try {
    const proxyBaseUrl = getRequestBaseUrl(req);
    const idLength = config.parser.defaultIdLength;
    const result = await resolveBatch({ requested: 1, proxyBaseUrl, idLength });
    const items = result.items.slice(0, 1);

    if (!items.length) {
      return sendError(res, 502, createBatchError({
        requested: 1,
        returned: 0,
        failed: result.failedAttempts || 1,
      }));
    }

    return res.json(items[0]);
  } catch (error) {
    consola.error(`[route:/rimg] Unhandled error: ${error.message}`);
    return sendError(res, 500, {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error while resolving a screenshot.",
    });
  }
});

if (config.isProduction) {
  consola.info("Serving Vite client build");
  app.use("/", express.static(CLIENT_DIST_DIR));

  app.get("*", (_, res) => {
    res.sendFile(path.resolve(CLIENT_DIST_DIR, "index.html"));
  });
}

const server = app.listen(config.port, () => {
  consola.info(`Server is running on port ${config.port}`);
});

async function shutdown(signal) {
  consola.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
