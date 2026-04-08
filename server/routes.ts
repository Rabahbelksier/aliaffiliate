import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as crypto from "crypto";
import * as https from "https";
import { URL } from "url";
import { pool } from "./db";

const ALIEXPRESS_API_URL = "https://api-sg.aliexpress.com/sync";
const MAX_PAGE_SIZE = 50;
const MAX_PAGES = 8; // up to 400 orders per fetch

function generateSign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += appSecret;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseToDateStr(val: string | undefined): string | undefined {
  if (!val) return undefined;
  if (val.includes("-")) return val;
  const ms = Number(val);
  if (!isNaN(ms) && ms > 1e10) return formatDate(new Date(ms));
  return val;
}

function httpPost(postData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(ALIEXPRESS_API_URL);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Content-Length": Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

interface RawOrder {
  order_id?: string | number;
  parent_order_number?: string | number;
  sub_order_id?: string | number;
  order_number?: string | number;
  product_id?: string | number;
  product_title?: string;
  product_main_image_url?: string;
  product_detail_url?: string;
  product_count?: string | number;
  paid_amount?: string | number;
  payment_amount?: string | number;
  settled_currency?: string;
  commission_rate?: string;
  estimated_paid_commission?: string | number;
  estimated_paid_amount?: string | number;
  created_time?: string;
  paid_time?: string;
  finished_time?: string;
  tracking_id?: string;
  order_status?: string;
  status?: string;
  ship_to_country?: string;
}

function normalizeOrder(o: RawOrder) {
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
    ship_to_country: o.ship_to_country || "",
  };
}

interface ApiCallParams {
  app_key: string;
  app_secret: string;
  start_time: string;
  end_time: string;
  time_type: string;
  status: string;
  page_no: string;
  page_size: string;
  fields?: string;
}

interface PageResult {
  total_record_count: number;
  orders: ReturnType<typeof normalizeOrder>[];
  error?: string;
  resp_code?: number;
}

async function fetchOnePage(params: ApiCallParams): Promise<PageResult> {
  const timestamp = String(Date.now());

  const reqParams: Record<string, string> = {
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
    status: params.status,
  };

  if (params.fields) reqParams.fields = params.fields;
  reqParams.sign = generateSign(reqParams, params.app_secret);

  const postData = Object.entries(reqParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const responseText = await httpPost(postData);
  const responseJson = JSON.parse(responseText);
  const orderResult = responseJson?.aliexpress_affiliate_order_list_response;

  if (!orderResult) {
    const errMsg = responseJson?.error_response?.msg || "Unexpected API response format";
    return { total_record_count: 0, orders: [], error: errMsg };
  }

  const respResult = orderResult.resp_result;

  if (!respResult || (respResult.resp_code !== 200 && respResult.resp_code !== 0)) {
    return {
      total_record_count: 0,
      orders: [],
      error: respResult?.resp_msg || `API error code: ${respResult?.resp_code}`,
      resp_code: respResult?.resp_code,
    };
  }

  const result = respResult.result;
  let rawOrders: RawOrder[] = result?.orders?.order || [];
  if (!Array.isArray(rawOrders)) rawOrders = [rawOrders];

  return {
    total_record_count: Number(result?.total_record_count || 0),
    orders: rawOrders.map(normalizeOrder),
  };
}

/**
 * Fetch ALL pages for "Buyer Confirmed Receipt" orders within a broad 5-month window,
 * then filter results by finished_time matching the given "YYYY-MM" string.
 */
async function fetchReceivedByMonth(
  app_key: string,
  app_secret: string,
  finished_month: string, // e.g. "2026-02"
  fields?: string
): Promise<PageResult> {
  const now = new Date();
  // Use 5 months back to stay safely under the 180-day API limit
  const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, now.getDate(), 0, 0, 0);

  const baseParams: ApiCallParams = {
    app_key,
    app_secret,
    start_time: formatDate(fiveMonthsAgo),
    end_time: formatDate(now),
    time_type: "1",
    status: "Buyer Confirmed Receipt",
    page_no: "1",
    page_size: String(MAX_PAGE_SIZE),
    fields,
  };

  console.log(`Fetching received orders for month ${finished_month}, range: ${baseParams.start_time} → ${baseParams.end_time}`);

  // Fetch first page to get total count
  const firstPage = await fetchOnePage(baseParams);

  if (firstPage.error && firstPage.resp_code !== undefined) {
    // Real error (not just empty result)
    if (firstPage.resp_code === 405) {
      // Empty result is not an error
      return { total_record_count: 0, orders: [] };
    }
    return firstPage;
  }

  let allOrders = [...firstPage.orders];
  const totalCount = firstPage.total_record_count;
  const totalPages = Math.ceil(totalCount / MAX_PAGE_SIZE);

  // Fetch remaining pages (up to MAX_PAGES to avoid abuse)
  for (let page = 2; page <= Math.min(totalPages, MAX_PAGES); page++) {
    const pageResult = await fetchOnePage({ ...baseParams, page_no: String(page) });
    if (pageResult.error) break;
    allOrders = allOrders.concat(pageResult.orders);
  }

  // Filter by finished_time month
  const filtered = allOrders.filter((o) => o.finished_time?.startsWith(finished_month));

  return {
    total_record_count: filtered.length,
    orders: filtered,
  };
}

async function ensureAliAffiliateTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aliaffiliate (
        text_ar  TEXT NOT NULL DEFAULT '',
        text_en  TEXT NOT NULL DEFAULT '',
        btn_ar   TEXT NOT NULL DEFAULT '',
        btn_en   TEXT NOT NULL DEFAULT '',
        link     TEXT NOT NULL DEFAULT '',
        version  TEXT NOT NULL DEFAULT '0.0.0',
        baner    TEXT NOT NULL DEFAULT 'off'
      )
    `);
    console.log("aliaffiliate table ready");
  } catch (err) {
    console.error("Failed to ensure aliaffiliate table:", err);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureAliAffiliateTable();

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/affiliate-config", async (_req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM aliaffiliate LIMIT 1");
      if (result.rows.length === 0) {
        return res.json(null);
      }
      return res.json(result.rows[0]);
    } catch (err) {
      console.error("affiliate-config error:", err);
      return res.status(500).json({ error: "Failed to fetch affiliate config" });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
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
        finished_month, // "YYYY-MM" — when set, fetches all received orders and filters by finished_time
      } = req.body;

      if (!app_key || !app_secret) {
        return res.status(400).json({ error: "app_key and app_secret are required" });
      }

      // Special mode: fetch all received orders filtered by finished_time month
      if (finished_month) {
        const result = await fetchReceivedByMonth(app_key, app_secret, finished_month, fields);
        return res.json(result);
      }

      // Standard mode: direct passthrough to AliExpress API
      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

      const firstPage = await fetchOnePage({
        app_key,
        app_secret,
        start_time: parseToDateStr(start_time) || formatDate(thirtyDaysAgo),
        end_time: parseToDateStr(end_time) || formatDate(now),
        time_type: String(time_type),
        status,
        page_no: String(page_no),
        page_size: String(page_size),
        fields,
      });

      console.log(`API call: status=${status}, total=${firstPage.total_record_count}, err=${firstPage.error || "none"}`);

      return res.json({
        total_record_count: firstPage.total_record_count,
        current_record_count: firstPage.orders.length,
        orders: firstPage.orders,
        ...(firstPage.error ? { error: firstPage.error, resp_code: firstPage.resp_code } : {}),
      });
    } catch (error) {
      console.error("Orders API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/tracking-ids", async (req: Request, res: Response) => {
    try {
      const { app_key, app_secret } = req.body;
      if (!app_key || !app_secret) {
        return res.status(400).json({ error: "app_key and app_secret are required" });
      }

      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      const statuses = ["Payment Completed", "Income Settled", "Buyer Confirmed Receipt"];
      const allIds = new Set<string>();

      for (const status of statuses) {
        try {
          const page = await fetchOnePage({
            app_key,
            app_secret,
            start_time: formatDate(sixMonthsAgo),
            end_time: formatDate(now),
            time_type: "1",
            status,
            page_no: "1",
            page_size: "50",
          });
          for (const order of page.orders) {
            if (order.tracking_id && order.tracking_id.trim()) {
              allIds.add(order.tracking_id.trim());
            }
          }
        } catch {}
      }

      return res.json({ tracking_ids: Array.from(allIds) });
    } catch (error) {
      console.error("Tracking IDs API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/links/generate", async (req: Request, res: Response) => {
    try {
      const { app_key, app_secret, source_values, tracking_id, promotion_link_type = 0 } = req.body;

      if (!app_key || !app_secret) {
        return res.status(400).json({ error: "app_key and app_secret are required" });
      }
      if (!source_values) {
        return res.status(400).json({ error: "source_values is required" });
      }

      const timestamp = String(Date.now());
      const reqParams: Record<string, string> = {
        app_key,
        timestamp,
        sign_method: "md5",
        v: "2.0",
        method: "aliexpress.affiliate.link.generate",
        source_values: String(source_values),
        promotion_link_type: String(promotion_link_type),
        tracking_id: String(tracking_id || ""),
      };

      reqParams.sign = generateSign(reqParams, app_secret);

      const postData = Object.entries(reqParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

      const responseText = await httpPost(postData);
      const responseJson = JSON.parse(responseText);

      console.log("Link generate API response:", JSON.stringify(responseJson).slice(0, 500));

      return res.json(responseJson);
    } catch (error) {
      console.error("Link generate API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
