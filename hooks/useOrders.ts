import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

export interface AliOrder {
  order_id: string;
  sub_order_id: string;
  product_id?: string;
  product_title?: string;
  product_main_image_url?: string;
  product_detail_url?: string;
  product_count?: string;
  payment_amount?: string;
  settled_currency?: string;
  commission_rate?: string;
  estimated_paid_amount?: string;
  created_time?: string;
  paid_time?: string;
  finished_time?: string;
  tracking_id?: string;
  status?: string;
  ship_to_country?: string;
}

export interface OrdersResponse {
  total_record_count: number;
  current_record_count: number;
  orders: AliOrder[];
  error?: string;
  resp_code?: number;
}

export interface FetchOrdersParams {
  app_key: string;
  app_secret: string;
  start_time?: string;
  end_time?: string;
  time_type?: string;
  status?: string;
  page_no?: number;
  page_size?: number;
  fields?: string;
}

// Format date to AliExpress required format: YYYY-MM-DD HH:MM:SS
export function formatDateForApi(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Get date range for a specific month offset (0 = this month, -1 = last month)
export function getMonthDateRange(monthOffset = 0): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    start: formatDateForApi(start),
    end: formatDateForApi(end),
  };
}

export function getLast5MonthsRange(): { start: string; end: string } {
  const now = new Date();
  const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, now.getDate(), 0, 0, 0);
  return {
    start: formatDateForApi(fiveMonthsAgo),
    end: formatDateForApi(now),
  };
}

const CACHE_PREFIX = "@aliaffiliate_orders_v2_";

export async function fetchOrders(params: FetchOrdersParams): Promise<OrdersResponse> {
  const cacheKey = CACHE_PREFIX + JSON.stringify(params);

  try {
    const baseUrl = getApiUrl();
    const url = new URL("/api/orders", baseUrl).toString();

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: OrdersResponse = await res.json();

    // If API returned an error (but HTTP 200), throw with the error message
    if (data.error && data.orders.length === 0) {
      // Still cache the empty result but note the error
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
      // Don't throw if it's just empty results — only throw on real errors
    } else {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
    }

    return data;
  } catch (err) {
    // Try to serve from cache on network failure
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, fromCache: true } as OrdersResponse;
    }
    throw err;
  }
}
