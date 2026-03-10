import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as crypto from "crypto";
import * as https from "https";
import { URL } from "url";

const ALIEXPRESS_API_URL = "https://api-sg.aliexpress.com/sync";

// Correct AliExpress MD5 signature generation
function generateSign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += appSecret;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

// Format JS Date to AliExpress date format: YYYY-MM-DD HH:MM:SS
function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Parse incoming date value (can be timestamp or already formatted string)
function parseToDateStr(val: string | undefined): string | undefined {
  if (!val) return undefined;
  // If it's already a formatted date string
  if (val.includes("-")) return val;
  // If it's a timestamp (ms)
  const ms = Number(val);
  if (!isNaN(ms) && ms > 1e10) {
    return formatDate(new Date(ms));
  }
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

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy endpoint for AliExpress Affiliate Order API
  // Uses: aliexpress.affiliate.order.list (correct method for affiliate orders)
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
        page_size = "10",
        fields,
      } = req.body;

      if (!app_key || !app_secret) {
        return res.status(400).json({ error: "app_key and app_secret are required" });
      }

      const timestamp = String(Date.now());

      // Default date range: last 30 days (must be < 180 days per API limit)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

      const params: Record<string, string> = {
        app_key,
        timestamp,
        sign_method: "md5",
        v: "2.0",
        method: "aliexpress.affiliate.order.list",
        page_no: String(page_no),
        page_size: String(page_size),
        time_type: String(time_type),
        start_time: parseToDateStr(start_time) || formatDate(thirtyDaysAgo),
        end_time: parseToDateStr(end_time) || formatDate(now),
      };

      if (status) params.status = status;
      if (fields) params.fields = fields;

      params.sign = generateSign(params, app_secret);

      const postData = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

      console.log("Calling AliExpress API with method:", params.method, "status:", status);
      const responseText = await httpPost(postData);
      const responseJson = JSON.parse(responseText);

      // Handle aliexpress.affiliate.order.list response structure
      const orderResult = responseJson?.aliexpress_affiliate_order_list_response;

      if (!orderResult) {
        console.error("Unexpected API response:", JSON.stringify(responseJson).substring(0, 500));
        return res.json({
          total_record_count: 0,
          current_record_count: 0,
          orders: [],
          error: responseJson?.error_response?.msg || "Unexpected API response format",
          raw: responseJson,
        });
      }

      const respResult = orderResult.resp_result;

      // API error
      if (!respResult || (respResult.resp_code !== 200 && respResult.resp_code !== 0)) {
        console.error("AliExpress API error:", respResult?.resp_code, respResult?.resp_msg);
        return res.json({
          total_record_count: 0,
          current_record_count: 0,
          orders: [],
          error: respResult?.resp_msg || `API error code: ${respResult?.resp_code}`,
          resp_code: respResult?.resp_code,
        });
      }

      const result = respResult.result;
      let orders = result?.orders?.order || [];
      if (!Array.isArray(orders)) orders = [orders];

      // Normalize field names from API response to consistent format
      const normalizedOrders = orders.map((o: any) => ({
        order_id: String(o.order_id || o.parent_order_number || ""),
        sub_order_id: String(o.sub_order_id || o.order_number || ""),
        product_id: String(o.product_id || ""),
        product_title: o.product_title || "",
        product_main_image_url: o.product_main_image_url || "",
        product_detail_url: o.product_detail_url || "",
        product_count: String(o.product_count || "1"),
        payment_amount: ((Number(o.paid_amount ?? o.payment_amount ?? 0)) / 100).toFixed(2),
        settled_currency: o.settled_currency || "USD",
        commission_rate: o.commission_rate || "0%",
        estimated_paid_amount: ((Number(o.estimated_paid_commission ?? o.estimated_paid_amount ?? 0)) / 100).toFixed(2),
        created_time: o.created_time || "",
        paid_time: o.paid_time || "",
        finished_time: o.finished_time || "",
        tracking_id: o.tracking_id || "",
        status: o.order_status || o.status || "",
        ship_to_country: o.ship_to_country || "",
      }));

      return res.json({
        total_record_count: Number(result?.total_record_count || 0),
        current_record_count: Number(result?.current_record_count || 0),
        orders: normalizedOrders,
      });
    } catch (error) {
      console.error("Orders API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
