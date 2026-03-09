import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as crypto from "crypto";
import * as https from "https";
import * as http from "http";
import { URL } from "url";

const ALIEXPRESS_API_URL = "https://api-sg.aliexpress.com/sync";

function generateSign(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = appSecret;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += appSecret;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

function httpRequest(urlStr: string, postData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const requester = urlObj.protocol === "https:" ? https : http;
    const req = requester.request(options, (res) => {
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
  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy endpoint for AliExpress Affiliate Order API
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const {
        app_key,
        app_secret,
        start_time,
        end_time,
        time_type,
        status,
        page_no = "1",
        page_size = "10",
        fields,
      } = req.body;

      if (!app_key || !app_secret) {
        return res.status(400).json({ error: "app_key and app_secret are required" });
      }

      const timestamp = String(Date.now());

      const params: Record<string, string> = {
        app_key,
        timestamp,
        sign_method: "md5",
        v: "2.0",
        method: "aliexpress.affiliate.order.get",
        page_no: String(page_no),
        page_size: String(page_size),
      };

      if (start_time) params.start_time = start_time;
      if (end_time) params.end_time = end_time;
      if (time_type) params.time_type = time_type;
      if (status) params.status = status;
      if (fields) params.fields = fields;

      params.sign = generateSign(params, app_secret);

      const postData = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

      const responseText = await httpRequest(ALIEXPRESS_API_URL, postData);
      const responseJson = JSON.parse(responseText);

      // Parse AliExpress nested response
      const orderResult = responseJson?.aliexpress_affiliate_order_get_response;
      if (!orderResult) {
        return res.json({
          total_record_count: 0,
          current_record_count: 0,
          orders: [],
          raw: responseJson,
        });
      }

      if (orderResult.resp_result?.result) {
        const result = orderResult.resp_result.result;
        const orders = result.orders?.order || [];
        return res.json({
          total_record_count: Number(result.total_record_count || 0),
          current_record_count: Number(result.current_record_count || 0),
          orders: Array.isArray(orders) ? orders : [orders],
        });
      }

      return res.json({
        total_record_count: 0,
        current_record_count: 0,
        orders: [],
        resp_result: orderResult.resp_result,
      });
    } catch (error) {
      console.error("AliExpress API error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
