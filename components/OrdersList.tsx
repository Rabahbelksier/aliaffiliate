import React, { useState, useCallback, useMemo } from "react";
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
import { OrderCard } from "@/components/OrderCard";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage, translateApiError } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { fetchOrders, type AliOrder, type FetchOrdersParams, formatDateForApi } from "@/hooks/useOrders";
import type { AppColors } from "@/constants/colors";

interface OrdersListProps {
  status?: string;
  startTime?: string;
  endTime?: string;
  timeType?: string;
  finished_month?: string;
  emptyLabel?: string;
}

const PAGE_SIZE = 10;

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    list: { paddingTop: 12, paddingBottom: 120, flexGrow: 1 },
    loadingOverlay: { position: "absolute", zIndex: 10, top: 80, left: 0, right: 0, alignItems: "center" },
    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, color: c.text, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 14, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
    retryBtn: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: c.primary, borderRadius: 10 },
    retryText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
    footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 },
    countText: { fontSize: 12, color: c.textMuted, fontFamily: "Inter_400Regular", textAlign: "center" },
    paginationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    pageBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
    pageBtnDisabled: { opacity: 0.4 },
    pageBtnText: { fontSize: 14, color: c.text, fontFamily: "Inter_500Medium" },
    pageBtnTextDisabled: { color: c.textMuted },
    pageInfo: { flex: 1, alignItems: "center" },
    pageInfoText: { fontSize: 13, color: c.textSecondary, fontFamily: "Inter_500Medium" },
  });
}

export function OrdersList({ status, startTime, endTime, timeType, finished_month, emptyLabel }: OrdersListProps) {
  const { settings } = useSettings();
  const { t, isRTL } = useLanguage();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [orders, setOrders] = useState<AliOrder[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<AliOrder[]>([]);
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

    try {
      let params: FetchOrdersParams;

      if (finished_month) {
        params = {
          app_key: settings.app_key,
          app_secret: settings.app_secret,
          finished_month,
        };
      } else {
        const now = new Date();
        const defaultStart = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        params = {
          app_key: settings.app_key,
          app_secret: settings.app_secret,
          status,
          page_no: page,
          page_size: PAGE_SIZE,
          time_type: timeType || "1",
          start_time: startTime || formatDateForApi(defaultStart),
          end_time: endTime || formatDateForApi(now),
        };
      }

      const data = await fetchOrders(params);

      if (data.error && data.orders.length === 0) {
        setApiError(data.error);
        setOrders([]);
        setDisplayedOrders([]);
        setTotalCount(0);
      } else {
        const allOrders = data.orders || [];
        setOrders(allOrders);
        setTotalCount(data.total_record_count || allOrders.length);

        if (finished_month) {
          const start = (page - 1) * PAGE_SIZE;
          setDisplayedOrders(allOrders.slice(start, start + PAGE_SIZE));
        } else {
          setDisplayedOrders(allOrders);
        }
        setPageNo(page);
      }
      setHasFetched(true);
    } catch (err: any) {
      setError(translateApiError(err?.message || "", t) || t("dashboard.error"));
      setHasFetched(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [settings, status, startTime, endTime, timeType, finished_month]);

  const navigatePage = useCallback((page: number) => {
    if (finished_month && orders.length > 0) {
      const start = (page - 1) * PAGE_SIZE;
      setDisplayedOrders(orders.slice(start, start + PAGE_SIZE));
      setPageNo(page);
    } else {
      load(page);
    }
  }, [finished_month, orders, load]);

  React.useEffect(() => {
    load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const renderEmpty = () => {
    if (isLoading || !hasFetched) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={40} color={colors.danger} />
          <Text style={styles.emptyTitle}>{t("ordersList.connectionError")}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(1)}>
            <Text style={styles.retryText}>{t("ordersList.tryAgain")}</Text>
          </Pressable>
        </View>
      );
    }

    if (apiError) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={40} color={colors.warning} />
          <Text style={styles.emptyTitle}>{t("ordersList.apiResponse")}</Text>
          <Text style={styles.emptyText}>{translateApiError(apiError, t)}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(1)}>
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={styles.retryText}>{t("ordersList.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t("ordersList.noOrders")}</Text>
        <Text style={styles.emptyText}>{emptyLabel || t("ordersList.noMatch")}</Text>
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      {totalCount > 0 && (
        <Text style={styles.countText}>
          {t("ordersList.showing")} {orders.length} {t("ordersList.of")} {totalCount} {t("ordersList.orders")}
        </Text>
      )}
      {totalPages > 1 && (
        <View style={[styles.paginationRow, isRTL && { flexDirection: "row-reverse" }]}>
          <Pressable
            style={[styles.pageBtn, pageNo <= 1 && styles.pageBtnDisabled]}
            onPress={() => pageNo > 1 && navigatePage(pageNo - 1)}
            disabled={pageNo <= 1 || isLoading}
          >
            <Feather name={isRTL ? "chevron-right" : "chevron-left"} size={18} color={pageNo <= 1 ? colors.textMuted : colors.text} />
            <Text style={[styles.pageBtnText, pageNo <= 1 && styles.pageBtnTextDisabled]}>{t("ordersList.prev")}</Text>
          </Pressable>

          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>{pageNo} / {totalPages}</Text>
          </View>

          <Pressable
            style={[styles.pageBtn, pageNo >= totalPages && styles.pageBtnDisabled]}
            onPress={() => pageNo < totalPages && navigatePage(pageNo + 1)}
            disabled={pageNo >= totalPages || isLoading}
          >
            <Text style={[styles.pageBtnText, pageNo >= totalPages && styles.pageBtnTextDisabled]}>{t("ordersList.next")}</Text>
            <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={pageNo >= totalPages ? colors.textMuted : colors.text} />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading && !isRefreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <FlatList
        data={displayedOrders}
        keyExtractor={(item, idx) => `${item.order_id}_${item.sub_order_id}_${idx}`}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={displayedOrders.length > 0 ? renderFooter : null}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(1, true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        scrollEnabled={!!displayedOrders.length}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
