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
  fromCache?: boolean;
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
  /** "YYYY-MM" — fetches all Buyer Confirmed Receipt orders and filters by finished_time month */
  finished_month?: string;
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

// Get date range from the 1st of the current month until now
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  return {
    start: formatDateForApi(start),
    end: formatDateForApi(now),
  };
}

// Get the maximum allowed range by the AliExpress API (179 days back from now)
export function getMaxAllowedRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getTime() - 179 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  return {
    start: formatDateForApi(start),
    end: formatDateForApi(now),
  };
}

// Returns "YYYY-MM" string for a month offset (0 = this month, -1 = last month)
export function getMonthString(monthOffset = 0): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CACHE_PREFIX = "@aliaffiliate_orders_v3_";
// How long a cached response is considered fresh (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
// How long before a cache entry is fully expired and eligible for cleanup (24 hours)
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Build a stable cache key by normalizing datetime strings to date-only (YYYY-MM-DD).
 * This prevents a new unique key on every call (which was the root cause of cache bloat).
 * The secret key is excluded from the key to avoid storing it.
 */
function buildCacheKey(params: FetchOrdersParams): string {
  const { app_secret: _secret, ...rest } = params;
  const normalized = {
    ...rest,
    // Truncate "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DD" for date-stable keys
    start_time: params.start_time ? params.start_time.split(" ")[0] : undefined,
    end_time: params.end_time ? params.end_time.split(" ")[0] : undefined,
  };
  return CACHE_PREFIX + JSON.stringify(normalized);
}

/**
 * Remove cache entries older than CACHE_MAX_AGE_MS to prevent AsyncStorage bloat.
 * Safe to call in the background — does not throw.
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const orderKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (orderKeys.length === 0) return;

    const now = Date.now();
    const pairs = await AsyncStorage.multiGet(orderKeys);
    const toRemove: string[] = [];

    for (const [key, value] of pairs) {
      if (!value) {
        toRemove.push(key);
        continue;
      }
      try {
        const { ts } = JSON.parse(value);
        if (!ts || now - ts > CACHE_MAX_AGE_MS) {
          toRemove.push(key);
        }
      } catch {
        toRemove.push(key);
      }
    }

    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // Non-critical — never throw from cleanup
  }
}

/**
 * Fetch orders from the backend, with a TTL-aware cache layer.
 *
 * - On network success: update the cache and return fresh data.
 * - On network failure: serve stale cache regardless of TTL as a fallback.
 * - If signal is aborted: rethrow immediately without hitting the cache.
 */
export async function fetchOrders(
  params: FetchOrdersParams,
  signal?: AbortSignal,
): Promise<OrdersResponse> {
  const cacheKey = buildCacheKey(params);

  try {
    const baseUrl = getApiUrl();
    const url = new URL("/api/orders", baseUrl).toString();

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: OrdersResponse = await res.json();

    if (data.error && data.orders.length === 0) {
      throw new Error(data.error);
    }

    // Store fresh result — fire-and-forget, never block the return
    AsyncStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })).catch(() => {});

    return data;
  } catch (err) {
    // Re-throw immediately on abort — do not attempt cache lookup
    if (signal?.aborted) throw err;

    // On any other failure, try to serve the last known good response
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        return { ...data, fromCache: true } as OrdersResponse;
      }
    } catch {
      // Cache read failed — fall through to rethrow
    }

    throw err;
  }
}
