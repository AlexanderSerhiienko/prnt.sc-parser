import puppeteer from "puppeteer";
import consola from "consola";
import config from "./config.js";
import { withTimeout } from "./utils.js";

const PLACEHOLDER_HOSTS = new Set(["st.prntscr.com"]);
const PLACEHOLDER_PATH_PARTS = ["removed.png", "image-not-found"];

let browserPromise;

function createResult(status, code, message, data = {}) {
  return {
    status,
    code,
    message,
    ...data,
  };
}

function isImageContentType(contentType) {
  return typeof contentType === "string" && contentType.startsWith("image/");
}

function isPlaceholderUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    const normalizedHost = parsedUrl.hostname.toLowerCase();
    const normalizedPath = `${parsedUrl.pathname}${parsedUrl.search}`.toLowerCase();

    return PLACEHOLDER_HOSTS.has(normalizedHost)
      || PLACEHOLDER_PATH_PARTS.some((pathPart) => normalizedPath.includes(pathPart));
  } catch {
    return true;
  }
}

function shouldProxyImage(rawUrl) {
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    return hostname.includes("prnt.sc") || hostname.includes("prntscr.com");
  } catch {
    return false;
  }
}

function normalizeUrl(rawUrl, baseUrl) {
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }

  return browserPromise;
}

async function extractImageSource(page) {
  return page.evaluate(() => {
    const imageElement = document.querySelector("#screenshot-image");
    return imageElement?.getAttribute("src") || null;
  });
}

function buildProxyUrl(baseUrl, imageId) {
  return `${baseUrl.replace(/\/$/, "")}/img/${imageId}`;
}

export async function closeBrowser() {
  if (!browserPromise) {
    return;
  }

  try {
    const browser = await browserPromise;
    await browser.close();
  } catch (error) {
    consola.warn("Browser shutdown failed", error.message);
  } finally {
    browserPromise = null;
  }
}

export async function parseScreenshot({ id, imageCache, proxyBaseUrl }) {
  let page;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(config.parser.navigationTimeoutMs);
    page.setDefaultTimeout(config.parser.operationTimeoutMs);

    const pageUrl = `https://prnt.sc/${id}`;
    const pageResponse = await withTimeout(
      page.goto(pageUrl, { waitUntil: "domcontentloaded" }),
      config.parser.navigationTimeoutMs,
      "Timed out while loading the screenshot page.",
    );

    if (pageResponse && pageResponse.status() >= 400) {
      return createResult("failed", "SCREENSHOT_PAGE_ERROR", "Screenshot page returned an error status.");
    }

    const rawImageSource = await withTimeout(
      extractImageSource(page),
      config.parser.operationTimeoutMs,
      "Timed out while reading the screenshot image.",
    );

    if (!rawImageSource) {
      return createResult("failed", "IMAGE_NOT_FOUND", "Screenshot image was not found on the page.");
    }

    const normalizedImageUrl = normalizeUrl(rawImageSource, page.url());

    if (!normalizedImageUrl) {
      return createResult("failed", "INVALID_IMAGE_URL", "Screenshot image URL is invalid.");
    }

    if (isPlaceholderUrl(normalizedImageUrl)) {
      return createResult("failed", "PLACEHOLDER_IMAGE", "Screenshot page resolved to a placeholder image.");
    }

    const imageResponse = await withTimeout(
      page.goto(normalizedImageUrl, { waitUntil: "networkidle2" }),
      config.parser.navigationTimeoutMs,
      "Timed out while loading the screenshot image.",
    );

    if (!imageResponse) {
      return createResult("failed", "IMAGE_RESPONSE_MISSING", "Image response was empty.");
    }

    const finalImageUrl = page.url();

    if (isPlaceholderUrl(finalImageUrl)) {
      return createResult("failed", "PLACEHOLDER_IMAGE", "Screenshot image was removed.");
    }

    const contentType = imageResponse.headers()["content-type"] || "";

    if (!isImageContentType(contentType)) {
      return createResult("failed", "INVALID_IMAGE_TYPE", "Resolved response is not an image.");
    }

    if (shouldProxyImage(finalImageUrl)) {
      const imageBuffer = await withTimeout(
        imageResponse.buffer(),
        config.parser.operationTimeoutMs,
        "Timed out while buffering the screenshot image.",
      );

      imageCache.set(id, {
        buffer: imageBuffer,
        contentType,
      });

      return createResult("success", "OK", "Screenshot parsed successfully.", {
        id,
        url: buildProxyUrl(proxyBaseUrl, id),
      });
    }

    return createResult("success", "OK", "Screenshot parsed successfully.", {
      id,
      url: finalImageUrl,
    });
  } catch (error) {
    consola.warn(`Failed to parse screenshot ${id}: ${error.message}`);
    return createResult("failed", "PARSER_ERROR", error.message);
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
