import puppeteer from "puppeteer";
import consola from "consola";
import config from "./config.js";
import { generateRandomId, randomInt, sleep, withTimeout } from "./utils.js";

const PLACEHOLDER_HOSTS = new Set(["st.prntscr.com"]);
const PLACEHOLDER_PATH_PARTS = ["removed.png", "image-not-found"];
const BLOCKED_RESOURCE_TYPES = new Set(["font", "media", "manifest"]);
const BLOCKED_URL_PARTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "facebook.com/tr",
  "hotjar",
];
const IMAGE_REQUEST_HEADERS = {
  accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

let browserPromise;

function createResult(status, code, message, data = {}) {
  return {
    status,
    code,
    message,
    ...data,
  };
}

function createSemaphore(limit) {
  let activeCount = 0;
  const queue = [];

  function release() {
    activeCount -= 1;
    const nextResolver = queue.shift();

    if (nextResolver) {
      activeCount += 1;
      nextResolver(release);
    }
  }

  return {
    acquire() {
      if (activeCount < limit) {
        activeCount += 1;
        return Promise.resolve(release);
      }

      return new Promise((resolve) => {
        queue.push(resolve);
      });
    },
  };
}

const pageSemaphore = createSemaphore(config.parser.maxConcurrentPages);

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

function isPrntscrImageHost(rawUrl) {
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    return hostname === "image.prntscr.com";
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

function isExpectedScreenshotPageUrl(rawUrl, id) {
  try {
    const parsedUrl = new URL(rawUrl);
    const normalizedHost = parsedUrl.hostname.toLowerCase();
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "");

    if (!normalizedHost.includes("prnt.sc")) {
      return false;
    }

    return normalizedPath === `/${id}`;
  } catch {
    return false;
  }
}

function shouldAbortRequest(request) {
  const resourceType = request.resourceType();
  const requestUrl = request.url().toLowerCase();

  return BLOCKED_RESOURCE_TYPES.has(resourceType)
    || BLOCKED_URL_PARTS.some((blockedPart) => requestUrl.includes(blockedPart));
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

async function preparePage(page) {
  page.setDefaultNavigationTimeout(config.parser.navigationTimeoutMs);
  page.setDefaultTimeout(config.parser.operationTimeoutMs);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (shouldAbortRequest(request)) {
      request.abort().catch(() => {});
      return;
    }

    request.continue().catch(() => {});
  });
}

async function extractImageState(page) {
  return page.evaluate(() => {
    const imageElement = document.querySelector("#screenshot-image");

    if (!imageElement) {
      return null;
    }

    return {
      src: imageElement.getAttribute("src"),
      currentSrc: imageElement.currentSrc || null,
      complete: imageElement.complete,
      naturalWidth: imageElement.naturalWidth,
      naturalHeight: imageElement.naturalHeight,
    };
  });
}

async function waitForImageStateToSettle(page) {
  await sleep(1200);
  return extractImageState(page);
}

function buildProxyUrl(baseUrl, imageId) {
  return `${baseUrl.replace(/\/$/, "")}/img/${imageId}`;
}

async function fetchImageResource(rawUrl) {
  const response = await withTimeout(
    fetch(rawUrl, {
      headers: IMAGE_REQUEST_HEADERS,
      redirect: "follow",
    }),
    config.parser.navigationTimeoutMs,
    "Timed out while loading the screenshot image.",
  );

  return response;
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
  let releasePageSlot;

  try {
    releasePageSlot = await pageSemaphore.acquire();
    const browser = await getBrowser();
    page = await browser.newPage();
    await preparePage(page);

    const pageUrl = `https://prnt.sc/${id}`;
    const pageResponse = await withTimeout(
      page.goto(pageUrl, { waitUntil: "domcontentloaded" }),
      config.parser.navigationTimeoutMs,
      "Timed out while loading the screenshot page.",
    );
    const finalPageUrl = page.url();

    if (pageResponse && pageResponse.status() >= 400) {
      consola.warn(`[parse:${id}] Screenshot page returned ${pageResponse.status()}`);
      if (pageResponse.status() === 403) {
        return createResult("failed", "ACCESS_DENIED", "Screenshot page returned access denied.");
      }

      return createResult("failed", "SCREENSHOT_PAGE_ERROR", "Screenshot page returned an error status.");
    }

    if (!isExpectedScreenshotPageUrl(finalPageUrl, id)) {
      consola.warn(`[parse:${id}] Unexpected screenshot page URL after navigation`);
      return createResult("failed", "UNEXPECTED_PAGE_REDIRECT", "Screenshot page redirected away from the expected id.");
    }

    const imageState = await withTimeout(
      extractImageState(page),
      config.parser.operationTimeoutMs,
      "Timed out while reading the screenshot image.",
    );

    const rawImageSource = imageState?.currentSrc || imageState?.src || null;

    if (!rawImageSource) {
      consola.warn(`[parse:${id}] Missing #screenshot-image src`);
      return createResult("failed", "IMAGE_NOT_FOUND", "Screenshot image was not found on the page.");
    }

    let effectiveImageState = imageState;

    if (isPrntscrImageHost(rawImageSource) && imageState && !imageState.complete) {
      effectiveImageState = await withTimeout(
        waitForImageStateToSettle(page),
        2000,
        "Timed out while waiting for the screenshot image to settle.",
      );
    }

    if (effectiveImageState && effectiveImageState.complete && effectiveImageState.naturalWidth === 0) {
      consola.warn(`[parse:${id}] Screenshot image is broken directly on the page`);
      return createResult("failed", "BROKEN_PAGE_IMAGE", "Screenshot image is broken on the page.");
    }

    const normalizedImageUrl = normalizeUrl(rawImageSource, page.url());

    if (!normalizedImageUrl) {
      consola.warn(`[parse:${id}] Failed to normalize image URL`);
      return createResult("failed", "INVALID_IMAGE_URL", "Screenshot image URL is invalid.");
    }

    if (isPlaceholderUrl(normalizedImageUrl)) {
      consola.warn(`[parse:${id}] Image URL is placeholder: ${normalizedImageUrl}`);
      return createResult("failed", "PLACEHOLDER_IMAGE", "Screenshot page resolved to a placeholder image.");
    }

    if (isPrntscrImageHost(normalizedImageUrl) && effectiveImageState) {
      if (!effectiveImageState.complete) {
        consola.warn(`[parse:${id}] image.prntscr.com image did not finish loading on the page`);
        return createResult("failed", "BROKEN_PAGE_IMAGE", "Screenshot image did not finish loading on the page.");
      }
    }

    const imageResponse = await fetchImageResource(normalizedImageUrl);

    if (!imageResponse) {
      consola.warn(`[parse:${id}] Empty image response`);
      return createResult("failed", "IMAGE_RESPONSE_MISSING", "Image response was empty.");
    }

    if (!imageResponse.ok) {
      consola.warn(`[parse:${id}] Image response returned status ${imageResponse.status}`);
      return createResult("failed", "IMAGE_RESPONSE_ERROR", "Image response returned an error status.");
    }

    const finalImageUrl = imageResponse.url;

    if (isPlaceholderUrl(finalImageUrl)) {
      consola.warn(`[parse:${id}] Final image URL is placeholder`);
      return createResult("failed", "PLACEHOLDER_IMAGE", "Screenshot image was removed.");
    }

    const contentType = imageResponse.headers.get("content-type") || "";

    if (!isImageContentType(contentType)) {
      consola.warn(`[parse:${id}] Invalid image content type`);
      return createResult("failed", "INVALID_IMAGE_TYPE", "Resolved response is not an image.");
    }

    if (shouldProxyImage(finalImageUrl)) {
      const imageBuffer = await withTimeout(
        imageResponse.arrayBuffer(),
        config.parser.operationTimeoutMs,
        "Timed out while buffering the screenshot image.",
      );

      imageCache.set(id, {
        buffer: Buffer.from(imageBuffer),
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
    consola.error(`[parse:${id}] Failed with exception: ${error.message}`);
    return createResult("failed", "PARSER_ERROR", error.message);
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }

    if (releasePageSlot) {
      releasePageSlot();
    }
  }
}

export async function collectScreenshots({
  targetCount,
  maxAttempts,
  concurrency,
  imageCache,
  proxyBaseUrl,
  idLength,
  excludedIds = new Set(),
  onProgress,
  shouldStop,
}) {
  consola.info(
    `[collect] Starting batch collection target=${targetCount} maxAttempts=${maxAttempts} concurrency=${concurrency}`,
  );
  const items = [];
  const seenIds = new Set(excludedIds);
  const failureCounts = {};
  let startedAttempts = 0;

  function registerFailure(code) {
    failureCounts[code] = (failureCounts[code] || 0) + 1;
  }

  function takeNextId() {
    if (items.length >= targetCount || startedAttempts >= maxAttempts) {
      return null;
    }

    let candidateId;
    let generationAttempts = 0;

    do {
      candidateId = generateRandomId(idLength);
      generationAttempts += 1;
    } while (seenIds.has(candidateId) && generationAttempts < 25);

    if (seenIds.has(candidateId)) {
      return null;
    }

    seenIds.add(candidateId);
    startedAttempts += 1;
    return candidateId;
  }

  while (items.length < targetCount && startedAttempts < maxAttempts) {
    if (shouldStop?.()) {
      break;
    }

    const id = takeNextId();

    if (!id) {
      break;
    }

    const parseResult = await parseScreenshot({
      id,
      imageCache,
      proxyBaseUrl,
    });

    if (parseResult.status === "success") {
      items.push({
        id: parseResult.id,
        url: parseResult.url,
      });
      onProgress?.({
        type: "success",
        item: {
          id: parseResult.id,
          url: parseResult.url,
        },
        attempted: startedAttempts,
        successful: items.length,
        failed: startedAttempts - items.length,
      });
    } else {
      registerFailure(parseResult.code);
      consola.warn(
        `[collect] Failed for ${id} with code=${parseResult.code} message="${parseResult.message}"`,
      );
      onProgress?.({
        type: "failure",
        code: parseResult.code,
        message: parseResult.message,
        attempted: startedAttempts,
        successful: items.length,
        failed: startedAttempts - items.length,
      });

      if (parseResult.code === "ACCESS_DENIED") {
        consola.error("[collect] Access denied detected. Stopping batch immediately.");
        break;
      }
    }

    if (items.length < targetCount && startedAttempts < maxAttempts) {
      const delayMs = randomInt(config.parser.delayMinMs, config.parser.delayMaxMs);
      await sleep(delayMs);
    }
  }

  consola.info(
    `[collect] Finished batch collection successes=${items.length} attempts=${startedAttempts} failures=${startedAttempts - items.length}`,
  );
  consola.info(`[collect] Failure counts: ${JSON.stringify(failureCounts)}`);

  return {
    items,
    attempted: startedAttempts,
    failedAttempts: startedAttempts - items.length,
    failureCounts,
  };
}
