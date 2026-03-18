import express from "express";
import cors from "cors";
import consola from "consola";
import path from "path";
import config from "./config.js";
import { ImageCache } from "./image-cache.js";
import { closeBrowser, parseScreenshot } from "./parser.js";
import { generateRandomId } from "./utils.js";

const app = express();
const imageCache = new ImageCache(config.cache);
const CLIENT_DIST_DIR = path.resolve("client", "dist");

function sendError(res, statusCode, code, message) {
  return res.status(statusCode).json({
    code,
    message,
  });
}

function getRequestBaseUrl(req) {
  if (config.publicBaseUrl) {
    return config.publicBaseUrl;
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto : req.protocol;

  return `${protocol}://${req.get("host")}`;
}

app.use(express.json());
app.use(cors());

app.get("/img/:id", (req, res) => {
  const imageId = req.params.id;

  if (!imageId) {
    return sendError(res, 400, "BAD_REQUEST", config.messages.badRequest);
  }

  const cachedImage = imageCache.get(imageId);

  if (!cachedImage) {
    return sendError(res, 404, "IMAGE_NOT_FOUND", config.messages.invalidImageId);
  }

  res.writeHead(200, {
    "Content-Type": cachedImage.contentType,
    "Content-Length": cachedImage.buffer.length,
    "Cache-Control": "public, max-age=300",
  });

  return res.end(cachedImage.buffer);
});

app.get("/rimg", async (req, res) => {
  const proxyBaseUrl = getRequestBaseUrl(req);

  for (let attempt = 1; attempt <= config.parser.maxAttemptsPerRequest; attempt += 1) {
    const id = generateRandomId();
    consola.info(`Attempt ${attempt}/${config.parser.maxAttemptsPerRequest}: parsing ${id}`);

    const parseResult = await parseScreenshot({
      id,
      imageCache,
      proxyBaseUrl,
    });

    if (parseResult.status === "success") {
      consola.success(`Parsed screenshot ${id}`);
      return res.json({
        id: parseResult.id,
        url: parseResult.url,
      });
    }
  }

  consola.warn("Failed to find a valid screenshot within the retry limit.");

  return sendError(
    res,
    502,
    "PARSE_RETRY_LIMIT_EXCEEDED",
    `${config.messages.parseFailed} Attempts: ${config.parser.maxAttemptsPerRequest}.`,
  );
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
