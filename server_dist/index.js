// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";
import * as crypto from "crypto";
import * as https from "https";
import { URL } from "url";
var ALIEXPRESS_API_URL = "https://api-sg.aliexpress.com/sync";
var MAX_PAGE_SIZE = 50;
var MAX_PAGES = 8;
function generateSign(params, appSecret) {
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += appSecret;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}
function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function parseToDateStr(val) {
  if (!val) return void 0;
  if (val.includes("-")) return val;
  const ms = Number(val);
  if (!isNaN(ms) && ms > 1e10) return formatDate(new Date(ms));
  return val;
}
function httpPost(postData) {
  return new Promise((resolve2, reject) => {
    const urlObj = new URL(ALIEXPRESS_API_URL);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Content-Length": Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => resolve2(data));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}
function normalizeOrder(o) {
  return {
    order_id: String(o.order_id || o.parent_order_number || ""),
    sub_order_id: String(o.sub_order_id || o.order_number || ""),
    product_id: String(o.product_id || ""),
    product_title: o.product_title || "",
    product_main_image_url: o.product_main_image_url || "",
    product_detail_url: o.product_detail_url || "",
    product_count: String(o.product_count || "1"),
    payment_amount: (Number(o.paid_amount ?? o.payment_amount ?? 0) / 100).toFixed(2),
    settled_currency: o.settled_currency || "USD",
    commission_rate: o.commission_rate || "0%",
    estimated_paid_amount: (Number(o.estimated_paid_commission ?? o.estimated_paid_amount ?? 0) / 100).toFixed(2),
    created_time: o.created_time || "",
    paid_time: o.paid_time || "",
    finished_time: o.finished_time || "",
    tracking_id: o.tracking_id || "",
    status: o.order_status || o.status || "",
    ship_to_country: o.ship_to_country || ""
  };
}
async function fetchOnePage(params) {
  const timestamp = String(Date.now());
  const reqParams = {
    app_key: params.app_key,
    timestamp,
    sign_method: "md5",
    v: "2.0",
    method: "aliexpress.affiliate.order.list",
    page_no: params.page_no,
    page_size: params.page_size,
    time_type: params.time_type,
    start_time: params.start_time,
    end_time: params.end_time,
    status: params.status
  };
  if (params.fields) reqParams.fields = params.fields;
  reqParams.sign = generateSign(reqParams, params.app_secret);
  const postData = Object.entries(reqParams).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const responseText = await httpPost(postData);
  const responseJson = JSON.parse(responseText);
  const orderResult = responseJson?.aliexpress_affiliate_order_list_response;
  if (!orderResult) {
    const errMsg = responseJson?.error_response?.msg || "Unexpected API response format";
    return { total_record_count: 0, orders: [], error: errMsg };
  }
  const respResult = orderResult.resp_result;
  if (!respResult || respResult.resp_code !== 200 && respResult.resp_code !== 0) {
    return {
      total_record_count: 0,
      orders: [],
      error: respResult?.resp_msg || `API error code: ${respResult?.resp_code}`,
      resp_code: respResult?.resp_code
    };
  }
  const result = respResult.result;
  let rawOrders = result?.orders?.order || [];
  if (!Array.isArray(rawOrders)) rawOrders = [rawOrders];
  return {
    total_record_count: Number(result?.total_record_count || 0),
    orders: rawOrders.map(normalizeOrder)
  };
}
async function fetchReceivedByMonth(app_key, app_secret, finished_month, fields) {
  const now = /* @__PURE__ */ new Date();
  const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, now.getDate(), 0, 0, 0);
  const baseParams = {
    app_key,
    app_secret,
    start_time: formatDate(fiveMonthsAgo),
    end_time: formatDate(now),
    time_type: "1",
    status: "Buyer Confirmed Receipt",
    page_no: "1",
    page_size: String(MAX_PAGE_SIZE),
    fields
  };
  console.log(`Fetching received orders for month ${finished_month}, range: ${baseParams.start_time} \u2192 ${baseParams.end_time}`);
  const firstPage = await fetchOnePage(baseParams);
  if (firstPage.error && firstPage.resp_code !== void 0) {
    if (firstPage.resp_code === 405) {
      return { total_record_count: 0, orders: [] };
    }
    return firstPage;
  }
  let allOrders = [...firstPage.orders];
  const totalCount = firstPage.total_record_count;
  const totalPages = Math.ceil(totalCount / MAX_PAGE_SIZE);
  for (let page = 2; page <= Math.min(totalPages, MAX_PAGES); page++) {
    const pageResult = await fetchOnePage({ ...baseParams, page_no: String(page) });
    if (pageResult.error) break;
    allOrders = allOrders.concat(pageResult.orders);
  }
  const filtered = allOrders.filter((o) => o.finished_time?.startsWith(finished_month));
  return {
    total_record_count: filtered.length,
    orders: filtered
  };
}
async function registerRoutes(app2) {
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const {
        app_key,
        app_secret,
        start_time,
        end_time,
        time_type = "1",
        status,
        page_no = "1",
        page_size = "50",
        fields,
        finished_month
        // "YYYY-MM" — when set, fetches all received orders and filters by finished_time
      } = req.body;
      if (!app_key || !app_secret) {
        return res.status(400).json({ error: "app_key and app_secret are required" });
      }
      if (finished_month) {
        const result = await fetchReceivedByMonth(app_key, app_secret, finished_month, fields);
        return res.json(result);
      }
      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }
      const now = /* @__PURE__ */ new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1e3);
      const firstPage = await fetchOnePage({
        app_key,
        app_secret,
        start_time: parseToDateStr(start_time) || formatDate(thirtyDaysAgo),
        end_time: parseToDateStr(end_time) || formatDate(now),
        time_type: String(time_type),
        status,
        page_no: String(page_no),
        page_size: String(page_size),
        fields
      });
      console.log(`API call: status=${status}, total=${firstPage.total_record_count}, err=${firstPage.error || "none"}`);
      return res.json({
        total_record_count: firstPage.total_record_count,
        current_record_count: firstPage.orders.length,
        orders: firstPage.orders,
        ...firstPage.error ? { error: firstPage.error, resp_code: firstPage.resp_code } : {}
      });
    } catch (error) {
      console.error("Orders API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origin = req.header("origin");
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  if (process.env.NODE_ENV !== "production") {
    log("Development mode: proxying web requests to Expo web server at :8081");
    const expoProxy = createProxyMiddleware({
      target: "http://localhost:8081",
      changeOrigin: true,
      ws: true
    });
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      return expoProxy(req, res, next);
    });
    return;
  }
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
