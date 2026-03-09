import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { OrderCard } from "@/components/OrderCard";
import { useSettings } from "@/context/SettingsContext";
import { fetchOrders, type AliOrder, type FetchOrdersParams, formatDateForApi } from "@/hooks/useOrders";

interface OrdersListProps {
  status: string;
  startTime?: string;
  endTime?: string;
  timeType?: string;
  emptyLabel?: string;
}

const PAGE_SIZE = 10;

export function OrdersList({ status, startTime, endTime, timeType, emptyLabel }: OrdersListProps) {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<AliOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const load = useCallback(async (page: number, refresh = false) => {
    setError(null);
    setApiError(null);
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    // Default: last 30 days
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const params: FetchOrdersParams = {
      app_key: settings.app_key,
      app_secret: settings.app_secret,
      status,
      page_no: page,
      page_size: PAGE_SIZE,
      time_type: timeType || "1",
      start_time: startTime || formatDateForApi(defaultStart),
      end_time: endTime || formatDateForApi(now),
    };

    try {
      const data = await fetchOrders(params);

      if (data.error && data.orders.length === 0) {
        setApiError(data.error);
        setOrders([]);
        setTotalCount(0);
      } else {
        setOrders(data.orders || []);
        setTotalCount(data.total_record_count || 0);
        setPageNo(page);
      }
      setHasFetched(true);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders. Check your internet connection.");
      setHasFetched(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings, status, startTime, endTime, timeType]);

  React.useEffect(() => {
    load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const renderEmpty = () => {
    if (isLoading || !hasFetched) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={40} color={Colors.danger} />
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(1)}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (apiError) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={40} color={Colors.warning} />
          <Text style={styles.emptyTitle}>API Response</Text>
          <Text style={styles.emptyText}>{apiError}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(1)}>
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No orders found</Text>
        <Text style={styles.emptyText}>{emptyLabel || "No orders match this filter."}</Text>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      {totalCount > 0 && (
        <Text style={styles.countText}>
          Showing {orders.length} of {totalCount} orders
        </Text>
      )}
      {totalPages > 1 && (
        <View style={styles.paginationRow}>
          <Pressable
            style={[styles.pageBtn, pageNo <= 1 && styles.pageBtnDisabled]}
            onPress={() => pageNo > 1 && load(pageNo - 1)}
            disabled={pageNo <= 1 || isLoading}
          >
            <Feather name="chevron-left" size={18} color={pageNo <= 1 ? Colors.textMuted : Colors.text} />
            <Text style={[styles.pageBtnText, pageNo <= 1 && { color: Colors.textMuted }]}>Prev</Text>
          </Pressable>

          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>{pageNo} / {totalPages}</Text>
          </View>

          <Pressable
            style={[styles.pageBtn, pageNo >= totalPages && styles.pageBtnDisabled]}
            onPress={() => pageNo < totalPages && load(pageNo + 1)}
            disabled={pageNo >= totalPages || isLoading}
          >
            <Text style={[styles.pageBtnText, pageNo >= totalPages && { color: Colors.textMuted }]}>Next</Text>
            <Feather name="chevron-right" size={18} color={pageNo >= totalPages ? Colors.textMuted : Colors.text} />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && !isRefreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      <FlatList
        data={orders}
        keyExtractor={(item, idx) => `${item.order_id}_${item.sub_order_id}_${idx}`}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={orders.length > 0 ? renderFooter : null}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(1, true)}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        scrollEnabled={!!orders.length}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 120,
    flexGrow: 1,
  },
  loadingOverlay: {
    position: "absolute",
    zIndex: 10,
    top: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  countText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
  pageInfo: {
    flex: 1,
    alignItems: "center",
  },
  pageInfoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
});
