function fail(details) {
  const lines = [
    "Deployed SEO smoke check failed.",
    `URL: ${details.url}`,
    `Expected status: ${details.expectedStatus}`,
    `Actual status: ${details.actualStatus}`,
    `Location: ${details.location ?? "-"}`,
    `Reason: ${details.reason}`,
  ];
  console.error(lines.join("\n"));
  process.exit(1);
}

function extractCanonical(html) {
  return html.match(/rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? "";
}

function includesNoindex(html) {
  const robots = html.match(/name="robots"\s+content="([^"]+)"/i)?.[1] ?? "";
  return robots.toLowerCase().includes("noindex");
}

function isTargetLocation(locationHeader, expectedPath) {
  if (!locationHeader) return false;
  if (locationHeader.startsWith(expectedPath)) return true;
  try {
    const parsed = new URL(locationHeader);
    return parsed.pathname === expectedPath;
  } catch {
    return false;
  }
}

const baseUrlRaw = process.env.SEO_SMOKE_BASE_URL;
if (!baseUrlRaw) {
  console.error("Missing required environment variable SEO_SMOKE_BASE_URL.");
  process.exit(1);
}

const baseUrl = new URL(baseUrlRaw);
const expectedModulePath = "/phmax-zakladni-skola";
const missingRoutePath = "/__seo-smoke-route-that-does-not-exist__";

async function fetchCheck(path, options = {}) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, options);
  const body = await response.text();
  return { url: url.toString(), response, body };
}

{
  const { url, response } = await fetchCheck(expectedModulePath, { redirect: "follow" });
  const finalPath = new URL(response.url).pathname;
  if (response.status !== 200) {
    fail({
      url,
      expectedStatus: "200",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "Valid module page must return 200.",
    });
  }
  if (finalPath === "/prehled") {
    fail({
      url,
      expectedStatus: "200 without redirect to /prehled",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "Valid module page redirected to /prehled.",
    });
  }
}

{
  const { url, response, body } = await fetchCheck(missingRoutePath, { redirect: "manual" });
  const canonical = extractCanonical(body);
  if (response.status !== 404) {
    fail({
      url,
      expectedStatus: "404",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "Missing route must return 404.",
    });
  }
  if (!includesNoindex(body)) {
    fail({
      url,
      expectedStatus: "404 page containing noindex",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "404 page does not include noindex robots directive.",
    });
  }
  if (canonical.includes("/prehled")) {
    fail({
      url,
      expectedStatus: "404 page without canonical /prehled",
      actualStatus: String(response.status),
      location: response.headers.get("location"),
      reason: "404 page contains canonical pointing to /prehled.",
    });
  }
}

{
  const sourcePath = "/?view=zs";
  const manual = await fetchCheck(sourcePath, { redirect: "manual" });
  const location = manual.response.headers.get("location");
  if (manual.response.status !== 308 && manual.response.status !== 301) {
    fail({
      url: manual.url,
      expectedStatus: "308 or 301",
      actualStatus: String(manual.response.status),
      location,
      reason: "Legacy query route must redirect.",
    });
  }
  if (!isTargetLocation(location, expectedModulePath)) {
    fail({
      url: manual.url,
      expectedStatus: `Location to ${expectedModulePath}`,
      actualStatus: String(manual.response.status),
      location,
      reason: "Redirect location does not match expected target path.",
    });
  }

  const followed = await fetchCheck(sourcePath, { redirect: "follow" });
  const finalPath = new URL(followed.response.url).pathname;
  if (followed.response.status !== 200) {
    fail({
      url: followed.url,
      expectedStatus: "200 after following redirect",
      actualStatus: String(followed.response.status),
      location: followed.response.headers.get("location"),
      reason: "Final response after redirect is not 200.",
    });
  }
  if (finalPath !== expectedModulePath) {
    fail({
      url: followed.url,
      expectedStatus: `Final URL path ${expectedModulePath}`,
      actualStatus: String(followed.response.status),
      location: followed.response.headers.get("location"),
      reason: `Final URL path is ${finalPath}.`,
    });
  }
}

console.log(`Deployed SEO smoke checks passed for ${baseUrl.origin}`);
