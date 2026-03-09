import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl } from "@/lib/query-client";

export interface AliOrder {
  order_id: string;
  sub_order_id?: string;
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

const CACHE_PREFIX = "@aliaffiliate_orders_";

export async function fetchOrders(params: FetchOrdersParams): Promise<OrdersResponse> {
  const cacheKey = CACHE_PREFIX + JSON.stringify(params);

  try {
    const baseUrl = getApiUrl();
    const url = new URL("/api/orders", baseUrl).toString();
    const { fetch } = await import("expo/fetch");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: OrdersResponse = await res.json();
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch (err) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      return data;
    }
    throw err;
  }
}

export function useOrdersMutation() {
  return useMutation<OrdersResponse, Error, FetchOrdersParams>({
    mutationFn: fetchOrders,
  });
}
